import { beforeEach, describe, expect, it } from 'vitest'
import type { HeldSaleDto, PosProduct } from '../../shared/sales'
import { withOption } from '../../renderer/src/lib/noteOptions'
import { useCartStore } from '../../renderer/src/store/cart'

function product(id: number, quantity: number, trackStock = true): PosProduct {
  return {
    id,
    name: `P${id}`,
    barcode: null,
    categoryId: null,
    unit: 'piece',
    salePrice: 2,
    quantity,
    trackStock,
    expiryDate: null,
    isActive: true
  }
}

const cart = () => useCartStore.getState()

describe('cart', () => {
  beforeEach(() => cart().clear())

  it('adds to the plain line and stops at the stock on hand', () => {
    const tea = product(1, 2)
    expect(cart().add(tea)).toBe(true)
    expect(cart().add(tea)).toBe(true)
    expect(cart().add(tea)).toBe(false)
    expect(cart().lines).toHaveLength(1)
    expect(cart().lines[0].quantity).toBe(2)
  })

  it('never caps items sold without stock', () => {
    const coffee = product(2, 0, false)
    for (let i = 0; i < 50; i++) expect(cart().add(coffee)).toBe(true)
    expect(cart().lines[0].quantity).toBe(50)
  })

  it('splits a note off part of a line, and merges it back when cleared', () => {
    const burger = product(3, 0, false)
    cart().add(burger)
    cart().add(burger)
    cart().add(burger)
    const [plain] = cart().lines

    cart().setLineNote(plain.id, 'No sauce', 1)
    expect(cart().lines.map((l) => [l.quantity, l.note])).toEqual([
      [2, ''],
      [1, 'No sauce']
    ])

    // A new unit joins the plain line, not the one with a note.
    cart().add(burger)
    expect(cart().lines.map((l) => [l.quantity, l.note])).toEqual([
      [3, ''],
      [1, 'No sauce']
    ])

    const noted = cart().lines[1]
    cart().setLineNote(noted.id, '', noted.quantity)
    expect(cart().lines.map((l) => [l.quantity, l.note])).toEqual([[4, '']])
  })

  it('shares the stock limit between lines of one product', () => {
    const juice = product(4, 3)
    cart().add(juice)
    cart().add(juice)
    cart().add(juice)
    cart().setLineNote(cart().lines[0].id, 'No ice', 1)
    const plain = cart().lines.find((l) => l.note === '')!
    cart().setQuantity(plain.id, 10)
    expect(cart().lines.reduce((sum, l) => sum + l.quantity, 0)).toBe(3)
  })

  it('clamps a resumed cart to what is still in stock', () => {
    const held: HeldSaleDto = {
      id: 1,
      customerId: null,
      customerName: null,
      orderType: 'takeaway',
      discount: 0,
      total: 0,
      createdAt: new Date().toISOString(),
      items: [
        { product: product(5, 1), quantity: 3, discount: 0, note: null },
        { product: product(6, 0), quantity: 1, discount: 0, note: null },
        { product: product(7, 0, false), quantity: 2, discount: 0, note: 'No sugar' }
      ]
    }
    cart().load(held)
    expect(cart().orderType).toBe('takeaway')
    expect(cart().lines.map((l) => [l.product.id, l.quantity, l.note])).toEqual([
      [5, 1, ''],
      [7, 2, 'No sugar']
    ])
  })

  it('keeps line discounts within the line value', () => {
    cart().add(product(8, 5))
    const [only] = cart().lines
    cart().setLineDiscount(only.id, 100)
    expect(cart().lines[0].discount).toBe(2)
  })
})

describe('note option editing', () => {
  it('ignores blanks and repeats and strips the separator', () => {
    expect(withOption([], '  ')).toEqual([])
    expect(withOption(['A'], 'A')).toEqual(['A'])
    expect(withOption([], ' No   sauce ')).toEqual(['No sauce'])
    expect(withOption([], 'a،b')).toEqual(['a b'])
  })

  it('stops at the limit', () => {
    const full = Array.from({ length: 20 }, (_, i) => `o${i}`)
    expect(withOption(full, 'one more')).toHaveLength(20)
  })
})
