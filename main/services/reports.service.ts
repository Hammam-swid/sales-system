import type {
  BalancesReport,
  ProductsReport,
  ProfitReport,
  SalesGrouping,
  SalesPeriod,
  SalesReport
} from '../../shared/reports'
import { roundTo } from '../../shared/sales'
import { getDataSource } from '../database/data-source'
import { Customer, Supplier } from '../database/entities'
import { AppError } from '../errors'
import { toPartyDto } from './party.helpers'
import { asDate, asObject, asOneOf } from './validation'

const MAX_PERIODS = 800
const TOP_PRODUCTS = 10

const money = (value: unknown): number => roundTo(Number(value) || 0, 2)
const quantity = (value: unknown): number => roundTo(Number(value) || 0, 3)

function parseRange(payload: unknown): { from: string; to: string } {
  const input = asObject(payload)
  const from = asDate(input.from, 'from')
  const to = asDate(input.to, 'to')
  if (from > to) throw new AppError('VALIDATION', 'range')
  return { from, to }
}

// Timestamps are stored in UTC; reports work in the shop's local calendar days.
const LOCAL_DAY = "date(s.created_at, 'localtime')"

// Sales on the local days `from`..`to`, written so an index can do the work (takes rangeParams()).
// Converting every row's time to local time cannot use an index, so:
// - an outer UTC window, one day wider on each side, narrows rows through idx_sales_created_at;
// - rows in an inner UTC window are inside the range in any time zone (offsets up to ±14 h);
// - only rows near the two edges get the exact local-day test.
const IN_RANGE = `s.created_at >= ? AND s.created_at < ?
  AND ((s.created_at >= ? AND s.created_at < ?) OR ${LOCAL_DAY} BETWEEN ? AND ?)`

function shiftDay(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return toDay(date)
}

function rangeParams(from: string, to: string): string[] {
  return [
    `${shiftDay(from, -1)} 00:00:00`,
    `${shiftDay(to, 2)} 00:00:00`,
    `${from} 14:00:00`,
    `${to} 10:00:00`,
    from,
    to
  ]
}

// One row per invoice in the range, with what was returned and what was kept.
// A return has no date of its own in the schema, so it counts against the day of its invoice.
const INVOICES = `
  SELECT
    s.id, s.created_at, s.total, s.subtotal, s.discount, s.tax, s.paid_amount,
    COALESCE((SELECT SUM(si.total * si.returned_quantity / si.quantity)
              FROM sale_items si WHERE si.sale_id = s.id AND si.quantity > 0), 0) AS returned_lines,
    COALESCE((SELECT SUM(si.total * (si.quantity - si.returned_quantity) / si.quantity)
              FROM sale_items si WHERE si.sale_id = s.id AND si.quantity > 0), 0) AS kept_lines,
    COALESCE((SELECT SUM(si.cost_price * (si.quantity - si.returned_quantity))
              FROM sale_items si WHERE si.sale_id = s.id), 0) AS cost
  FROM sales s
  WHERE s.status != 'held' AND ${IN_RANGE}`

// Returned value includes the line's share of invoice discount and tax (same rule as returns).
const RETURNED = 'CASE WHEN i.subtotal > 0 THEN i.returned_lines * i.total / i.subtotal ELSE 0 END'
// Revenue kept, after the invoice discount and excluding tax.
const REVENUE =
  'CASE WHEN i.subtotal > 0 THEN i.kept_lines * (i.subtotal - i.discount) / i.subtotal ELSE 0 END'
// Tax kept after returns.
const TAX_KEPT = 'CASE WHEN i.subtotal > 0 THEN i.tax * i.kept_lines / i.subtotal ELSE 0 END'

const PERIOD_KEY: Record<SalesGrouping, string> = {
  day: "date(i.created_at, 'localtime')",
  // Weeks start on Saturday.
  week: "date(i.created_at, 'localtime', '-6 days', 'weekday 6')",
  month: "strftime('%Y-%m', i.created_at, 'localtime')"
}

function toDay(date: Date): string {
  return date.toISOString().slice(0, 10)
}

