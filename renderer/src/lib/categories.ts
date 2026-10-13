import type { CategoryDto } from '../../../shared/catalog'

export interface CategoryNode {
  category: CategoryDto
  depth: 0 | 1
}

// Flattens the two-level hierarchy into display order: each parent followed by its children.
export function orderCategories(categories: CategoryDto[]): CategoryNode[] {
  const nodes: CategoryNode[] = []
  for (const parent of categories.filter((category) => category.parentId === null)) {
    nodes.push({ category: parent, depth: 0 })
    for (const child of categories.filter((category) => category.parentId === parent.id)) {
      nodes.push({ category: child, depth: 1 })
    }
  }
  return nodes
}

// Label for a <select> option; sub-categories are visually indented.
export function categoryOptionLabel({ category, depth }: CategoryNode): string {
  return depth === 1 ? `— ${category.name}` : category.name
}
