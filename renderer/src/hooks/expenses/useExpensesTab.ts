import { useCallback, useEffect, useRef, useState } from 'react'
import type { ExpenseDto, ListExpensesResponse } from '../../../../shared/expenses'
import { t } from '../../i18n'
import { api, errorText } from '../../lib/api'
import { monthRange, today } from '../../lib/dates'
import { useCurrency } from '../../store/settings'

export const EXPENSES_PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 250

export type ExpensePeriod = 'thisMonth' | 'lastMonth' | 'all' | 'custom'

export type ExpensesDialog =
  | { kind: 'create' }
  | { kind: 'edit'; expense: ExpenseDto }
  | { kind: 'delete'; expense: ExpenseDto }
  | null

interface Options {
  onNotice: (message: string | null) => void
  // Expense counts per category change when expenses are added or removed.
  onChanged: () => void
}

export function useExpensesTab({ onNotice, onChanged }: Options) {
  const currency = useCurrency()
  const [period, setPeriod] = useState<ExpensePeriod>('thisMonth')
  const [customFrom, setCustomFrom] = useState(monthRange().from)
  const [customTo, setCustomTo] = useState(today())
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<ListExpensesResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<ExpensesDialog>(null)
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
      pageSize: EXPENSES_PAGE_SIZE
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
  const pageCount = Math.max(1, Math.ceil(total / EXPENSES_PAGE_SIZE))

  // Every filter change starts again from the first page.
  const changePeriod = (value: ExpensePeriod) => {
    setPeriod(value)
    setPage(1)
  }
  const changeFrom = (value: string) => {
    setCustomFrom(value)
    setPage(1)
  }
  const changeTo = (value: string) => {
    setCustomTo(value)
    setPage(1)
  }
  const changeCategory = (id: number | null) => {
    setCategoryId(id)
    setPage(1)
  }

  return {
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
    // More than one page of expenses exists.
    paged: total > EXPENSES_PAGE_SIZE,
    // The rows shown on this page, counted from 1.
    rangeFrom: (page - 1) * EXPENSES_PAGE_SIZE + 1,
    rangeTo: Math.min(page * EXPENSES_PAGE_SIZE, total),
    previousPage: () => setPage((value) => value - 1),
    nextPage: () => setPage((value) => value + 1),
    dialog,
    openDialog: setDialog,
    closeDialog: () => setDialog(null),
    finish,
    removeExpense
  }
}
