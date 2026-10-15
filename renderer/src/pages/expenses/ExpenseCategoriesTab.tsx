import { Pencil, Plus, Trash2 } from 'lucide-react'
import type { ExpenseCategoryDto } from '../../../../shared/expenses'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { IconButton } from '../../components/ui/IconButton'
import { useExpenseCategoriesTab } from '../../hooks/expenses/useExpenseCategoriesTab'
import { t } from '../../i18n'
import { ExpenseCategoryFormModal } from './ExpenseCategoryFormModal'

interface ExpenseCategoriesTabProps {
  categories: ExpenseCategoryDto[]
  onNotice: (message: string | null) => void
  onChanged: () => void
}

export function ExpenseCategoriesTab({ categories, onNotice, onChanged }: ExpenseCategoriesTabProps) {
  const { dialog, openDialog, closeDialog, finish, removeCategory } = useExpenseCategoriesTab({
    onNotice,
    onChanged
  })

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          icon={<Plus aria-hidden className="size-4" />}
          onClick={() => openDialog({ kind: 'create' })}
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
                      onClick={() => openDialog({ kind: 'edit', category })}
                    />
                    <IconButton
                      icon={Trash2}
                      label={t.products.delete}
                      tone="danger"
                      onClick={() => openDialog({ kind: 'delete', category })}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {(dialog?.kind === 'create' || dialog?.kind === 'edit') && (
        <ExpenseCategoryFormModal
          category={dialog.kind === 'edit' ? dialog.category : undefined}
          onClose={() => closeDialog()}
          onSaved={() => finish(t.expenses.categorySaved)}
        />
      )}
      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          title={t.expenses.deleteCategoryTitle}
          body={t.expenses.deleteCategoryBody(dialog.category.name)}
          confirmLabel={t.products.delete}
          onConfirm={() => removeCategory(dialog.category)}
          onClose={() => closeDialog()}
        />
      )}
    </div>
  )
}
