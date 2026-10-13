import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'expense_categories' })
export class ExpenseCategory {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number

  @Column({ type: 'text' })
  name!: string
}
