import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm'
import type { Relation } from 'typeorm'
import { Category } from './Category'

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number

  @Column({ type: 'text' })
  name!: string

  @Column({ type: 'text', unique: true, nullable: true })
  barcode!: string | null

  @Column({ type: 'integer', name: 'category_id', nullable: true })
  categoryId!: number | null

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category?: Relation<Category> | null

  @Column({ type: 'text', default: 'piece' })
  unit!: string

  @Column({ type: 'real', name: 'purchase_price', default: 0 })
  purchasePrice!: number

  @Column({ type: 'real', name: 'sale_price', default: 0 })
  salePrice!: number

  @Column({ type: 'real', default: 0 })
  quantity!: number

  @Column({ type: 'real', name: 'min_quantity', default: 0 })
  minQuantity!: number

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt!: Date

  @UpdateDateColumn({ type: 'datetime', name: 'updated_at' })
  updatedAt!: Date
}
