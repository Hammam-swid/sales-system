import { Alert } from '../../components/ui/Alert'
import { Tabs } from '../../components/ui/Tabs'
import { useExpensesPage } from '../../hooks/expenses/useExpensesPage'
import { t } from '../../i18n'
import { ExpenseCategoriesTab } from './ExpenseCategoriesTab'
import { ExpensesTab } from './ExpensesTab'

const TABS = [
  { id: 'expenses' as const, label: t.expenses.tabExpenses },
  { id: 'categories' as const, label: t.expenses.tabCategories }
]

export function ExpensesPage() {
  const { tab, changeTab, categories, loadCategories, notice, setNotice, error } = useExpensesPage()

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <h2 className="type-h2">{t.expenses.title}</h2>
        <p className="type-body text-ink-muted">{t.expenses.subtitle}</p>
      </header>

      <Tabs
        tabs={TABS}
        active={tab}
        onChange={changeTab}
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
