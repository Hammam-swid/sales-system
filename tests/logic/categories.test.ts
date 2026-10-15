import { describe, expect, it } from 'vitest'
import { deleteCategory, listCategories, saveCategory } from '../../main/services/categories.service'
import { expectError, freshShop, makeCategory, makeProduct } from './helpers'

describe('categories', () => {
  it('allows two levels only', async () => {
    await freshShop()
    const drinks = await makeCategory('Drinks')
    const hot = await makeCategory('Hot', drinks.id)
    await expectError(makeCategory('Too deep', hot.id), 'CATEGORY_NESTING')
    // A category with children cannot become a child itself.
    const other = await makeCategory('Other')
    await expectError(saveCategory({ id: drinks.id, name: 'Drinks', parentId: other.id }), 'CATEGORY_NESTING')
  })

  it('refuses to delete a category that has products or children', async () => {
    const { owner } = await freshShop()
    const food = await makeCategory('Food')
    const snacks = await makeCategory('Snacks', food.id)
    await makeProduct(owner, { categoryId: snacks.id })
    await expectError(deleteCategory({ id: food.id }), 'CATEGORY_IN_USE')
    await expectError(deleteCategory({ id: snacks.id }), 'CATEGORY_IN_USE')
    const empty = await makeCategory('Empty')
    await deleteCategory({ id: empty.id })
    expect((await listCategories()).find((c) => c.id === empty.id)).toBeUndefined()
  })

  it('counts products and keeps deduplicated note options', async () => {
    const { owner } = await freshShop('cafe_fast_food')
    const burgers = await makeCategory('Grill', null, ['No sauce', 'No sauce', 'Spicy'])
    await makeProduct(owner, { categoryId: burgers.id })
    const listed = (await listCategories()).find((c) => c.id === burgers.id)!
    expect(listed.noteOptions).toEqual(['No sauce', 'Spicy'])
    expect(listed.productCount).toBe(1)

    // Saving without note options leaves them as they were.
    await saveCategory({ id: burgers.id, name: 'Grill house', parentId: null })
    expect((await listCategories()).find((c) => c.id === burgers.id)!.noteOptions).toEqual([
      'No sauce',
      'Spicy'
    ])
    await expectError(makeCategory('Too many', null, Array.from({ length: 21 }, (_, i) => `o${i}`)), 'VALIDATION')
  })
})
