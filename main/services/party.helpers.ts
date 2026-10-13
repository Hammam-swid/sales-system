import type {
  PartyDto,
  StatementDto,
  StatementEntry
} from '../../shared/parties'
import { roundTo } from '../../shared/sales'
import { AppError } from '../errors'
import { asAmount, asId, asObject, asOptionalId, asOptionalText, asText } from './validation'

// Customers and suppliers share the same contact fields and balance mechanics.
export interface PartyRecord {
  id: number
  name: string
  phone: string | null
  address: string | null
  balance: number
}

export function toPartyDto(party: PartyRecord): PartyDto {
  return {
    id: party.id,
    name: party.name,
    phone: party.phone,
    address: party.address,
    balance: party.balance
  }
}

export function parsePartyInput(payload: unknown): {
  id: number | null
  name: string
  phone: string | null
  address: string | null
} {
  const input = asObject(payload)
  return {
    id: asOptionalId(input.id, 'id'),
    name: asText(input.name, 'name', 100),
    phone: asOptionalText(input.phone, 'phone', 30),
    address: asOptionalText(input.address, 'address', 200)
  }
}

export function parseSearch(payload: unknown): string | null {
  const input = payload === undefined || payload === null ? {} : asObject(payload)
  return asOptionalText(input.search, 'search', 100)
}

// Makes user input safe inside a LIKE pattern (used with ESCAPE '\').
export function likePattern(text: string): string {
  return `%${text.replace(/[\\%_]/g, (char) => `\\${char}`)}%`
}

export function parsePayment(
  payload: unknown,
  balance: (id: number) => Promise<number>
): Promise<{ id: number; amount: number; note: string | null }> {
  const input = asObject(payload)
  const id = asId(input.id)
  const amount = asAmount(input.amount, 'amount')
  const note = asOptionalText(input.note, 'note', 200)
  if (amount <= 0) throw new AppError('VALIDATION', 'amount')
  // A payment can settle the balance but never push it below zero.
  return balance(id).then((current) => {
    if (amount > current) throw new AppError('PAYMENT_EXCEEDS')
    return { id, amount, note }
  })
}

export type RawEntry = Omit<StatementEntry, 'balanceAfter'> & { order: number }

// Sorts entries by time and adds the running balance.
export function buildStatement(party: PartyRecord, raw: RawEntry[]): StatementDto {
  const sorted = [...raw].sort(
    (a, b) => a.date.localeCompare(b.date) || a.order - b.order
  )
  let balance = 0
  const entries = sorted.map(({ order: _order, ...entry }): StatementEntry => {
    balance = roundTo(balance + entry.change, 2)
    return { ...entry, balanceAfter: balance }
  })
  return { party: toPartyDto(party), entries, computedBalance: balance }
}
