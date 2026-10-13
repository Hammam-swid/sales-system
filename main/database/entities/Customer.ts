import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'

@Entity({ name: 'customers' })
export class Customer {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number

  @Column({ type: 'text' })
  name!: string

  @Column({ type: 'text', nullable: true })
  phone!: string | null

  @Column({ type: 'text', nullable: true })
  address!: string | null

  // Debt this customer owes the shop.
  @Column({ type: 'real', default: 0 })
  balance!: number

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt!: Date
}
