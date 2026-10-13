import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm'
import type { Relation } from 'typeorm'
import { Product } from './Product'
import { Sale } from './Sale'

@Entity({ name: 'sale_items' })
export class SaleItem {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number

  @Column({ type: 'integer', name: 'sale_id' })
  saleId!: number

  @ManyToOne(() => Sale, (sale) => sale.items)
  @JoinColumn({ name: 'sale_id' })
  sale?: Relation<Sale>

  @Column({ type: 'integer', name: 'product_id' })
  productId!: number

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product?: Relation<Product>

  @Column({ type: 'real' })
  quantity!: number

  // Sale price at the time of sale.
  @Column({ type: 'real', name: 'unit_price' })
  unitPrice!: number

  // Purchase price at the time of sale, kept for historical profit calculation.
  @Column({ type: 'real', name: 'cost_price' })
  costPrice!: number

  @Column({ type: 'real', default: 0 })
  discount!: number

  @Column({ type: 'real' })
  total!: number

  @Column({ type: 'real', name: 'returned_quantity', default: 0 })
  returnedQuantity!: number

  @Column({ type: 'text', nullable: true })
  note!: string | null

  // Warranty at the time of sale, so later product edits never alter past invoices.
  @Column({ type: 'integer', name: 'warranty_months', default: 0 })
  warrantyMonths!: number
}
