// True when the text contains Arabic letters or Arabic-Indic digits,
// which usually means the keyboard is on the Arabic layout.
export function hasArabicLetters(text: string): boolean {
  return /[؀-ۿ]/.test(text)
}
