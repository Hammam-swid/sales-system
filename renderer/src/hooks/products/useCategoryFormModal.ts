import { useState, type FormEvent } from 'react'
import type { CategoryDto } from '../../../../shared/catalog'
import { api, errorText } from '../../lib/api'
import { withOption } from '../../lib/noteOptions'
import { useFeature } from '../../store/settings'

interface Options {
  // Omit to create a new category.
  category?: CategoryDto
  categories: CategoryDto[]
  onSaved: () => void
}

export function useCategoryFormModal({ category, categories, onSaved }: Options) {
  const [name, setName] = useState(category?.name ?? '')
  const [parentId, setParentId] = useState<number | null>(category?.parentId ?? null)
  const lineNotes = useFeature('lineNotes')
  const [noteOptions, setNoteOptions] = useState<string[]>(category?.noteOptions ?? [])
  const [newOption, setNewOption] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Two levels only: parents are top-level categories, and a category that
  // already has sub-categories must stay top-level.
  const hasChildren = category
    ? categories.some((other) => other.parentId === category.id)
    : false
  const parentOptions = categories.filter(
    (other) => other.parentId === null && other.id !== category?.id
  )

  const addOption = () => {
    setNoteOptions((current) => withOption(current, newOption))
    setNewOption('')
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const result = await api('categories:save', {
      id: category?.id,
      name,
      parentId,
      // Includes whatever is still sitting in the input.
      noteOptions: lineNotes ? withOption(noteOptions, newOption) : undefined
    })
    setSaving(false)
    if (result.ok) onSaved()
    else setError(errorText(result))
  }

  const removeOption = (option: string) =>
    setNoteOptions((current) => current.filter((other) => other !== option))

  return {
    name,
    setName,
    parentId,
    setParentId,
    hasChildren,
    parentOptions,
    lineNotes,
    noteOptions,
    newOption,
    setNewOption,
    addOption,
    removeOption,
    error,
    saving,
    submit
  }
}
