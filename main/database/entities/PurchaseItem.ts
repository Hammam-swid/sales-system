import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import type { Relation } from 'typeorm'
import { Product } from './Product'
import { Purchase } from './Purchase'

@Entity({ name: 'purchase_items' })
export class PurchaseItem {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number

  @Column({ type: 'integer', name: 'purchase_id' })
  purchaseId!: number

  @ManyToOne(() => Purchase, (purchase) => purchase.items)
  @JoinColumn({ name: 'purchase_id' })
  purchase?: Relation<Purchase>

  @Column({ type: 'integer', name: 'product_id' })
  productId!: number

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product?: Relation<Product>

  @Column({ type: 'real' })
  quantity!: number

  @Column({ type: 'real', name: 'unit_cost' })
  unitCost!: number

  @Column({ type: 'real' })
  total!: number
}
