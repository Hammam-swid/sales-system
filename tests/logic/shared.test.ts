import { describe, expect, it } from 'vitest'
import { noteOptionsFor, type CategoryDto } from '../../shared/catalog'
import { computeTotals, lineTotal, returnedValue, roundTo } from '../../shared/sales'
import {
  STORE_TYPES,
  formatOrderNumber,
  hasFeature,
  localDate,
  toStoreType,
  warrantyEnd
} from '../../shared/store'

describe('money math', () => {
  it('rounds half up to the cent', () => {
    expect(roundTo(1.005, 2)).toBe(1.01)
    expect(roundTo(2.675, 2)).toBe(2.68)
  })

  it('takes the line discount off the line', () => {
    expect(lineTotal({ quantity: 3, unitPrice: 1.1, discount: 0.3 })).toBe(3)
  })

  it('applies the invoice discount before tax', () => {
    const totals = computeTotals(
      [
        { quantity: 2, unitPrice: 10, discount: 0 },
        { quantity: 1, unitPrice: 5, discount: 1 }
      ],
      4,
      10
    )
    expect(totals).toEqual({ subtotal: 24, discount: 4, tax: 2, total: 22 })
  })

  it('never discounts more than the subtotal', () => {
    expect(computeTotals([{ quantity: 1, unitPrice: 5, discount: 0 }], 50, 0).total).toBe(0)
  })

  it('values a partial return with its share of discount and tax', () => {
    const sale = { subtotal: 20, total: 19.8 }
    const lines = [
      { total: 10, quantity: 1, returnedQuantity: 1 },
      { total: 10, quantity: 1, returnedQuantity: 0 }
    ]
    expect(returnedValue(sale, lines)).toBe(9.9)
  })

  it('values a full return as exactly the invoice total', () => {
    const sale = { subtotal: 3, total: 3.33 }
    const lines = [
      { total: 1, quantity: 3, returnedQuantity: 3 },
      { total: 2, quantity: 1, returnedQuantity: 1 }
    ]
    expect(returnedValue(sale, lines)).toBe(3.33)
  })
})

describe('store types', () => {
  it('falls back to general for unknown values', () => {
    expect(toStoreType(undefined)).toBe('general')
    expect(toStoreType('bakery')).toBe('general')
    for (const type of STORE_TYPES) expect(toStoreType(type)).toBe(type)
  })

  it('switches on the agreed features per type', () => {
    expect(hasFeature('general', 'expiryDates')).toBe(false)
    expect(hasFeature('grocery', 'expiryDates')).toBe(true)
    expect(hasFeature('cleaning', 'expiryDates')).toBe(true)
    expect(hasFeature('electronics', 'warranty')).toBe(true)
    expect(hasFeature('electronics', 'untrackedItems')).toBe(false)
    for (const type of ['cafe', 'cafe_fast_food'] as const) {
      for (const feature of [
        'untrackedItems',
        'posCategories',
        'orderTypes',
        'lineNotes',
        'orderNumbers'
      ] as const) {
        expect(hasFeature(type, feature)).toBe(true)
      }
    }
  })

  it('formats order numbers with three digits', () => {
    expect(formatOrderNumber(1)).toBe('001')
    expect(formatOrderNumber(42)).toBe('042')
    expect(formatOrderNumber(500)).toBe('500')
  })

  it('computes local dates and warranty end dates', () => {
    const now = new Date(2026, 0, 31, 23, 30)
    expect(localDate(0, now)).toBe('2026-01-31')
    expect(localDate(1, now)).toBe('2026-02-01')
    expect(warrantyEnd(new Date(2026, 4, 15, 10).toISOString(), 12)).toBe('2027-05-15')
  })
})

describe('note options', () => {
  const category = (id: number, parentId: number | null, noteOptions: string[]): CategoryDto => ({
    id,
    name: `c${id}`,
    parentId,
    productCount: 0,
    noteOptions
  })
  const categories = [category(1, null, ['No sauce']), category(2, 1, []), category(3, 1, ['Spicy'])]

  it("uses the product's own category first, then its parent's", () => {
    expect(noteOptionsFor(categories, 3)).toEqual(['Spicy'])
    expect(noteOptionsFor(categories, 2)).toEqual(['No sauce'])
    expect(noteOptionsFor(categories, null)).toEqual([])
  })
})
