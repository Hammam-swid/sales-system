import { locale } from '../i18n'

// Calendar-day helpers. Days are handled as YYYY-MM-DD strings in the shop's local time,
// never as UTC instants, so "today" is the day on the wall clock.

function toDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function today(): string {
  return toDay(new Date())
}

export interface DayRange {
  from: string
  to: string
}

// The calendar month `offset` months away from the current one (0 = this month, -1 = last).
export function monthRange(offset = 0): DayRange {
  const now = new Date()
  const first = new Date(now.getFullYear(), now.getMonth() + offset, 1)
  const last = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0)
  return { from: toDay(first), to: toDay(last) }
}

// The day `count` days before today.
export function daysAgo(count: number): string {
  const now = new Date()
  return toDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - count))
}

export function yearStart(): string {
  return toDay(new Date(new Date().getFullYear(), 0, 1))
}

const monthFormat = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
const shortDayFormat = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' })

// Formats a YYYY-MM month key, e.g. "أكتوبر 2026".
export function formatMonth(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number)
  return monthFormat.format(new Date(year, monthNumber - 1, 1))
}

// Compact day for chart axes, e.g. "13 أكتوبر".
export function formatShortDay(day: string): string {
  const [year, month, date] = day.split('-').map(Number)
  return shortDayFormat.format(new Date(year, month - 1, date))
}

const dayFormat = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' })

// Formats a YYYY-MM-DD day without shifting it across time zones.
export function formatDay(day: string): string {
  const [year, month, date] = day.split('-').map(Number)
  return dayFormat.format(new Date(year, month - 1, date))
}
