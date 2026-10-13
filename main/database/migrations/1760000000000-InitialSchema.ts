import type { MigrationInterface, QueryRunner } from 'typeorm'

const UP: string[] = [
  `CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('owner','manager','cashier')) NOT NULL DEFAULT 'cashier',
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER REFERENCES categories(id)
  )`,

  `CREATE TABLE suppliers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    balance REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    balance REAL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    barcode TEXT UNIQUE,
    category_id INTEGER REFERENCES categories(id),
    unit TEXT DEFAULT 'piece',
    purchase_price REAL NOT NULL DEFAULT 0,
    sale_price REAL NOT NULL DEFAULT 0,
    quantity REAL NOT NULL DEFAULT 0,
    min_quantity REAL DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE inventory_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER REFERENCES products(id),
    type TEXT CHECK(type IN ('in','out','adjustment')) NOT NULL,
    quantity REAL NOT NULL,
    reason TEXT,
    reference_type TEXT,
    reference_id INTEGER,
    user_id INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE NOT NULL,
    customer_id INTEGER REFERENCES customers(id),
    user_id INTEGER REFERENCES users(id),
    subtotal REAL NOT NULL,
    discount REAL DEFAULT 0,
    tax REAL DEFAULT 0,
    total REAL NOT NULL,
    paid_amount REAL NOT NULL DEFAULT 0,
    payment_status TEXT CHECK(payment_status IN ('paid','partial','unpaid')) DEFAULT 'paid',
    payment_method TEXT CHECK(payment_method IN ('cash','credit','mixed')) DEFAULT 'cash',
    status TEXT CHECK(status IN ('completed','held','returned','partially_returned')) DEFAULT 'completed',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER REFERENCES sales(id),
    product_id INTEGER REFERENCES products(id),
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    cost_price REAL NOT NULL,
    discount REAL DEFAULT 0,
    total REAL NOT NULL,
    returned_quantity REAL DEFAULT 0
  )`,

  `CREATE TABLE purchases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    supplier_id INTEGER REFERENCES suppliers(id),
    user_id INTEGER REFERENCES users(id),
    total REAL NOT NULL,
    paid_amount REAL DEFAULT 0,
    payment_status TEXT CHECK(payment_status IN ('paid','partial','unpaid')) DEFAULT 'paid',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE purchase_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    purchase_id INTEGER REFERENCES purchases(id),
    product_id INTEGER REFERENCES products(id),
    quantity REAL NOT NULL,
    unit_cost REAL NOT NULL,
    total REAL NOT NULL
  )`,

  `CREATE TABLE expense_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  )`,

  `CREATE TABLE expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER REFERENCES expense_categories(id),
    amount REAL NOT NULL,
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id INTEGER,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,

  `CREATE TABLE settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )`,

  `CREATE INDEX idx_products_name ON products(name)`,
  `CREATE INDEX idx_products_category ON products(category_id)`,
  `CREATE INDEX idx_inventory_transactions_product ON inventory_transactions(product_id, created_at)`,
  `CREATE INDEX idx_sales_created_at ON sales(created_at)`,
  `CREATE INDEX idx_sales_customer ON sales(customer_id)`,
  `CREATE INDEX idx_sale_items_sale ON sale_items(sale_id)`,
  `CREATE INDEX idx_sale_items_product ON sale_items(product_id)`,
  `CREATE INDEX idx_purchases_supplier ON purchases(supplier_id)`,
  `CREATE INDEX idx_purchase_items_purchase ON purchase_items(purchase_id)`,
  `CREATE INDEX idx_expenses_date ON expenses(expense_date)`,
  `CREATE INDEX idx_audit_log_created_at ON audit_log(created_at)`
]

// Children first, so foreign keys never point at a dropped table.
const DOWN_TABLES = [
  'settings',
  'audit_log',
  'expenses',
  'expense_categories',
  'purchase_items',
  'purchases',
  'sale_items',
  'sales',
  'inventory_transactions',
  'products',
  'customers',
  'suppliers',
  'categories',
  'users'
]

export class InitialSchema1760000000000 implements MigrationInterface {
  name = 'InitialSchema1760000000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    for (const statement of UP) await queryRunner.query(statement)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of DOWN_TABLES) await queryRunner.query(`DROP TABLE IF EXISTS ${table}`)
  }
}
