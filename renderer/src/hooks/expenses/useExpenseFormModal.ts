import { useState, type FormEvent } from 'react'
import type { ExpenseDto } from '../../../../shared/expenses'
import { t } from '../../i18n'
import { api, errorText } from '../../lib/api'
import { today } from '../../lib/dates'
import { parseNumber } from '../../lib/format'
import { useCurrency } from '../../store/settings'

interface Options {
  // Omit to create.
  expense?: ExpenseDto
  onSaved: () => void
}

export function useExpenseFormModal({ expense, onSaved }: Options) {
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

  return {
    currency,
    categoryId,
    setCategoryId,
    amount,
    setAmount,
    expenseDate,
    setExpenseDate,
    note,
    setNote,
    error,
    saving,
    submit
  }
}
