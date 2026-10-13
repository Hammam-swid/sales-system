import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm'
import type { Relation } from 'typeorm'
import { ExpenseCategory } from './ExpenseCategory'
import { User } from './User'

@Entity({ name: 'expenses' })
export class Expense {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number

  @Column({ type: 'integer', name: 'category_id', nullable: true })
  categoryId!: number | null

  @ManyToOne(() => ExpenseCategory, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category?: Relation<ExpenseCategory> | null

  @Column({ type: 'real' })
  amount!: number

  // Day the expense belongs to (YYYY-MM-DD); may differ from when it was recorded.
  @Column({ type: 'date', name: 'expense_date' })
  expenseDate!: string

  @Column({ type: 'text', nullable: true })
  note!: string | null

  @Column({ type: 'integer', name: 'user_id', nullable: true })
  userId!: number | null

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: Relation<User> | null

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt!: Date
}
