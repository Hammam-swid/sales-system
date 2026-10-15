import type { ExpenseCategoryDto } from '../../../../shared/expenses'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { useExpenseCategoryFormModal } from '../../hooks/expenses/useExpenseCategoryFormModal'
import { t } from '../../i18n'

interface ExpenseCategoryFormModalProps {
  // Omit to create.
  category?: ExpenseCategoryDto
  onClose: () => void
  onSaved: () => void
}

export function ExpenseCategoryFormModal({
  category,
  onClose,
  onSaved
}: ExpenseCategoryFormModalProps) {
  const { name, setName, error, saving, submit } = useExpenseCategoryFormModal({ category, onSaved })

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
