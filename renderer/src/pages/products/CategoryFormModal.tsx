import { X } from 'lucide-react'
import {
  MAX_NOTE_OPTIONS,
  MAX_NOTE_OPTION_LENGTH,
  type CategoryDto
} from '../../../../shared/catalog'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { SelectField, TextField } from '../../components/ui/Field'
import { IconButton } from '../../components/ui/IconButton'
import { Modal } from '../../components/ui/Modal'
import { useCategoryFormModal } from '../../hooks/products/useCategoryFormModal'
import { t } from '../../i18n'

interface CategoryFormModalProps {
  // Omit to create a new category.
  category?: CategoryDto
  categories: CategoryDto[]
  onClose: () => void
  onSaved: () => void
}

export function CategoryFormModal({ category, categories, onClose, onSaved }: CategoryFormModalProps) {
  const {
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
  } = useCategoryFormModal({ category, categories, onSaved })

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
        {lineNotes && (
          <div className="space-y-2">
            <p className="type-label text-ink">{t.categories.noteOptions}</p>
            {noteOptions.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {noteOptions.map((option) => (
                  <li
                    key={option}
                    className="type-body-sm flex items-center gap-1 rounded-pill border border-border-strong bg-bg ps-3 text-ink"
                  >
                    {option}
                    <IconButton
                      icon={X}
                      label={t.categories.removeNoteOption(option)}
                      onClick={() => removeOption(option)}
                    />
                  </li>
                ))}
              </ul>
            )}
            {noteOptions.length < MAX_NOTE_OPTIONS && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newOption}
                  onChange={(event) => setNewOption(event.target.value)}
                  // Enter adds the option instead of saving the whole form.
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter') return
                    event.preventDefault()
                    addOption()
                  }}
                  maxLength={MAX_NOTE_OPTION_LENGTH}
                  placeholder={t.categories.noteOptionPlaceholder}
                  aria-label={t.categories.noteOptions}
                  className="type-body-sm h-11 min-w-0 flex-1 rounded-sm border border-border-strong bg-bg px-3 text-ink placeholder:text-ink-muted"
                />
                <Button variant="secondary" onClick={addOption}>
                  {t.categories.addNoteOption}
                </Button>
              </div>
            )}
            <p className="type-caption text-ink-muted">{t.categories.noteOptionsHint}</p>
          </div>
        )}
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
