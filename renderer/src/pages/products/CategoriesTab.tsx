import { useState, type FormEvent } from 'react'
import { CornerDownLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import type { CategoryDto } from '../../../../shared/catalog'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { SelectField, TextField } from '../../components/ui/Field'
import { IconButton } from '../../components/ui/IconButton'
import { Modal } from '../../components/ui/Modal'
import { t } from '../../i18n'
import { api, errorText } from '../../lib/api'
import { orderCategories } from '../../lib/categories'
import { cn } from '../../lib/cn'

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit'; category: CategoryDto }
  | { kind: 'delete'; category: CategoryDto }
  | null

interface CategoriesTabProps {
  categories: CategoryDto[]
  onNotice: (message: string | null) => void
  onChanged: () => void
}

export function CategoriesTab({ categories, onNotice, onChanged }: CategoriesTabProps) {
  const [dialog, setDialog] = useState<Dialog>(null)

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

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          icon={<Plus aria-hidden className="size-4" />}
          onClick={() => setDialog({ kind: 'create' })}
        >
          {t.categories.add}
        </Button>
      </div>

      <Card className="overflow-hidden">
        <table className="type-body-sm w-full">
          <thead className="type-label border-b border-border text-ink-muted">
            <tr>
              <th className="px-6 py-3 text-start">{t.categories.name}</th>
              <th className="px-6 py-3 text-end">{t.categories.productCount}</th>
              <th className="px-6 py-3 text-end">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-10 text-center text-ink-muted">
                  {t.categories.empty}
                </td>
              </tr>
            )}
            {orderCategories(categories).map(({ category, depth }) => (
              <tr key={category.id} className="border-b border-border last:border-0">
                <td className="px-6 py-3">
                  <span className={cn('flex items-center gap-2', depth === 1 && 'ps-6')}>
                    {depth === 1 && (
                      <CornerDownLeft aria-hidden className="size-4 text-ink-muted" />
                    )}
                    <span className={depth === 0 ? 'type-label text-ink' : 'text-ink'}>
                      {category.name}
                    </span>
                  </span>
                </td>
                <td className="px-6 py-3 text-end tabular-nums">{category.productCount}</td>
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
          categories={categories}
          onClose={() => setDialog(null)}
          onSaved={() => finish(t.categories.saved)}
        />
      )}
      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          title={t.categories.deleteTitle}
          body={t.categories.deleteBody(dialog.category.name)}
          confirmLabel={t.products.delete}
          onConfirm={() => removeCategory(dialog.category)}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}

interface CategoryFormModalProps {
  // Omit to create a new category.
  category?: CategoryDto
  categories: CategoryDto[]
  onClose: () => void
  onSaved: () => void
}

function CategoryFormModal({ category, categories, onClose, onSaved }: CategoryFormModalProps) {
  const [name, setName] = useState(category?.name ?? '')
  const [parentId, setParentId] = useState<number | null>(category?.parentId ?? null)
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

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const result = await api('categories:save', { id: category?.id, name, parentId })
    setSaving(false)
    if (result.ok) onSaved()
    else setError(errorText(result))
  }

  return (
    <Modal title={category ? t.categories.edit : t.categories.add} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <TextField
          label={t.categories.name}
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={60}
          autoFocus
          required
        />
        <SelectField
          label={t.categories.parent}
          value={parentId ?? ''}
          onChange={(event) =>
            setParentId(event.target.value === '' ? null : Number(event.target.value))
          }
          disabled={hasChildren}
          hint={hasChildren ? t.errors.CATEGORY_NESTING : undefined}
        >
          <option value="">{t.categories.noParent}</option>
          {parentOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </SelectField>
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
