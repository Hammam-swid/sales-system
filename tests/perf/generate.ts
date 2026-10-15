import type Database from 'better-sqlite3'

// "Busy shop, 2 years": the dataset the benchmark runs against.
export const DATASET = {
  categories: 40,
  products: 5_000,
  customers: 1_000,
  suppliers: 50,
  sales: 150_000,
  purchases: 5_000,
  expenses: 3_000,
  years: 2
}

export interface GeneratedStats {
  products: number
  customers: number
  suppliers: number
  sales: number
  saleItems: number
  purchases: number
  purchaseItems: number
  expenses: number
  movements: number
  seconds: number
}

// Small, fast, seeded generator so every run builds exactly the same shop.
function random(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let value = state
    value = Math.imul(value ^ (value >>> 15), value | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296
  }
}

const money = (value: number) => Math.round(value * 100) / 100

// SQLite's CURRENT_TIMESTAMP format, in UTC.
function stamp(ms: number): string {
  return new Date(ms).toISOString().slice(0, 19).replace('T', ' ')
}

// Fills an already migrated and set-up database (owner = user 1). Runs in one
// transaction with prepared statements, so it takes seconds rather than hours.
export function generate(db: Database.Database, ownerId: number): GeneratedStats {
  const started = Date.now()
  const rand = random(20261015)
  const pick = <T>(items: T[]): T => items[Math.floor(rand() * items.length)]
  const between = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1))

  const end = Date.now()
  const start = end - DATASET.years * 365 * 24 * 3600 * 1000
  const stats: GeneratedStats = {
    products: 0,
    customers: 0,
    suppliers: 0,
    sales: 0,
    saleItems: 0,
    purchases: 0,
    purchaseItems: 0,
    expenses: 0,
    movements: 0,
    seconds: 0
  }

  const run = db.transaction(() => {
    db.exec('DELETE FROM categories')

    const insertCategory = db.prepare('INSERT INTO categories (name, parent_id) VALUES (?, ?)')
    const categoryIds: number[] = []
    for (let i = 1; i <= DATASET.categories; i++) {
      const parent = i > 10 ? categoryIds[(i - 1) % 10] : null
      categoryIds.push(Number(insertCategory.run(`Category ${i}`, parent).lastInsertRowid))
    }

    const insertProduct = db.prepare(
      `INSERT INTO products (name, barcode, category_id, unit, purchase_price, sale_price, quantity,
         min_quantity, is_active, expiry_date, warranty_months, track_stock, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, ?, ?)`
    )
    const products: { id: number; cost: number; price: number }[] = []
    for (let i = 1; i <= DATASET.products; i++) {
      const cost = money(0.5 + rand() * 60)
      const price = money(cost * (1.15 + rand() * 0.6))
      const expiry = rand() < 0.3 ? new Date(end + between(-30, 400) * 86_400_000).toISOString().slice(0, 10) : null
      const id = Number(
        insertProduct.run(
          `Product ${i} ${pick(['tea', 'rice', 'soap', 'cable', 'juice', 'bread', 'phone case', 'detergent'])}`,
          String(6_200_000_000_000 + i),
          pick(categoryIds),
          pick(['piece', 'piece', 'piece', 'box', 'kg', 'liter']),
          cost,
          price,
          between(0, 400),
          between(0, 20),
          rand() < 0.97 ? 1 : 0,
          expiry,
          stamp(start),
          stamp(start)
        ).lastInsertRowid
      )
      products.push({ id, cost, price })
    }
    stats.products = products.length

    const insertCustomer = db.prepare('INSERT INTO customers (name, phone, balance, created_at) VALUES (?, ?, 0, ?)')
    const customerIds: number[] = []
    for (let i = 1; i <= DATASET.customers; i++) {
      customerIds.push(Number(insertCustomer.run(`Customer ${i}`, `09${String(10_000_000 + i)}`, stamp(start)).lastInsertRowid))
    }
    stats.customers = customerIds.length

    const insertSupplier = db.prepare('INSERT INTO suppliers (name, phone, balance, created_at) VALUES (?, ?, 0, ?)')
    const supplierIds: number[] = []
    for (let i = 1; i <= DATASET.suppliers; i++) {
      supplierIds.push(Number(insertSupplier.run(`Supplier ${i}`, null, stamp(start)).lastInsertRowid))
    }
    stats.suppliers = supplierIds.length

    const insertSale = db.prepare(
      `INSERT INTO sales (invoice_number, customer_id, user_id, subtotal, discount, tax, total, paid_amount,
         payment_status, payment_method, status, created_at)
       VALUES (?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?)`
    )
    const insertItem = db.prepare(
      `INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, cost_price, discount, total,
         returned_quantity, warranty_months)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, 0)`
    )
    const insertMovement = db.prepare(
      `INSERT INTO inventory_transactions (product_id, type, quantity, reason, reference_type, reference_id,
         user_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    const insertPayment = db.prepare(
      `INSERT INTO customer_payments (customer_id, kind, amount, user_id, created_at)
       VALUES (?, 'payment', ?, ?, ?)`
    )
    const balances = new Map<number, number>()
    const step = (end - start) / DATASET.sales

    for (let i = 1; i <= DATASET.sales; i++) {
      const at = start + i * step
      const lineCount = between(1, 8)
      const chosen = new Set<number>()
      while (chosen.size < lineCount) chosen.add(between(0, products.length - 1))
      const lines = [...chosen].map((index) => {
        const product = products[index]
        const quantity = between(1, 3)
        return { product, quantity, total: money(quantity * product.price) }
      })
      const total = money(lines.reduce((sum, item) => sum + item.total, 0))

      const onCredit = rand() < 0.1
      const customerId = onCredit || rand() < 0.2 ? pick(customerIds) : null
      const paid = onCredit ? money(rand() < 0.5 ? 0 : total * rand()) : total
      const remaining = money(total - paid)
      // Returns are drawn only from cash sales, so customer debts stay simple.
      const returned = !onCredit && rand() < 0.05
      const status = returned ? (lines.length > 1 ? 'partially_returned' : 'returned') : 'completed'

      const saleId = Number(
        insertSale.run(
          `INV-${String(i).padStart(6, '0')}`,
          customerId,
          ownerId,
          total,
          total,
          paid,
          remaining === 0 ? 'paid' : paid === 0 ? 'unpaid' : 'partial',
          remaining === 0 ? 'cash' : paid === 0 ? 'credit' : 'mixed',
          status,
          stamp(at)
        ).lastInsertRowid
      )
      lines.forEach((item, index) => {
        const returnedQuantity = returned && index === 0 ? item.quantity : 0
        insertItem.run(saleId, item.product.id, item.quantity, item.product.price, item.product.cost, item.total, returnedQuantity)
        insertMovement.run(item.product.id, 'out', item.quantity, 'sale', 'sale', saleId, ownerId, stamp(at))
        stats.movements++
        if (returnedQuantity > 0) {
          insertMovement.run(item.product.id, 'in', returnedQuantity, 'return', 'sale', saleId, ownerId, stamp(at))
          stats.movements++
        }
      })
      stats.saleItems += lines.length

      if (customerId !== null && remaining > 0) {
        let owed = (balances.get(customerId) ?? 0) + remaining
        // Half of the credit sales are paid off within a month.
        if (rand() < 0.5) {
          insertPayment.run(customerId, remaining, ownerId, stamp(Math.min(end, at + between(1, 30) * 86_400_000)))
          owed -= remaining
        }
        balances.set(customerId, money(owed))
      }
    }
    stats.sales = DATASET.sales
    const setBalance = db.prepare('UPDATE customers SET balance = ? WHERE id = ?')
    for (const [id, balance] of balances) setBalance.run(balance, id)

    const insertPurchase = db.prepare(
      `INSERT INTO purchases (supplier_id, user_id, total, paid_amount, payment_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    const insertPurchaseItem = db.prepare(
      'INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_cost, total) VALUES (?, ?, ?, ?, ?)'
    )
    const supplierBalances = new Map<number, number>()
    for (let i = 1; i <= DATASET.purchases; i++) {
      const at = start + (i / DATASET.purchases) * (end - start)
      const supplierId = pick(supplierIds)
      const items = Array.from({ length: between(1, 10) }, () => {
        const product = pick(products)
        const quantity = between(5, 60)
        return { product, quantity, total: money(quantity * product.cost) }
      })
      const total = money(items.reduce((sum, item) => sum + item.total, 0))
      const paid = rand() < 0.8 ? total : money(total * rand())
      const purchaseId = Number(
        insertPurchase.run(supplierId, ownerId, total, paid, paid === total ? 'paid' : paid === 0 ? 'unpaid' : 'partial', stamp(at)).lastInsertRowid
      )
      for (const item of items) {
        insertPurchaseItem.run(purchaseId, item.product.id, item.quantity, item.product.cost, item.total)
        insertMovement.run(item.product.id, 'in', item.quantity, 'purchase', 'purchase', purchaseId, ownerId, stamp(at))
        stats.movements++
        stats.purchaseItems++
      }
      supplierBalances.set(supplierId, money((supplierBalances.get(supplierId) ?? 0) + total - paid))
    }
    stats.purchases = DATASET.purchases
    const setSupplierBalance = db.prepare('UPDATE suppliers SET balance = ? WHERE id = ?')
    for (const [id, balance] of supplierBalances) setSupplierBalance.run(balance, id)

    const categories = (db.prepare('SELECT id FROM expense_categories').all() as { id: number }[]).map((row) => row.id)
    const insertExpense = db.prepare(
      'INSERT INTO expenses (category_id, amount, expense_date, note, user_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    )
    for (let i = 1; i <= DATASET.expenses; i++) {
      const at = start + (i / DATASET.expenses) * (end - start)
      insertExpense.run(pick(categories), money(5 + rand() * 500), stamp(at).slice(0, 10), `Expense ${i}`, ownerId, stamp(at))
    }
    stats.expenses = DATASET.expenses

    db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('next_invoice_number', ?)").run(
      String(DATASET.sales + 1)
    )
  })

  run()
  db.exec('ANALYZE')
  stats.seconds = (Date.now() - started) / 1000
  return stats
}
