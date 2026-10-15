import { useState } from 'react'
import { NOTE_SEPARATOR } from '../../../../shared/catalog'
import type { CartLine } from '../../store/cart'

interface Options {
  line: CartLine
  // The ready-made notes of the product's category.
  options: string[]
  onApply: (note: string, count: number) => void
  onClose: () => void
}

// Picks ready-made notes for a line, and how many of its units they apply to.
export function useLineNoteModal({ line, options, onApply, onClose }: Options) {
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

  return {
    choices,
    isSelected: (option: string) => selected.includes(option),
    toggle,
    count,
    decrease: () => setCount((value) => Math.max(1, Math.ceil(value) - 1)),
    increase: () => setCount((value) => Math.min(line.quantity, Math.floor(value) + 1)),
    applyToAll: () => setCount(line.quantity),
    apply
  }
}
