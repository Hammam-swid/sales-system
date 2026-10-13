import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import type {
  ExpenseCategoryDto,
  ExpenseDto,
  ListExpensesResponse
} from '../../../../shared/expenses'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { SelectField, TextField } from '../../components/ui/Field'
import { IconButton } from '../../components/ui/IconButton'
import { Modal } from '../../components/ui/Modal'
import { t } from '../../i18n'
import { api, errorText } from '../../lib/api'
import { cn } from '../../lib/cn'
import { formatDay, monthRange, today } from '../../lib/dates'
import { formatMoney, parseNumber } from '../../lib/format'
import { useCurrency } from '../../store/settings'

const PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 250

const CONTROL =
  'type-body-sm h-11 rounded-sm border border-border-strong bg-bg px-3 text-ink placeholder:text-ink-muted'

type Period = 'thisMonth' | 'lastMonth' | 'all' | 'custom'

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit'; expense: ExpenseDto }
  | { kind: 'delete'; expense: ExpenseDto }
  | null

interface ExpensesTabProps {
  categories: ExpenseCategoryDto[]
  onNotice: (message: string | null) => void
  // Expense counts per category change when expenses are added or removed.
  onChanged: () => void
}

export function ExpensesTab({ categories, onNotice, onChanged }: ExpensesTabProps) {
  const currency = useCurrency()
  const [period, setPeriod] = useState<Period>('thisMonth')
  const [customFrom, setCustomFrom] = useState(monthRange().from)
  const [customTo, setCustomTo] = useState(today())
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<ListExpensesResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<Dialog>(null)
  const requestId = useRef(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  const range =
    period === 'thisMonth'
      ? monthRange(0)
      : period === 'lastMonth'
        ? monthRange(-1)
        : period === 'custom'
          ? { from: customFrom, to: customTo }
          : { from: null, to: null }

  const load = useCallback(async () => {
    const current = ++requestId.current
    const result = await api('expenses:list', {
      from: range.from,
      to: range.to,
      categoryId,
      search,
      page,
      pageSize: PAGE_SIZE
    })
    if (current !== requestId.current) return
    if (result.ok) {
      setData(result.data)
      setError(null)
    } else {
      setError(errorText(result))
    }
  }, [range.from, range.to, categoryId, search, page])

  useEffect(() => {
    void load()
  }, [load])

  const finish = (message: string) => {
    setDialog(null)
    onNotice(message)
    void load()
    onChanged()
  }

  const removeExpense = async (expense: ExpenseDto) => {
    const result = await api('expenses:delete', { id: expense.id })
    if (!result.ok) return errorText(result)
    finish(t.expenses.deleted)
  }

  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={period}
          onChange={(event) => {
            setPeriod(event.target.value as Period)
            setPage(1)
          }}
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
              onChange={(event) => {
                setCustomFrom(event.target.value)
                setPage(1)
              }}
              aria-label={t.expenses.from}
              className={CONTROL}
            />
            <input
              type="date"
              value={customTo}
              min={customFrom}
              onChange={(event) => {
                setCustomTo(event.target.value)
                setPage(1)
              }}
              aria-label={t.expenses.to}
              className={CONTROL}
            />
          </>
        )}

        <select
          value={categoryId ?? ''}
          onChange={(event) => {
            setCategoryId(event.target.value === '' ? null : Number(event.target.value))
            setPage(1)
          }}
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
          onClick={() => setDialog({ kind: 'create' })}
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
                      onClick={() => setDialog({ kind: 'edit', expense })}
                    />
                    <IconButton
                      icon={Trash2}
                      label={t.products.delete}
                      tone="danger"
                      onClick={() => setDialog({ kind: 'delete', expense })}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="type-body-sm text-ink-muted tabular-nums">
            {t.products.pageInfo((page - 1) * PAGE_SIZE + 1, Math.min(page * PAGE_SIZE, total), total)}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              {t.products.previous}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= pageCount}
              onClick={() => setPage((value) => value + 1)}
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
          onClose={() => setDialog(null)}
          onSaved={() => finish(dialog.kind === 'edit' ? t.expenses.saved : t.expenses.created)}
        />
      )}
      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          title={t.expenses.deleteTitle}
          body={t.expenses.deleteBody(formatMoney(dialog.expense.amount, currency))}
          confirmLabel={t.products.delete}
          onConfirm={() => removeExpense(dialog.expense)}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}

interface ExpenseFormModalProps {
  // Omit to create.
  expense?: ExpenseDto
  categories: ExpenseCategoryDto[]
  onClose: () => void
  onSaved: () => void
}

function ExpenseFormModal({ expense, categories, onClose, onSaved }: ExpenseFormModalProps) {
  const currency = useCurrency()
  const [categoryId, setCategoryId] = useState<number | null>(expense?.categoryId ?? null)
  const [amount, setAmount] = useState(expense ? String(expense.amount) : '')
  const [expenseDate, setExpenseDate] = useState(expense?.expenseDate ?? today())
  const [note, setNote] = useState(expense?.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const value = parseNumber(amount)
    if (categoryId === null || value === null || value <= 0) {
      setError(t.errors.VALIDATION)
      return
    }
    setSaving(true)
    setError(null)
    const result = await api('expenses:save', {
      id: expense?.id,
      categoryId,
      amount: value,
      expenseDate,
      note: note.trim() === '' ? null : note.trim()
    })
    setSaving(false)
    if (result.ok) onSaved()
    else setError(errorText(result))
  }

  return (
    <Modal title={expense ? t.expenses.edit : t.expenses.add} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        {categories.length === 0 && <Alert>{t.expenses.noCategories}</Alert>}

        <SelectField
          label={t.expenses.category}
          value={categoryId ?? ''}
          onChange={(event) =>
            setCategoryId(event.target.value === '' ? null : Number(event.target.value))
          }
          autoFocus
          required
        >
          <option value="">{t.expenses.chooseCategory}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </SelectField>

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label={`${t.expenses.amount} (${currency})`}
            type="number"
            min={0}
            step="any"
            dir="ltr"
            className="text-start"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
          <TextField
            label={t.expenses.date}
            type="date"
            value={expenseDate}
            onChange={(event) => setExpenseDate(event.target.value)}
            required
          />
        </div>

        <TextField
          label={t.expenses.noteOptional}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={300}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" loading={saving} disabled={categories.length === 0}>
            {expense ? t.common.save : t.common.add}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
