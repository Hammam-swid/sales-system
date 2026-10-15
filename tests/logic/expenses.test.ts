import { describe, expect, it } from 'vitest'
import {
  deleteExpense,
  deleteExpenseCategory,
  listExpenseCategories,
  listExpenses,
  saveExpense,
  saveExpenseCategory
} from '../../main/services/expenses.service'
import { expectError, freshShop } from './helpers'

describe('expenses', () => {
  it('are recorded, filtered by date and category, edited and deleted', async () => {
    const { owner } = await freshShop()
    const [rent, power] = await listExpenseCategories()
    const march = await saveExpense(
      { categoryId: rent.id, amount: 300, expenseDate: '2026-03-01', note: 'March' },
      owner
    )
    await saveExpense({ categoryId: power.id, amount: 45.5, expenseDate: '2026-04-02', note: null }, owner)

    const april = await listExpenses({ from: '2026-04-01', to: '2026-04-30' })
    expect(april.items.map((e) => e.amount)).toEqual([45.5])
    expect((await listExpenses({ categoryId: rent.id })).total).toBe(1)
    expect((await listExpenses({ search: 'Mar' })).total).toBe(1)

    await saveExpense(
      { id: march.id, categoryId: rent.id, amount: 320, expenseDate: '2026-03-01', note: 'March' },
      owner
    )
    expect((await listExpenses({ categoryId: rent.id })).items[0].amount).toBe(320)
    await deleteExpense({ id: march.id }, owner)
    expect((await listExpenses({})).total).toBe(1)
  })

  it('refuse a zero amount, a bad date and deleting a category in use', async () => {
    const { owner } = await freshShop()
    const [rent] = await listExpenseCategories()
    await expectError(
      saveExpense({ categoryId: rent.id, amount: 0, expenseDate: '2026-03-01' }, owner),
      'VALIDATION'
    )
    await expectError(
      saveExpense({ categoryId: rent.id, amount: 5, expenseDate: '2026-13-01' }, owner),
      'VALIDATION'
    )
    await saveExpense({ categoryId: rent.id, amount: 5, expenseDate: '2026-03-01' }, owner)
    await expectError(deleteExpenseCategory({ id: rent.id }), 'RECORD_IN_USE')
    const spare = await saveExpenseCategory({ name: 'Spare' })
    await deleteExpenseCategory({ id: spare.id })
  })
})
