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
import { PurchaseItem } from './PurchaseItem'
import type { PaymentStatus } from './Sale'
import { Supplier } from './Supplier'
import { User } from './User'

@Entity({ name: 'purchases' })
export class Purchase {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number

  @Column({ type: 'integer', name: 'supplier_id', nullable: true })
  supplierId!: number | null

  @ManyToOne(() => Supplier, { nullable: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier?: Relation<Supplier> | null

  @Column({ type: 'integer', name: 'user_id', nullable: true })
  userId!: number | null

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: Relation<User> | null

  @Column({ type: 'real' })
  total!: number

  @Column({ type: 'real', name: 'paid_amount', default: 0 })
  paidAmount!: number

  @Column({ type: 'text', name: 'payment_status', default: 'paid' })
  paymentStatus!: PaymentStatus

  @OneToMany(() => PurchaseItem, (item) => item.purchase)
  items?: Relation<PurchaseItem>[]

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt!: Date
}
