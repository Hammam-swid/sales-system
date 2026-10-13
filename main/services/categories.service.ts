import {
  MAX_NOTE_OPTIONS,
  MAX_NOTE_OPTION_LENGTH,
  type CategoryDto
} from '../../shared/catalog'
import { getDataSource } from '../database/data-source'
import { Category, Product } from '../database/entities'
import { AppError } from '../errors'
import { asId, asObject, asOptionalId, asText } from './validation'

export async function listCategories(): Promise<CategoryDto[]> {
  const dataSource = getDataSource()
  const categories = await dataSource.getRepository(Category).find({ order: { name: 'ASC' } })

  const counts: { categoryId: number; count: number }[] = await dataSource
    .getRepository(Product)
    .createQueryBuilder('product')
    .select('product.categoryId', 'categoryId')
    .addSelect('COUNT(*)', 'count')
    .where('product.categoryId IS NOT NULL')
    .groupBy('product.categoryId')
    .getRawMany()
  const countById = new Map(counts.map((row) => [row.categoryId, Number(row.count)]))

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    parentId: category.parentId,
    productCount: countById.get(category.id) ?? 0,
    noteOptions: readNoteOptions(category)
  }))
}

function readNoteOptions(category: Category): string[] {
  try {
    const parsed: unknown = JSON.parse(category.noteOptions ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((option) => typeof option === 'string') : []
  } catch {
    return []
  }
}

function asNoteOptions(value: unknown): string[] {
  if (!Array.isArray(value) || value.length > MAX_NOTE_OPTIONS) {
    throw new AppError('VALIDATION', 'noteOptions')
  }
  const options = value.map((option) => asText(option, 'noteOptions', MAX_NOTE_OPTION_LENGTH))
  return [...new Set(options)]
}

// Creates or updates a category. The hierarchy is kept to two levels:
// a sub-category's parent must itself be a top-level category.
export async function saveCategory(payload: unknown): Promise<CategoryDto> {
  const input = asObject(payload)
  const id = asOptionalId(input.id, 'id')
  const name = asText(input.name, 'name', 60)
  const parentId = asOptionalId(input.parentId, 'parentId')
  const noteOptions =
    input.noteOptions === undefined ? undefined : JSON.stringify(asNoteOptions(input.noteOptions))

  return getDataSource().transaction(async (manager) => {
    const repository = manager.getRepository(Category)

    if (parentId !== null) {
      if (parentId === id) throw new AppError('CATEGORY_NESTING')
      const parent = await repository.findOneBy({ id: parentId })
      if (!parent) throw new AppError('NOT_FOUND')
      if (parent.parentId !== null) throw new AppError('CATEGORY_NESTING')
      // A category that already has sub-categories cannot become a sub-category.
      if (id !== null && (await repository.existsBy({ parentId: id }))) {
        throw new AppError('CATEGORY_NESTING')
      }
    }

    let category: Category
    if (id === null) {
      category = repository.create({ name, parentId, noteOptions: noteOptions ?? null })
    } else {
      const existing = await repository.findOneBy({ id })
      if (!existing) throw new AppError('NOT_FOUND')
      category = Object.assign(existing, { name, parentId })
      if (noteOptions !== undefined) category.noteOptions = noteOptions
    }
    await repository.save(category)

    const productCount = await manager.getRepository(Product).countBy({ categoryId: category.id })
    return {
      id: category.id,
      name: category.name,
      parentId: category.parentId,
      productCount,
      noteOptions: readNoteOptions(category)
    }
  })
}

export async function deleteCategory(payload: unknown): Promise<null> {
  const id = asId(asObject(payload).id)

  await getDataSource().transaction(async (manager) => {
    const repository = manager.getRepository(Category)
    if (!(await repository.existsBy({ id }))) throw new AppError('NOT_FOUND')

    const hasChildren = await repository.existsBy({ parentId: id })
    const hasProducts = await manager.getRepository(Product).existsBy({ categoryId: id })
    if (hasChildren || hasProducts) throw new AppError('CATEGORY_IN_USE')

    await repository.delete({ id })
  })
  return null
}
