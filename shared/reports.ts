// Types for the reports module.
import type { PartyDto } from './parties'

export interface DateRangeRequest {
  // Inclusive local calendar days, YYYY-MM-DD.
  from: string
  to: string
}

export type SalesGrouping = 'day' | 'week' | 'month'

export interface SalesReportRequest extends DateRangeRequest {
  groupBy: SalesGrouping
}

export interface SalesPeriod {
  // First day of the period (YYYY-MM-DD), or YYYY-MM for a month.
  period: string
  invoices: number
  // Invoice totals including tax, before returns.
  sales: number
  returns: number
  net: number
}

export interface SalesReport {
  // The grouping these periods were built with. The screen must label periods with
  // this, not with the currently selected grouping, which may already have changed.
  groupBy: SalesGrouping
  invoices: number
  sales: number
  returns: number
  net: number
  tax: number
  // Money actually received at the time of sale.
  collected: number
  // Sold on credit (added to customer debts).
  credit: number
  // One entry per period in the range, including periods with no sales.
  periods: SalesPeriod[]
}

export interface ExpenseBreakdown {
  category: string
  amount: number
}

export interface ProfitReport {
  // Sales after returns and discounts, excluding tax.
  revenue: number
  // Cost of the goods that were sold and not returned.
  costOfGoods: number
  grossProfit: number
  expenses: number
  netProfit: number
  // Collected on behalf of the tax authority; not part of profit.
  tax: number
  expensesByCategory: ExpenseBreakdown[]
}

export interface ProductSalesRow {
  productId: number
  name: string
  unit: string
  quantity: number
  revenue: number
  profit: number
}

export interface SlowProductRow {
  productId: number
  name: string
  unit: string
  stock: number
  // Stock on hand at cost.
  stockValue: number
  soldInPeriod: number
  lastSoldAt: string | null
}

export interface ProductsReport {
  bestSellers: ProductSalesRow[]
  // In-stock products that sold least in the period.
  slowMoving: SlowProductRow[]
  inventory: {
    productCount: number
    // Stock on hand valued at cost, and at sale price.
    costValue: number
    retailValue: number
    lowStockCount: number
  }
}

export interface BalancesReport {
  customers: PartyDto[]
  customerTotal: number
  suppliers: PartyDto[]
  supplierTotal: number
}

export type ExportCell = string | number | null

export interface ExportSheet {
  name: string
  columns: { header: string; width?: number; money?: boolean }[]
  rows: ExportCell[][]
}

export interface ExportExcelRequest {
  // Suggested file name, without extension.
  fileName: string
  sheets: ExportSheet[]
}

export interface ExportResult {
  // False when the user cancelled the save dialog.
  saved: boolean
  path: string | null
}
