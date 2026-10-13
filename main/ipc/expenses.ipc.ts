import {
  deleteExpense,
  deleteExpenseCategory,
  listExpenseCategories,
  listExpenses,
  saveExpense,
  saveExpenseCategory
} from '../services/expenses.service'
import { handle } from './handle'

export function registerExpensesIpc(): void {
  const permission = 'expenses.manage'

  handle('expenseCategories:list', { permission }, () => listExpenseCategories())
  handle('expenseCategories:save', { permission }, (payload) => saveExpenseCategory(payload))
  handle('expenseCategories:delete', { permission }, (payload) => deleteExpenseCategory(payload))

  handle('expenses:list', { permission }, (payload) => listExpenses(payload))
  handle('expenses:save', { permission }, (payload, user) => saveExpense(payload, user))
  handle('expenses:delete', { permission }, (payload, user) => deleteExpense(payload, user))
}
