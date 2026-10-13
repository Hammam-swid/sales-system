import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import type { Relation } from 'typeorm'

@Entity({ name: 'categories' })
export class Category {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: number

  @Column({ type: 'text' })
  name!: string

  @Column({ type: 'integer', name: 'parent_id', nullable: true })
  parentId!: number | null

  @ManyToOne(() => Category, (category) => category.children, { nullable: true })
  @JoinColumn({ name: 'parent_id' })
  parent?: Relation<Category> | null

  @OneToMany(() => Category, (category) => category.parent)
  children?: Relation<Category>[]
}
