import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'suppliers' })
export class Supplier {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number

  @Column({ type: 'text' })
  name!: string

  @Column({ type: 'text', nullable: true })
  phone!: string | null

  @Column({ type: 'text', nullable: true })
  address!: string | null

  // Amount the shop owes this supplier.
  @Column({ type: 'real', default: 0 })
  balance!: number

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt!: Date
}
