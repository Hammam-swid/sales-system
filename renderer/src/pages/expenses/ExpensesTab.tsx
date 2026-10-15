import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import type { ExpenseCategoryDto } from '../../../../shared/expenses'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { IconButton } from '../../components/ui/IconButton'
import { useExpensesTab, type ExpensePeriod } from '../../hooks/expenses/useExpensesTab'
import { t } from '../../i18n'
import { cn } from '../../lib/cn'
import { formatDay } from '../../lib/dates'
import { formatMoney } from '../../lib/format'
import { ExpenseFormModal } from './ExpenseFormModal'

const CONTROL =
  'type-body-sm h-11 rounded-sm border border-border-strong bg-bg px-3 text-ink placeholder:text-ink-muted'

interface ExpensesTabProps {
  categories: ExpenseCategoryDto[]
  onNotice: (message: string | null) => void
  // Expense counts per category change when expenses are added or removed.
  onChanged: () => void
}

export function ExpensesTab({ categories, onNotice, onChanged }: ExpensesTabProps) {
  const {
    currency,
    period,
    changePeriod,
    customFrom,
    changeFrom,
    customTo,
    changeTo,
    categoryId,
    changeCategory,
    searchInput,
    setSearchInput,
    data,
    error,
    total,
    page,
    pageCount,
    paged,
    rangeFrom,
    rangeTo,
    previousPage,
    nextPage,
    dialog,
    openDialog,
    closeDialog,
    finish,
    removeExpense
  } = useExpensesTab({ onNotice, onChanged })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={period}
          onChange={(event) => changePeriod(event.target.value as ExpensePeriod)}
          aria-label={t.expenses.date}
          className={CONTROL}
        >
          <option value="thisMonth">{t.expenses.periodThisMonth}</option>
          <option value="lastMonth">{t.expenses.periodLastMonth}</option>
          <option value="all">{t.expenses.periodAll}</option>
          <option value="custom">{t.expenses.periodCustom}</option>
        </select>

        {period === 'custom' && (
          <>
            <input
              type="date"
              value={customFrom}
              max={customTo}
              onChange={(event) => changeFrom(event.target.value)}
              aria-label={t.expenses.from}
              className={CONTROL}
            />
            <input
              type="date"
              value={customTo}
              min={customFrom}
              onChange={(event) => changeTo(event.target.value)}
              aria-label={t.expenses.to}
              className={CONTROL}
            />
          </>
        )}

        <select
          value={categoryId ?? ''}
          onChange={(event) =>
            changeCategory(event.target.value === '' ? null : Number(event.target.value))
          }
          aria-label={t.expenses.category}
          className={CONTROL}
        >
          <option value="">{t.expenses.allCategories}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        <div className="relative min-w-56 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t.expenses.searchPlaceholder}
            aria-label={t.expenses.searchPlaceholder}
            className={cn(CONTROL, 'w-full ps-10')}
          />
        </div>

        <Button
          icon={<Plus aria-hidden className="size-4" />}
          onClick={() => openDialog({ kind: 'create' })}
        >
          {t.expenses.add}
        </Button>
      </div>

      {error && <Alert>{error}</Alert>}

      <Card className="flex items-center justify-between gap-4 px-6 py-4">
        <div>
          <p className="type-caption text-ink-muted">{t.expenses.total}</p>
          <p className="type-h3 tabular-nums">{formatMoney(data?.totalAmount ?? 0, currency)}</p>
        </div>
        <p className="type-body-sm text-ink-muted tabular-nums">{t.expenses.count(total)}</p>
      </Card>

      <Card className="overflow-x-auto">
        <table className="type-body-sm w-full">
          <thead className="type-label border-b border-border text-ink-muted">
            <tr>
              <th className="px-6 py-3 text-start">{t.expenses.date}</th>
              <th className="px-6 py-3 text-start">{t.expenses.category}</th>
              <th className="px-6 py-3 text-end">{t.expenses.amount}</th>
              <th className="px-6 py-3 text-start">{t.expenses.note}</th>
              <th className="px-6 py-3 text-start">{t.expenses.recordedBy}</th>
              <th className="px-6 py-3 text-end">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody>
            {data === null && !error && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-ink-muted">
                  {t.common.loading}
                </td>
              </tr>
            )}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-ink-muted">
                  {t.expenses.empty}
                </td>
              </tr>
            )}
            {data?.items.map((expense) => (
              <tr key={expense.id} className="border-b border-border last:border-0">
                <td className="px-6 py-3 whitespace-nowrap tabular-nums">
                  {formatDay(expense.expenseDate)}
                </td>
                <td className="type-label px-6 py-3 text-ink">{expense.categoryName ?? '—'}</td>
                <td className="px-6 py-3 text-end font-medium tabular-nums">
                  {formatMoney(expense.amount, currency)}
                </td>
                <td className="px-6 py-3 text-ink-muted">{expense.note ?? '—'}</td>
                <td className="px-6 py-3 text-ink-muted">{expense.userName ?? '—'}</td>
                <td className="px-6 py-3">
                  <div className="flex justify-end">
                    <IconButton
                      icon={Pencil}
                      label={t.common.edit}
                      onClick={() => openDialog({ kind: 'edit', expense })}
                    />
                    <IconButton
                      icon={Trash2}
                      label={t.products.delete}
                      tone="danger"
                      onClick={() => openDialog({ kind: 'delete', expense })}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {paged && (
        <div className="flex items-center justify-between">
          <p className="type-body-sm text-ink-muted tabular-nums">
            {t.products.pageInfo(rangeFrom, rangeTo, total)}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={previousPage}
            >
              {t.products.previous}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= pageCount}
              onClick={nextPage}
            >
              {t.products.next}
            </Button>
          </div>
        </div>
      )}

      {(dialog?.kind === 'create' || dialog?.kind === 'edit') && (
        <ExpenseFormModal
          expense={dialog.kind === 'edit' ? dialog.expense : undefined}
          categories={categories}
          onClose={() => closeDialog()}
          onSaved={() => finish(dialog.kind === 'edit' ? t.expenses.saved : t.expenses.created)}
        />
      )}
      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          title={t.expenses.deleteTitle}
          body={t.expenses.deleteBody(formatMoney(dialog.expense.amount, currency))}
          confirmLabel={t.products.delete}
          onConfirm={() => removeExpense(dialog.expense)}
          onClose={() => closeDialog()}
        />
      )}
    </div>
  )
}
