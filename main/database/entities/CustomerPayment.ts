import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm'
import type { Relation } from 'typeorm'
import { Customer } from './Customer'
import { Sale } from './Sale'
import { User } from './User'

// 'payment': the customer paid off debt. 'return_credit': a return cancelled debt on an invoice.
export type CustomerPaymentKind = 'payment' | 'return_credit'

// Everything that reduces a customer's debt, so the balance can be rebuilt from history.
@Entity({ name: 'customer_payments' })
export class CustomerPayment {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number

  @Column({ type: 'integer', name: 'customer_id' })
  customerId!: number

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer?: Relation<Customer>

  @Column({ type: 'text', default: 'payment' })
  kind!: CustomerPaymentKind

  @Column({ type: 'real' })
  amount!: number

  @Column({ type: 'integer', name: 'sale_id', nullable: true })
  saleId!: number | null

  @ManyToOne(() => Sale, { nullable: true })
  @JoinColumn({ name: 'sale_id' })
  sale?: Relation<Sale> | null

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
