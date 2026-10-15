import { useState } from 'react'
import type { ExpenseCategoryDto } from '../../../../shared/expenses'
import { t } from '../../i18n'
import { api, errorText } from '../../lib/api'

export type ExpenseCategoriesDialog =
  | { kind: 'create' }
  | { kind: 'edit'; category: ExpenseCategoryDto }
  | { kind: 'delete'; category: ExpenseCategoryDto }
  | null

interface Options {
  onNotice: (message: string | null) => void
  onChanged: () => void
}

export function useExpenseCategoriesTab({ onNotice, onChanged }: Options) {
  const [dialog, setDialog] = useState<ExpenseCategoriesDialog>(null)

  const finish = (message: string) => {
    setDialog(null)
    onNotice(message)
    onChanged()
  }

  const removeCategory = async (category: ExpenseCategoryDto) => {
    const result = await api('expenseCategories:delete', { id: category.id })
    if (!result.ok) return errorText(result)
    finish(t.expenses.categoryDeleted)
  }

  return { dialog, openDialog: setDialog, closeDialog: () => setDialog(null), finish, removeCategory }
}
