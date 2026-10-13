import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm'
import type { Relation } from 'typeorm'
import { User } from './User'

@Entity({ name: 'audit_log' })
export class AuditLog {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number

  @Column({ type: 'integer', name: 'user_id', nullable: true })
  userId!: number | null

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: Relation<User> | null

  // e.g. 'delete_product', 'edit_price', 'return_sale'
  @Column({ type: 'text' })
  action!: string

  @Column({ type: 'text', name: 'entity_type', nullable: true })
  entityType!: string | null

  @Column({ type: 'integer', name: 'entity_id', nullable: true })
  entityId!: number | null

  @Column({ type: 'text', nullable: true })
  details!: string | null

  @CreateDateColumn({ type: 'datetime', name: 'created_at' })
  createdAt!: Date
}
