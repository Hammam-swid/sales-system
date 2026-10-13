import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { NOTE_SEPARATOR } from '../../../../shared/catalog'
import { Button } from '../../components/ui/Button'
import { IconButton } from '../../components/ui/IconButton'
import { Modal } from '../../components/ui/Modal'
import { t } from '../../i18n'
import { cn } from '../../lib/cn'
import { formatQuantity } from '../../lib/format'
import type { CartLine } from '../../store/cart'

interface LineNoteModalProps {
  line: CartLine
  // The ready-made notes of the product's category.
  options: string[]
  onApply: (note: string, count: number) => void
  onClose: () => void
}

// Picks ready-made notes for a line, and how many of its units they apply to.
export function LineNoteModal({ line, options, onApply, onClose }: LineNoteModalProps) {
  const current = line.note === '' ? [] : line.note.split(NOTE_SEPARATOR)
  // Notes already on the line stay selectable even if the category no longer lists them.
  const choices = [...options, ...current.filter((option) => !options.includes(option))]
  const [selected, setSelected] = useState<string[]>(current)
  // A fresh note usually belongs to one unit; editing an existing one changes its whole line.
  const [count, setCount] = useState(line.note === '' && line.quantity > 1 ? 1 : line.quantity)

  const toggle = (option: string) =>
    setSelected((value) =>
      value.includes(option) ? value.filter((other) => other !== option) : [...value, option]
    )

  const apply = () => {
    // Kept in the category's order, so the same choices always make the same note.
    onApply(choices.filter((option) => selected.includes(option)).join(NOTE_SEPARATOR), count)
    onClose()
  }

  return (
    <Modal title={t.pos.noteTitle(line.product.name)} onClose={onClose}>
      <div className="space-y-5">
        <div role="group" aria-label={t.pos.lineNote} className="flex flex-wrap gap-2">
          {choices.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={selected.includes(option)}
              onClick={() => toggle(option)}
              className={cn(
                'type-label h-11 rounded-md border px-4 transition-colors duration-[120ms] ease-brand',
                selected.includes(option)
                  ? 'border-primary bg-primary text-on-primary'
                  : 'border-border-strong bg-bg text-ink hover:bg-surface'
              )}
            >
              {option}
            </button>
          ))}
        </div>

        {line.quantity > 1 && (
          <div className="flex items-center justify-between gap-3 rounded-md bg-surface px-4 py-3">
            <span className="type-label text-ink">
              {t.pos.noteApplyTo(formatQuantity(line.quantity))}
            </span>
            <div className="flex items-center gap-2">
              <IconButton
                icon={Minus}
                label={t.pos.decrease}
                className="border border-border-strong"
                disabled={count <= 1}
                onClick={() => setCount((value) => Math.max(1, Math.ceil(value) - 1))}
              />
              <span className="type-label-strong w-10 text-center tabular-nums">
                {formatQuantity(count)}
              </span>
              <IconButton
                icon={Plus}
                label={t.pos.increase}
                className="border border-border-strong"
                disabled={count >= line.quantity}
                onClick={() => setCount((value) => Math.min(line.quantity, Math.floor(value) + 1))}
              />
              <Button variant="ghost" size="sm" onClick={() => setCount(line.quantity)}>
                {t.pos.noteAll}
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button onClick={apply} autoFocus>
            {t.common.save}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
