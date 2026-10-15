import { describe, expect, it } from 'vitest'
import { localDate } from '../../shared/store'
import { checkout, holdSale, resumeHeldSale } from '../../main/services/sales.service'
import { saveProduct } from '../../main/services/products.service'
import { freshShop, line, makeProduct, setSetting } from './helpers'

const order = (productId: number, extra: Record<string, unknown> = {}) => ({
  items: [line(productId, 1, { note: 'No sugar' })],
  discount: 0,
  customerId: null,
  orderType: 'takeaway',
  paidAmount: 100,
  ...extra
})

describe('order numbers', () => {
  it('count up from 001 in a cafe', async () => {
    const { owner } = await freshShop('cafe')
    const tea = await makeProduct(owner, { trackStock: false })
    const numbers = []
    for (let i = 0; i < 3; i++) numbers.push((await checkout(order(tea.id), owner)).orderNumber)
    expect(numbers).toEqual([1, 2, 3])
  })

  it('go back to 1 after 500', async () => {
    const { owner } = await freshShop('cafe_fast_food')
    const tea = await makeProduct(owner, { trackStock: false })
    await setSetting('order_number_date', localDate())
    await setSetting('next_order_number', '500')
    expect((await checkout(order(tea.id), owner)).orderNumber).toBe(500)
    expect((await checkout(order(tea.id), owner)).orderNumber).toBe(1)
  })

  it('start again at 1 on a new day', async () => {
    const { owner } = await freshShop('cafe')
    const tea = await makeProduct(owner, { trackStock: false })
    await setSetting('order_number_date', localDate(-1))
    await setSetting('next_order_number', '87')
    expect((await checkout(order(tea.id), owner)).orderNumber).toBe(1)
  })

  it('are not used by shops that do not call orders out', async () => {
    const { owner } = await freshShop('grocery')
    const rice = await makeProduct(owner)
    expect((await checkout(order(rice.id), owner)).orderNumber).toBeNull()
  })
})

describe('order type and line notes', () => {
  it('are kept in a cafe, on the invoice and on a held cart', async () => {
    const { owner } = await freshShop('cafe')
    const tea = await makeProduct(owner, { trackStock: false })
    const sale = await checkout(order(tea.id), owner)
    expect(sale.orderType).toBe('takeaway')
    expect(sale.items[0].note).toBe('No sugar')

    const { id } = await holdSale(order(tea.id), owner)
    const held = await resumeHeldSale({ id }, owner)
    expect(held.orderType).toBe('takeaway')
    expect(held.items[0].note).toBe('No sugar')
  })

  it('are dropped by shops that do not use them', async () => {
    const { owner } = await freshShop('electronics')
    const phone = await makeProduct(owner)
    const sale = await checkout(order(phone.id), owner)
    expect(sale.orderType).toBeNull()
    expect(sale.items[0].note).toBeNull()
  })
})

describe('warranty', () => {
  it('is copied onto the sale line, so later edits do not change old invoices', async () => {
    const { owner } = await freshShop('electronics')
    const phone = await makeProduct(owner, { warrantyMonths: 12 })
    const sale = await checkout(order(phone.id), owner)
    expect(sale.items[0].warrantyMonths).toBe(12)

    await saveProduct({ ...phone, id: phone.id, warrantyMonths: 24 }, owner)
    const later = await checkout(order(phone.id), owner)
    expect(later.items[0].warrantyMonths).toBe(24)
    expect(sale.items[0].warrantyMonths).toBe(12)
  })
})
