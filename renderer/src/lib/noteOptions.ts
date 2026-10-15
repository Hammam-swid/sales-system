import { MAX_NOTE_OPTIONS, NOTE_SEPARATOR } from '../../../shared/catalog'

// Adds a ready-made note, ignoring blanks, repeats, and anything past the limit.
export function withOption(options: string[], text: string): string[] {
  // The separator joins picked options into one note, so an option cannot contain it.
  const option = text.replaceAll(NOTE_SEPARATOR.trim(), ' ').replace(/\s+/g, ' ').trim()
  if (option === '' || options.includes(option) || options.length >= MAX_NOTE_OPTIONS) {
    return options
  }
  return [...options, option]
}
