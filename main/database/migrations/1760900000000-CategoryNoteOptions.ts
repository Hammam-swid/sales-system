import type { MigrationInterface, QueryRunner } from 'typeorm'

// Ready-made line notes ("no sauce", "no sugar") the cashier picks from,
// kept per category as a JSON array of strings.
export class CategoryNoteOptions1760900000000 implements MigrationInterface {
  name = 'CategoryNoteOptions1760900000000'

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE categories ADD COLUMN note_options TEXT`)
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE categories DROP COLUMN note_options`)
  }
}
