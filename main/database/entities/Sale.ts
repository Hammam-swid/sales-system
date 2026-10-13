import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn
} from 'typeorm'
import type { Relation } from 'typeorm'
import { Customer } from './Customer'
import { SaleItem } from './SaleItem'
import { User } from './User'

export type PaymentStatus = 'paid' | 'partial' | 'unpaid'
export type PaymentMethod = 'cash' | 'credit' | 'mixed'
export type SaleStatus = 'completed' | 'held' | 'returned' | 'partially_returned'

@Entity({ name: 'sales' })
export class Sale {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number

  @Column({ type: 'text', name: 'invoice_number', unique: true })
  invoiceNumber!: string

  @Column({ type: 'integer', name: 'customer_id', nullable: true })
  customerId!: number | null

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer?: Relation<Customer> | null

  @Column({ type: 'integer', name: 'user_id', nullable: true })
  userId!: number | null

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: Relation<User> | null

  @Column({ type: 'real' })
  subtotal!: number

  @Column({ type: 'real', default: 0 })
  discount!: number

  @Column({ type: 'real', default: 0 })
  tax!: number

  @Column({ type: 'real' })
  total!: number

  @Column({ type: 'real', name: 'paid_amount', default: 0 })
  paidAmount!: number

  @Column({ type: 'text', name: 'payment_status', default: 'paid' })
  paymentStatus!: PaymentStatus

  @Column({ type: 'text', name: 'payment_method', default: 'cash' })
  paymentMethod!: PaymentMethod

  @Column({ type: 'text', default: 'completed' })
  status!: SaleStatus

  @OneToMany(() => SaleItem, (item) => item.sale)
  items?: Relation<SaleItem>[]

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt!: Date
}
