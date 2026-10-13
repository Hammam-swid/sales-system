import type { Language } from '../../../shared/settings'
import { ar } from './ar'
import { en } from './en'

const STORAGE_KEY = 'language'

function readStoredLanguage(): Language {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'ar'
  } catch {
    return 'ar'
  }
}

// The language is fixed for the lifetime of the page: text is read at module load in
// many places (menus, tables of labels), so switching language reloads the window.
// The shop's setting lives in the database; this copy only lets the very first
// paint, before the database has been asked, come up in the right language.
export const language: Language = readStoredLanguage()
export const isRtl = language === 'ar'
export const t = language === 'en' ? en : ar

// BCP 47 locale for dates and numbers. Arabic text with Western digits (0-9).
export const locale = language === 'en' ? 'en' : 'ar-u-nu-latn'

// Called once before the first render.
export function applyLanguage(): void {
  document.documentElement.lang = language
  document.documentElement.dir = isRtl ? 'rtl' : 'ltr'
  document.title = t.appName
}

// Makes `next` the active language, reloading the window if it is not already.
export function switchLanguage(next: Language): void {
  if (next === language) return
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Without storage the choice cannot survive a reload, so keep the current language.
    return
  }
  window.location.reload()
}
