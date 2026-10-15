import { useState, type FormEvent } from 'react'
import type { ExpenseCategoryDto } from '../../../../shared/expenses'
import { api, errorText } from '../../lib/api'

interface Options {
  // Omit to create.
  category?: ExpenseCategoryDto
  onSaved: () => void
}

export function useExpenseCategoryFormModal({ category, onSaved }: Options) {
  const [name, setName] = useState(category?.name ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const result = await api('expenseCategories:save', { id: category?.id, name })
    setSaving(false)
    if (result.ok) onSaved()
    else setError(errorText(result))
  }

  return { name, setName, error, saving, submit }
}
