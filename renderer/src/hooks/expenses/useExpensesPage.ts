import { useCallback, useEffect, useState } from 'react'
import type { ExpenseCategoryDto } from '../../../../shared/expenses'
import { api, errorText } from '../../lib/api'

export type ExpensesTabId = 'expenses' | 'categories'

export function useExpensesPage() {
  const [tab, setTab] = useState<ExpensesTabId>('expenses')
  const [categories, setCategories] = useState<ExpenseCategoryDto[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadCategories = useCallback(async () => {
    const result = await api('expenseCategories:list')
    if (result.ok) setCategories(result.data)
    else setError(errorText(result))
  }, [])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  const changeTab = (id: ExpensesTabId) => {
    setTab(id)
    setNotice(null)
  }

  return { tab, changeTab, categories, loadCategories, notice, setNotice, error }
}
