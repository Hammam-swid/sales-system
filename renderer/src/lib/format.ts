// Western digits (0-9) throughout the product, with Arabic separators and month names.
const LOCALE = 'ar-u-nu-latn'

interface MoneyStyle {
  symbol: string
  decimals: number
}

const moneyStyles = new Map<string, MoneyStyle>()

function moneyStyle(currency: string): MoneyStyle {
  let style = moneyStyles.get(currency)
  if (!style) {
    try {
      const parts = new Intl.NumberFormat('en', {
        style: 'currency',
        currency,
        currencyDisplay: 'narrowSymbol'
      })
      style = {
        symbol: parts.formatToParts(0).find((part) => part.type === 'currency')?.value ?? currency,
        decimals: parts.resolvedOptions().maximumFractionDigits ?? 2
      }
    } catch {
      // Not an ISO currency code (a shop may type its own label).
      style = { symbol: currency, decimals: 2 }
    }
    moneyStyles.set(currency, style)
  }
  return style
}

// The amount and its symbol are wrapped in a left-to-right isolate so they stay
// together and in order ("$1.90") inside right-to-left text.
export function formatMoney(value: number, currency: string): string {
  const { symbol, decimals } = moneyStyle(currency)
  const amount = value.toLocaleString('en', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
  const separator = symbol.length > 1 ? ' ' : ''
  return `⁦${symbol}${separator}${amount}⁩`
}

const quantityFormat = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 3 })

export function formatQuantity(value: number): string {
  return quantityFormat.format(value)
}

const dateFormat = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium' })
const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, { dateStyle: 'medium', timeStyle: 'short' })

export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso))
}

// Parses a number typed into a form field; returns null for empty or invalid input.
export function parseNumber(text: string): number | null {
  const trimmed = text.trim()
  if (trimmed === '') return null
  const value = Number(trimmed)
  return Number.isFinite(value) ? value : null
}
