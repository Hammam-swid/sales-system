import type { MigrationInterface, QueryRunner } from 'typeorm'

// Columns behind the store-type features: expiry dates, warranty, products
// sold without stock, order types, line notes and daily order numbers.
export class StoreFeatures1760800000000 implements MigrationInterface {
  name = 'StoreFeatures1760800000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE products ADD COLUMN expiry_date DATE`)
    await queryRunner.query(
      `ALTER TABLE products ADD COLUMN warranty_months INTEGER NOT NULL DEFAULT 0`
    )
    await queryRunner.query(`ALTER TABLE products ADD COLUMN track_stock BOOLEAN NOT NULL DEFAULT 1`)
    await queryRunner.query(`ALTER TABLE sales ADD COLUMN order_type TEXT`)
    await queryRunner.query(`ALTER TABLE sales ADD COLUMN order_number INTEGER`)
    await queryRunner.query(`ALTER TABLE sale_items ADD COLUMN note TEXT`)
    await queryRunner.query(
      `ALTER TABLE sale_items ADD COLUMN warranty_months INTEGER NOT NULL DEFAULT 0`
    )
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE sale_items DROP COLUMN warranty_months`)
    await queryRunner.query(`ALTER TABLE sale_items DROP COLUMN note`)
    await queryRunner.query(`ALTER TABLE sales DROP COLUMN order_number`)
    await queryRunner.query(`ALTER TABLE sales DROP COLUMN order_type`)
    await queryRunner.query(`ALTER TABLE products DROP COLUMN track_stock`)
    await queryRunner.query(`ALTER TABLE products DROP COLUMN warranty_months`)
    await queryRunner.query(`ALTER TABLE products DROP COLUMN expiry_date`)
  }
}
