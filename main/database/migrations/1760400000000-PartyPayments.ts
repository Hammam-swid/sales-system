import type { MigrationInterface, QueryRunner } from 'typeorm'

interface ReturnAuditRow {
  user_id: number | null
  entity_id: number
  details: string | null
  created_at: string
  customer_id: number | null
}

// Adds payment ledgers for customers and suppliers, so a balance can be
// rebuilt from history instead of only being a running number.
export class PartyPayments1760400000000 implements MigrationInterface {
  name = 'PartyPayments1760400000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE customer_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL REFERENCES customers(id),
      kind TEXT CHECK(kind IN ('payment','return_credit')) NOT NULL DEFAULT 'payment',
      amount REAL NOT NULL,
      sale_id INTEGER REFERENCES sales(id),
      note TEXT,
      user_id INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`)
    await queryRunner.query(`CREATE TABLE supplier_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
      amount REAL NOT NULL,
      note TEXT,
      user_id INTEGER REFERENCES users(id),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`)
    await queryRunner.query(
      `CREATE INDEX idx_customer_payments_customer ON customer_payments(customer_id)`
    )
    await queryRunner.query(
      `CREATE INDEX idx_supplier_payments_supplier ON supplier_payments(supplier_id)`
    )

    // Returns made before this migration reduced debts without a ledger row;
    // their amounts were kept in the audit log, so copy them across.
    const rows: ReturnAuditRow[] = await queryRunner.query(
      `SELECT a.user_id, a.entity_id, a.details, a.created_at, s.customer_id
       FROM audit_log a JOIN sales s ON s.id = a.entity_id
       WHERE a.action = 'return_sale' AND a.entity_type = 'sale'`
    )
    for (const row of rows) {
      let debtReduction = 0
      try {
        debtReduction = Number(JSON.parse(row.details ?? '{}').debtReduction) || 0
      } catch {
        debtReduction = 0
      }
      if (row.customer_id === null || debtReduction <= 0) continue
      await queryRunner.query(
        `INSERT INTO customer_payments (customer_id, kind, amount, sale_id, user_id, created_at)
         VALUES (?, 'return_credit', ?, ?, ?, ?)`,
        [row.customer_id, debtReduction, row.entity_id, row.user_id, row.created_at]
      )
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS supplier_payments`)
    await queryRunner.query(`DROP TABLE IF EXISTS customer_payments`)
  }
}
