import { useState } from 'react'
import type { CategoryDto } from '../../../../shared/catalog'
import { t } from '../../i18n'
import { api, errorText } from '../../lib/api'

export type CategoriesDialog =
  | { kind: 'create' }
  | { kind: 'edit'; category: CategoryDto }
  | { kind: 'delete'; category: CategoryDto }
  | null

interface Options {
  onNotice: (message: string | null) => void
  onChanged: () => void
}

export function useCategoriesTab({ onNotice, onChanged }: Options) {
  const [dialog, setDialog] = useState<CategoriesDialog>(null)

  const finish = (message: string) => {
    setDialog(null)
    onNotice(message)
    onChanged()
  }

  const removeCategory = async (category: CategoryDto) => {
    const result = await api('categories:delete', { id: category.id })
    if (!result.ok) return errorText(result)
    finish(t.categories.deleted)
  }

  return { dialog, openDialog: setDialog, closeDialog: () => setDialog(null), finish, removeCategory }
}
