import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm'
import type { Relation } from 'typeorm'
import { Supplier } from './Supplier'
import { User } from './User'

// A payment made to a supplier against what the shop owes them.
@Entity({ name: 'supplier_payments' })
export class SupplierPayment {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number

  @Column({ type: 'integer', name: 'supplier_id' })
  supplierId!: number

  @ManyToOne(() => Supplier)
  @JoinColumn({ name: 'supplier_id' })
  supplier?: Relation<Supplier>

  @Column({ type: 'real' })
  amount!: number

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
