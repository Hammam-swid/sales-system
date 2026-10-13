import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm'
import type { Relation } from 'typeorm'
import { Product } from './Product'
import { User } from './User'

export type InventoryTransactionType = 'in' | 'out' | 'adjustment'
export type InventoryReferenceType = 'sale' | 'purchase' | 'manual'

@Entity({ name: 'inventory_transactions' })
export class InventoryTransaction {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number

  @Column({ type: 'integer', name: 'product_id' })
  productId!: number

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product?: Relation<Product>

  @Column({ type: 'text' })
  type!: InventoryTransactionType

  @Column({ type: 'real' })
  quantity!: number

  @Column({ type: 'text', nullable: true })
  reason!: string | null

  @Column({ type: 'text', name: 'reference_type', nullable: true })
  referenceType!: InventoryReferenceType | null

  @Column({ type: 'integer', name: 'reference_id', nullable: true })
  referenceId!: number | null

  @Column({ type: 'integer', name: 'user_id', nullable: true })
  userId!: number | null

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: Relation<User> | null

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt!: Date
}