// Every period key between two days, so the chart has no gaps on days without sales.
function periodKeys(from: string, to: string, groupBy: SalesGrouping): string[] {
  const keys: string[] = []
  const cursor = new Date(`${from}T00:00:00Z`)
  const end = new Date(`${to}T00:00:00Z`)

  if (groupBy === 'month') {
    cursor.setUTCDate(1)
    while (cursor <= end) {
      keys.push(toDay(cursor).slice(0, 7))
      cursor.setUTCMonth(cursor.getUTCMonth() + 1)
    }
    return keys
  }
  if (groupBy === 'week') {
    // Back to the Saturday on or before the first day (getUTCDay: Saturday = 6).
    cursor.setUTCDate(cursor.getUTCDate() - ((cursor.getUTCDay() + 1) % 7))
  }
  const step = groupBy === 'week' ? 7 : 1
  while (cursor <= end) {
    keys.push(toDay(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + step)
  }
  return keys
}

export async function salesReport(payload: unknown): Promise<SalesReport> {
  const { from, to } = parseRange(payload)
  const groupBy = asOneOf(asObject(payload).groupBy, ['day', 'week', 'month'] as const, 'groupBy')
  const keys = periodKeys(from, to, groupBy)
  if (keys.length > MAX_PERIODS) throw new AppError('VALIDATION', 'range')

  const rows: Record<string, unknown>[] = await getDataSource().query(
    `SELECT ${PERIOD_KEY[groupBy]} AS period,
            COUNT(*) AS invoices,
            SUM(i.total) AS sales,
            SUM(${RETURNED}) AS returns,
            SUM(${TAX_KEPT}) AS tax,
            SUM(i.paid_amount) AS collected,
            SUM(i.total - i.paid_amount) AS credit
     FROM (${INVOICES}) i
     GROUP BY period`,
    rangeParams(from, to)
  )
  const byPeriod = new Map(rows.map((row) => [String(row.period), row]))

  const periods = keys.map((period): SalesPeriod => {
    const row = byPeriod.get(period)
    const sales = money(row?.sales)
    const returns = money(row?.returns)
    return {
      period,
      invoices: Number(row?.invoices) || 0,
      sales,
      returns,
      net: roundTo(sales - returns, 2)
    }
  })

  const sum = (field: string) => money(rows.reduce((total, row) => total + (Number(row[field]) || 0), 0))
  const sales = sum('sales')
  const returns = sum('returns')
  return {
    groupBy,
    invoices: rows.reduce((total, row) => total + (Number(row.invoices) || 0), 0),
    sales,
    returns,
    net: roundTo(sales - returns, 2),
    tax: sum('tax'),
    collected: sum('collected'),
    credit: sum('credit'),
    periods
  }
}

// net profit = revenue (after returns, discounts, excluding tax) − cost of goods sold − expenses
export async function profitReport(payload: unknown): Promise<ProfitReport> {
  const { from, to } = parseRange(payload)
  const dataSource = getDataSource()

  const [totals]: Record<string, unknown>[] = await dataSource.query(
    `SELECT SUM(${REVENUE}) AS revenue, SUM(i.cost) AS cost, SUM(${TAX_KEPT}) AS tax
     FROM (${INVOICES}) i`,
    rangeParams(from, to)
  )
  const expenseRows: Record<string, unknown>[] = await dataSource.query(
    `SELECT COALESCE(c.name, '—') AS category, SUM(e.amount) AS amount
     FROM expenses e LEFT JOIN expense_categories c ON c.id = e.category_id
     WHERE e.expense_date BETWEEN ? AND ?
     GROUP BY e.category_id
     ORDER BY amount DESC`,
    [from, to]
  )

  const revenue = money(totals?.revenue)
  const costOfGoods = money(totals?.cost)
  const expensesByCategory = expenseRows.map((row) => ({
    category: String(row.category),
    amount: money(row.amount)
  }))
  const expenses = money(expensesByCategory.reduce((total, row) => total + row.amount, 0))
  const grossProfit = roundTo(revenue - costOfGoods, 2)

  return {
    revenue,
    costOfGoods,
    grossProfit,
    expenses,
    netProfit: roundTo(grossProfit - expenses, 2),
    tax: money(totals?.tax),
    expensesByCategory
  }
}

// Per-product sales in the range, net of returns. CROSS JOIN keeps SQLite on sales first
// (by date, through the index) and then their lines; the other way round reads every line.
const PRODUCT_SALES = `
  SELECT si.product_id,
         SUM(si.quantity - si.returned_quantity) AS qty,
         SUM(CASE WHEN s.subtotal > 0
                  THEN si.total * (si.quantity - si.returned_quantity) / si.quantity
                       * (s.subtotal - s.discount) / s.subtotal
                  ELSE 0 END) AS revenue,
         SUM(si.cost_price * (si.quantity - si.returned_quantity)) AS cost
  FROM sales s CROSS JOIN sale_items si ON si.sale_id = s.id
  WHERE s.status != 'held' AND si.quantity > 0 AND ${IN_RANGE}
  GROUP BY si.product_id`

interface ProductSalesRow {
  product_id: number
  qty: number
  revenue: number
  cost: number
}

export async function productsReport(payload: unknown): Promise<ProductsReport> {
  const { from, to } = parseRange(payload)
  const dataSource = getDataSource()

  // The per-product totals are the expensive part, so they are computed once and
  // shared by the best sellers and the slow movers.
  const sales: ProductSalesRow[] = await dataSource.query(PRODUCT_SALES, rangeParams(from, to))
  const soldBy = new Map(sales.map((row) => [Number(row.product_id), row]))

  const topSales = sales
    .filter((row) => Number(row.qty) > 0)
    .sort((a, b) => Number(b.qty) - Number(a.qty) || Number(b.revenue) - Number(a.revenue))
  const best: Record<string, unknown>[] = []
  for (const row of topSales) {
    if (best.length === TOP_PRODUCTS) break
    const [product]: Record<string, unknown>[] = await dataSource.query(
      'SELECT id, name, unit FROM products WHERE id = ?',
      [row.product_id]
    )
    if (product) best.push({ ...product, qty: row.qty, revenue: row.revenue, cost: row.cost })
  }

  const inStock: Record<string, unknown>[] = await dataSource.query(
    `SELECT id, name, unit, quantity AS stock, quantity * purchase_price AS stock_value
     FROM products WHERE is_active = 1 AND track_stock = 1 AND quantity > 0
     ORDER BY id`
  )
  type SlowRow = Record<string, unknown> & { sold: number }
  const slow: SlowRow[] = inStock
    .map((product): SlowRow => ({ ...product, sold: Number(soldBy.get(Number(product.id))?.qty ?? 0) }))
    .sort((a, b) => a.sold - b.sold || Number(b.stock_value) - Number(a.stock_value))
    .slice(0, TOP_PRODUCTS)
  // Only the products shown need their last sale date.
  for (const product of slow) {
    const [last]: Record<string, unknown>[] = await dataSource.query(
      `SELECT MAX(s.created_at) AS last_sold FROM sale_items si JOIN sales s ON s.id = si.sale_id
       WHERE si.product_id = ? AND s.status != 'held'`,
      [product.id]
    )
    product.last_sold = last?.last_sold ?? null
  }
  const [inventory]: Record<string, unknown>[] = await dataSource.query(
    `SELECT COUNT(*) AS product_count,
            SUM(quantity * purchase_price) AS cost_value,
            SUM(quantity * sale_price) AS retail_value
     FROM products WHERE is_active = 1 AND track_stock = 1 AND quantity > 0`
  )
  const [low]: Record<string, unknown>[] = await dataSource.query(
    `SELECT COUNT(*) AS count FROM products
     WHERE is_active = 1 AND track_stock = 1 AND quantity <= min_quantity`
  )

  return {
    bestSellers: best.map((row) => ({
      productId: Number(row.id),
      name: String(row.name),
      unit: String(row.unit),
      quantity: quantity(row.qty),
      revenue: money(row.revenue),
      profit: roundTo(money(row.revenue) - money(row.cost), 2)
    })),
    slowMoving: slow.map((row) => ({
      productId: Number(row.id),
      name: String(row.name),
      unit: String(row.unit),
      stock: quantity(row.stock),
      stockValue: money(row.stock_value),
      soldInPeriod: quantity(row.sold),
      // Stored as "YYYY-MM-DD HH:MM:SS" in UTC.
      lastSoldAt: row.last_sold ? `${String(row.last_sold).replace(' ', 'T')}Z` : null
    })),
    inventory: {
      productCount: Number(inventory?.product_count) || 0,
      costValue: money(inventory?.cost_value),
      retailValue: money(inventory?.retail_value),
      lowStockCount: Number(low?.count) || 0
    }
  }
}

export async function balancesReport(): Promise<BalancesReport> {
  const dataSource = getDataSource()
  const customers = await dataSource
    .getRepository(Customer)
    .createQueryBuilder('customer')
    .where('customer.balance > 0')
    .orderBy('customer.balance', 'DESC')
    .getMany()
  const suppliers = await dataSource
    .getRepository(Supplier)
    .createQueryBuilder('supplier')
    .where('supplier.balance > 0')
    .orderBy('supplier.balance', 'DESC')
    .getMany()

  return {
    customers: customers.map(toPartyDto),
    customerTotal: money(customers.reduce((total, customer) => total + customer.balance, 0)),
    suppliers: suppliers.map(toPartyDto),
    supplierTotal: money(suppliers.reduce((total, supplier) => total + supplier.balance, 0))
  }
}
