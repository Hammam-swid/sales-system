import { useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import type { ExpenseCategoryDto } from '../../../../shared/expenses'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { TextField } from '../../components/ui/Field'
import { IconButton } from '../../components/ui/IconButton'
import { Modal } from '../../components/ui/Modal'
import { t } from '../../i18n/ar'
import { api, errorText } from '../../lib/api'

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit'; category: ExpenseCategoryDto }
  | { kind: 'delete'; category: ExpenseCategoryDto }
  | null

interface ExpenseCategoriesTabProps {
  categories: ExpenseCategoryDto[]
  onNotice: (message: string | null) => void
  onChanged: () => void
}

export function ExpenseCategoriesTab({ categories, onNotice, onChanged }: ExpenseCategoriesTabProps) {
  const [dialog, setDialog] = useState<Dialog>(null)

  const finish = (message: string) => {
    setDialog(null)
    onNotice(message)
    onChanged()
  }

  const removeCategory = async (category: ExpenseCategoryDto) => {
    const result = await api('expenseCategories:delete', { id: category.id })
    if (!result.ok) return errorText(result)
    finish(t.expenses.categoryDeleted)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          icon={<Plus aria-hidden className="size-4" />}
          onClick={() => setDialog({ kind: 'create' })}
        >
          {t.expenses.addCategory}
        </Button>
      </div>

      <Card className="overflow-hidden">
        <table className="type-body-sm w-full">
          <thead className="type-label border-b border-border text-ink-muted">
            <tr>
              <th className="px-6 py-3 text-start">{t.expenses.categoryName}</th>
              <th className="px-6 py-3 text-end">{t.expenses.expenseCount}</th>
              <th className="px-6 py-3 text-end">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-ink-muted">
                  {t.expenses.emptyCategories}
                </td>
              </tr>
            )}
            {categories.map((category) => (
              <tr key={category.id} className="border-b border-border last:border-0">
                <td className="type-label px-6 py-3 text-ink">{category.name}</td>
                <td className="px-6 py-3 text-end tabular-nums">{category.expenseCount}</td>
                <td className="px-6 py-3">
                  <div className="flex justify-end">
                    <IconButton
                      icon={Pencil}
                      label={t.common.edit}
                      onClick={() => setDialog({ kind: 'edit', category })}
                    />
                    <IconButton
                      icon={Trash2}
                      label={t.products.delete}
                      tone="danger"
                      onClick={() => setDialog({ kind: 'delete', category })}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {(dialog?.kind === 'create' || dialog?.kind === 'edit') && (
        <CategoryFormModal
          category={dialog.kind === 'edit' ? dialog.category : undefined}
          onClose={() => setDialog(null)}
          onSaved={() => finish(t.expenses.categorySaved)}
        />
      )}
      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          title={t.expenses.deleteCategoryTitle}
          body={t.expenses.deleteCategoryBody(dialog.category.name)}
          confirmLabel={t.products.delete}
          onConfirm={() => removeCategory(dialog.category)}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}

interface CategoryFormModalProps {
  // Omit to create.
  category?: ExpenseCategoryDto
  onClose: () => void
  onSaved: () => void
}

function CategoryFormModal({ category, onClose, onSaved }: CategoryFormModalProps) {
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

  return (
    <Modal title={category ? t.expenses.editCategory : t.expenses.addCategory} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <TextField
          label={t.expenses.categoryName}
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={60}
          autoFocus
          required
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" loading={saving}>
            {category ? t.common.save : t.common.add}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
