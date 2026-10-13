import { useCallback, useEffect, useState } from 'react'
import type { ExpenseCategoryDto } from '../../../../shared/expenses'
import { Alert } from '../../components/ui/Alert'
import { Tabs } from '../../components/ui/Tabs'
import { t } from '../../i18n/ar'
import { api, errorText } from '../../lib/api'
import { ExpenseCategoriesTab } from './ExpenseCategoriesTab'
import { ExpensesTab } from './ExpensesTab'

type TabId = 'expenses' | 'categories'

const TABS = [
  { id: 'expenses' as const, label: t.expenses.tabExpenses },
  { id: 'categories' as const, label: t.expenses.tabCategories }
]

export function ExpensesPage() {
  const [tab, setTab] = useState<TabId>('expenses')
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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <h2 className="type-h2">{t.expenses.title}</h2>
        <p className="type-body text-ink-muted">{t.expenses.subtitle}</p>
      </header>

      <Tabs
        tabs={TABS}
        active={tab}
        onChange={(id) => {
          setTab(id)
          setNotice(null)
        }}
      />

      {notice && <Alert tone="success">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}

      {tab === 'expenses' ? (
        <ExpensesTab categories={categories} onNotice={setNotice} onChanged={loadCategories} />
      ) : (
        <ExpenseCategoriesTab
          categories={categories}
          onNotice={setNotice}
          onChanged={loadCategories}
        />
      )}
    </div>
  )
}
