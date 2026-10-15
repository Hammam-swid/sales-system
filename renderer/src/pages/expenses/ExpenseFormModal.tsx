import type { ExpenseCategoryDto, ExpenseDto } from '../../../../shared/expenses'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { SelectField, TextField } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { useExpenseFormModal } from '../../hooks/expenses/useExpenseFormModal'
import { t } from '../../i18n'

interface ExpenseFormModalProps {
  // Omit to create.
  expense?: ExpenseDto
  categories: ExpenseCategoryDto[]
  onClose: () => void
  onSaved: () => void
}

export function ExpenseFormModal({ expense, categories, onClose, onSaved }: ExpenseFormModalProps) {
  const {
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
  } = useExpenseFormModal({ expense, onSaved })

  return (
    <Modal title={expense ? t.expenses.edit : t.expenses.add} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        {categories.length === 0 && <Alert>{t.expenses.noCategories}</Alert>}

        <SelectField
          label={t.expenses.category}
          value={categoryId ?? ''}
          onChange={(event) =>
            setCategoryId(event.target.value === '' ? null : Number(event.target.value))
          }
          autoFocus
          required
        >
          <option value="">{t.expenses.chooseCategory}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </SelectField>

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label={`${t.expenses.amount} (${currency})`}
            type="number"
            min={0}
            step="any"
            dir="ltr"
            className="text-start"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
          <TextField
            label={t.expenses.date}
            type="date"
            value={expenseDate}
            onChange={(event) => setExpenseDate(event.target.value)}
            required
          />
        </div>

        <TextField
          label={t.expenses.noteOptional}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          maxLength={300}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" loading={saving} disabled={categories.length === 0}>
            {expense ? t.common.save : t.common.add}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
