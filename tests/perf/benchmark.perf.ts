import { existsSync, rmSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { performance } from 'node:perf_hooks'
import type Database from 'better-sqlite3'
import { expect, test } from 'vitest'
import type { SessionUser } from '../../main/auth/session'
import { closeDatabase, getDataSource, initDatabase } from '../../main/database/data-source'
import { createBackup } from '../../main/services/backup.service'
import { customerStatement } from '../../main/services/customers.service'
import { listProducts } from '../../main/services/products.service'
import {
  balancesReport,
  productsReport,
  profitReport,
  salesReport
} from '../../main/services/reports.service'
import { checkout, getSale, listSales } from '../../main/services/sales.service'
import { createFirstOwner } from '../../main/services/setup.service'
import { BUDGETS } from './budgets'
import { DATASET, generate, type GeneratedStats } from './generate'
import { writeReport, type Timing } from './report'
import { perfData } from './setup'

const RUNS = 20
const reuse = process.env.PERF_REUSE === '1'

function percentile(sorted: number[], p: number): number {
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]
}

function connection(): Database.Database {
  return (getDataSource().driver as unknown as { databaseConnection: Database.Database })
    .databaseConnection
}

// Runs `operation` `runs` times; the first run also records the SQL it prepares.
async function measure(name: string, operation: () => Promise<unknown>, runs = RUNS): Promise<Timing> {
  const db = connection()
  const statements = new Set<string>()
  const prepare = db.prepare.bind(db)
  db.prepare = ((sql: string) => {
    statements.add(sql)
    return prepare(sql)
  }) as typeof db.prepare

  const times: number[] = []
  try {
    for (let i = 0; i < runs; i++) {
      const started = performance.now()
      await operation()
      times.push(performance.now() - started)
    }
  } finally {
    db.prepare = prepare as typeof db.prepare
  }

  const scans = new Set<string>()
  for (const sql of statements) {
    if (!/^\s*(SELECT|WITH)/i.test(sql)) continue
    try {
      const plan = db.prepare(`EXPLAIN QUERY PLAN ${sql}`).all() as { detail: string }[]
      for (const { detail } of plan) {
        // A plain SCAN of a table (not of an index or a subquery) reads every row.
        if (/^SCAN \w+$/.test(detail) || /^SCAN \w+ \w+$/.test(detail)) scans.add(detail)
      }
    } catch {
      // Statements with parameters SQLite cannot plan unbound are skipped.
    }
  }

  const sorted = [...times].sort((a, b) => a - b)
  return {
    name,
    runs,
    p50: percentile(sorted, 50),
    p95: percentile(sorted, 95),
    max: sorted[sorted.length - 1],
    budget: BUDGETS[name] ?? null,
    scans: [...scans]
  }
}

test('benchmark a busy shop', async () => {
  const dbPath = join(perfData, 'pos.db')
  let stats: GeneratedStats | null = null
  let owner: SessionUser

  if (reuse && existsSync(dbPath)) {
    await initDatabase()
    owner = { id: 1, role: 'owner' }
  } else {
    await closeDatabase()
    for (const suffix of ['', '-wal', '-shm']) rmSync(`${dbPath}${suffix}`, { force: true })
    rmSync(join(perfData, 'backups'), { recursive: true, force: true })
    await initDatabase()
    const created = await createFirstOwner({
      fullName: 'Owner',
      username: 'owner',
      password: 'owner123',
      storeName: 'Busy shop',
      language: 'en',
      storeType: 'grocery'
    })
    owner = { id: created.id, role: 'owner' }
    stats = generate(connection(), owner.id)
    console.log(`Generated in ${stats.seconds.toFixed(1)} s`, stats)
  }

  // Reopening measures what a restart costs once the database is large.
  await closeDatabase()
  const timings: Timing[] = []
  const open = performance.now()
  await initDatabase()
  const openMs = performance.now() - open
  timings.push({
    name: 'Open database (migrations already applied)',
    runs: 1,
    p50: openMs,
    p95: openMs,
    max: openMs,
    budget: BUDGETS['Open database (migrations already applied)'],
    scans: []
  })

  const db = connection()
  const busiest = db
    .prepare('SELECT customer_id AS id FROM sales WHERE customer_id IS NOT NULL GROUP BY customer_id ORDER BY COUNT(*) DESC LIMIT 1')
    .get() as { id: number }
  const someSale = db.prepare('SELECT id, invoice_number FROM sales ORDER BY id DESC LIMIT 1 OFFSET 5000').get() as {
    id: number
    invoice_number: string
  }
  const stocked = (
    db.prepare('SELECT id FROM products WHERE is_active = 1 AND track_stock = 1 AND quantity > 50 LIMIT 5').all() as {
      id: number
    }[]
  ).map((row) => row.id)
  db.prepare('UPDATE products SET quantity = 1000000 WHERE id IN (' + stocked.join(',') + ')').run()

  const today = new Date()
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  const monthAgo = iso(new Date(today.getTime() - 30 * 86_400_000))
  const yearAgo = iso(new Date(today.getTime() - 365 * 86_400_000))
  const now = iso(today)

  timings.push(await measure('Product search by name', () => listProducts({ search: 'rice', pageSize: 30 }, owner)))
  timings.push(await measure('Product search by barcode', () => listProducts({ search: '6200000002500', pageSize: 30 }, owner)))
  timings.push(await measure('Products: low-stock filter', () => listProducts({ lowStockOnly: true }, owner)))
  timings.push(await measure('Products: expiring filter', () => listProducts({ expiringOnly: true }, owner)))
  timings.push(
    await measure('Checkout (5 lines)', () =>
      checkout(
        {
          items: stocked.map((productId) => ({ productId, quantity: 1, discount: 0 })),
          discount: 0,
          customerId: null,
          paidAmount: 1e6
        },
        owner
      )
    )
  )
  timings.push(await measure('Invoices: first page', () => listSales({}, owner)))
  timings.push(await measure('Invoices: search by number', () => listSales({ search: someSale.invoice_number }, owner)))
  timings.push(await measure('Open one invoice', () => getSale({ id: someSale.id }, owner)))
  timings.push(await measure('Customer statement (busiest customer)', () => customerStatement({ id: busiest.id })))
  timings.push(await measure('Sales report: one month by day', () => salesReport({ from: monthAgo, to: now, groupBy: 'day' }), 5))
  timings.push(await measure('Sales report: one year by month', () => salesReport({ from: yearAgo, to: now, groupBy: 'month' }), 5))
  timings.push(await measure('Profit report: one year', () => profitReport({ from: yearAgo, to: now }), 5))
  timings.push(await measure('Products report: one year', () => productsReport({ from: yearAgo, to: now }), 5))
  timings.push(await measure('Balances report', () => balancesReport(), 5))
  timings.push(await measure('Backup to folder', () => createBackup({ target: 'folder' }), 3))

  const counts = db.prepare('SELECT (SELECT COUNT(*) FROM sales) AS sales, (SELECT COUNT(*) FROM sale_items) AS items').get() as {
    sales: number
    items: number
  }
  expect(counts.sales).toBeGreaterThanOrEqual(DATASET.sales)
  await closeDatabase()

  // Startup is measured next, in the running app (npm run bench does both).
  const markdown = writeReport({ stats, timings, dbBytes: statSync(dbPath).size, startup: [] })
  console.log(`\n${markdown}`)
})
