import { CornerDownLeft, Pencil, Plus, Trash2 } from 'lucide-react'
import type { CategoryDto } from '../../../../shared/catalog'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { IconButton } from '../../components/ui/IconButton'
import { useCategoriesTab } from '../../hooks/products/useCategoriesTab'
import { t } from '../../i18n'
import { orderCategories } from '../../lib/categories'
import { cn } from '../../lib/cn'
import { CategoryFormModal } from './CategoryFormModal'

interface CategoriesTabProps {
  categories: CategoryDto[]
  onNotice: (message: string | null) => void
  onChanged: () => void
}

export function CategoriesTab({ categories, onNotice, onChanged }: CategoriesTabProps) {
  const { dialog, openDialog, closeDialog, finish, removeCategory } = useCategoriesTab({
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
        <CategoryFormModal
          category={dialog.kind === 'edit' ? dialog.category : undefined}
          categories={categories}
          onClose={() => closeDialog()}
          onSaved={() => finish(t.categories.saved)}
        />
      )}
      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          title={t.categories.deleteTitle}
          body={t.categories.deleteBody(dialog.category.name)}
          confirmLabel={t.products.delete}
          onConfirm={() => removeCategory(dialog.category)}
          onClose={() => closeDialog()}
        />
      )}
    </div>
  )
}

