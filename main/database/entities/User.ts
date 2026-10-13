import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm'
import type { UserRole } from '../../../shared/permissions'

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number

  @Column({ type: 'text', name: 'full_name' })
  fullName!: string

  @Column({ type: 'text', unique: true })
  username!: string

  @Column({ type: 'text', name: 'password_hash' })
  passwordHash!: string

  @Column({ type: 'text', default: 'cashier' })
  role!: UserRole

  @Column({ type: 'boolean', name: 'is_active', default: true })
  isActive!: boolean

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt!: Date
}
