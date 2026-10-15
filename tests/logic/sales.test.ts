import { describe, expect, it } from 'vitest'
import { customerStatement, listCustomers } from '../../main/services/customers.service'
import {
  checkout,
  getSale,
  holdSale,
  listHeldSales,
  listSales,
  resumeHeldSale,
  returnSale
} from '../../main/services/sales.service'
import { listMovements } from '../../main/services/products.service'
import {
  expectError,
  freshShop,
  line,
  makeCustomer,
  makeProduct,
  query,
  setSetting,
  stockOf
} from './helpers'

const sell = (items: ReturnType<typeof line>[], extra: Record<string, unknown> = {}) => ({
  items,
  discount: 0,
  customerId: null,
  paidAmount: 1e6,
  ...extra
})

describe('checkout', () => {
  it('prices from the database, applies discounts and tax, and counts stock down', async () => {
    const { owner } = await freshShop()
    await setSetting('tax_rate', '10')
    const a = await makeProduct(owner, { salePrice: 10, quantity: 5 })
    const b = await makeProduct(owner, { salePrice: 4, quantity: 5 })

    const sale = await checkout(sell([line(a.id, 2, { discount: 2 }), line(b.id, 1)], { discount: 2 }), owner)
    expect(sale).toMatchObject({ subtotal: 22, discount: 2, tax: 2, total: 22, paidAmount: 22 })
    expect(sale.paymentStatus).toBe('paid')
    expect(await stockOf(a.id)).toBe(3)
    expect(await stockOf(b.id)).toBe(4)
    const [movement] = await listMovements({ productId: a.id })
    expect(movement).toMatchObject({ type: 'out', quantity: 2, referenceType: 'sale' })
  })

  it('numbers invoices without gaps', async () => {
    const { owner } = await freshShop()
    const p = await makeProduct(owner)
    const first = await checkout(sell([line(p.id, 1)]), owner)
    await expectError(checkout(sell([line(p.id, 999)]), owner), 'INSUFFICIENT_STOCK')
    const second = await checkout(sell([line(p.id, 1)]), owner)
    expect([first.invoiceNumber, second.invoiceNumber]).toEqual(['INV-000001', 'INV-000002'])
  })

  it('checks stock against the total of all lines of one product', async () => {
    const { owner } = await freshShop()
    const p = await makeProduct(owner, { quantity: 3 })
    await expectError(checkout(sell([line(p.id, 2), line(p.id, 2)]), owner), 'INSUFFICIENT_STOCK')
    expect(await stockOf(p.id)).toBe(3)
    await checkout(sell([line(p.id, 2), line(p.id, 1)]), owner)
    expect(await stockOf(p.id)).toBe(0)
  })

  it('sells items without stock and leaves no movement', async () => {
    const { owner } = await freshShop('cafe')
    const tea = await makeProduct(owner, { trackStock: false })
    await checkout(sell([line(tea.id, 7)]), owner)
    expect(await stockOf(tea.id)).toBe(0)
    expect(await listMovements({ productId: tea.id })).toHaveLength(0)
  })

  it('refuses archived products and bad quantities', async () => {
    const { owner } = await freshShop()
    const p = await makeProduct(owner, { isActive: false })
    await expectError(checkout(sell([line(p.id, 1)]), owner), 'PRODUCT_UNAVAILABLE')
    const q = await makeProduct(owner)
    await expectError(checkout(sell([line(q.id, 0)]), owner), 'VALIDATION')
    await expectError(checkout(sell([]), owner), 'VALIDATION')
  })

  it('puts an unpaid remainder on the customer, and needs one', async () => {
    const { owner } = await freshShop()
    const p = await makeProduct(owner, { salePrice: 50 })
    await expectError(checkout(sell([line(p.id, 1)], { paidAmount: 20 }), owner), 'CUSTOMER_REQUIRED')

    const customer = await makeCustomer('Ali')
    const sale = await checkout(sell([line(p.id, 1)], { paidAmount: 20, customerId: customer.id }), owner)
    expect(sale).toMatchObject({ paymentStatus: 'partial', paymentMethod: 'mixed', paidAmount: 20 })
    const [ali] = await listCustomers({})
    expect(ali.balance).toBe(30)
  })

  it('shows a cashier only their own invoices', async () => {
    const { owner, cashier } = await freshShop()
    const p = await makeProduct(owner)
    const ownerSale = await checkout(sell([line(p.id, 1)]), owner)
    await checkout(sell([line(p.id, 1)]), cashier)
    expect((await listSales({}, cashier)).total).toBe(1)
    expect((await listSales({}, owner)).total).toBe(2)
    await expectError(getSale({ id: ownerSale.id }, cashier), 'NOT_FOUND')
  })
})

describe('held sales', () => {
  it('park a cart without touching stock or invoice numbers, and resume it', async () => {
    const { owner } = await freshShop()
    const p = await makeProduct(owner, { quantity: 4 })
    const { id } = await holdSale({ items: [line(p.id, 2)], discount: 1, customerId: null }, owner)
    expect(await stockOf(p.id)).toBe(4)
    expect(await listHeldSales(owner)).toHaveLength(1)
    expect((await listSales({}, owner)).total).toBe(0)

    const resumed = await resumeHeldSale({ id }, owner)
    expect(resumed.items).toHaveLength(1)
    expect(resumed.items[0]).toMatchObject({ quantity: 2 })
    expect(resumed.discount).toBe(1)
    expect(await listHeldSales(owner)).toHaveLength(0)

    const sale = await checkout(sell([line(p.id, 1)]), owner)
    expect(sale.invoiceNumber).toBe('INV-000001')
  })
})

describe('returns', () => {
  it('restore stock and cancel debt before refunding cash', async () => {
    const { owner } = await freshShop()
    const p = await makeProduct(owner, { salePrice: 10, quantity: 10 })
    const customer = await makeCustomer()
    const sale = await checkout(
      sell([line(p.id, 4)], { customerId: customer.id, paidAmount: 25 }),
      owner
    )
    const [item] = sale.items

    const first = await returnSale({ saleId: sale.id, items: [{ saleItemId: item.id, quantity: 2 }] }, owner)
    expect(first).toMatchObject({ returnValue: 20, debtReduction: 15, cashRefund: 5 })
    expect(first.sale.status).toBe('partially_returned')
    expect(await stockOf(p.id)).toBe(8)
    expect((await listCustomers({}))[0].balance).toBe(0)

    const second = await returnSale({ saleId: sale.id, items: [{ saleItemId: item.id, quantity: 2 }] }, owner)
    expect(second).toMatchObject({ returnValue: 20, debtReduction: 0, cashRefund: 20 })
    expect(second.sale.status).toBe('returned')
    expect(await stockOf(p.id)).toBe(10)

    await expectError(
      returnSale({ saleId: sale.id, items: [{ saleItemId: item.id, quantity: 1 }] }, owner),
      'RETURN_EXCEEDS'
    )

    const statement = await customerStatement({ id: customer.id })
    expect(statement.computedBalance).toBe(0)
  })

  it('of items without stock leave stock alone', async () => {
    const { owner } = await freshShop('cafe')
    const tea = await makeProduct(owner, { trackStock: false })
    const sale = await checkout(sell([line(tea.id, 3)]), owner)
    await returnSale({ saleId: sale.id, items: [{ saleItemId: sale.items[0].id, quantity: 1 }] }, owner)
    expect(await stockOf(tea.id)).toBe(0)
    const [{ count }] = await query<{ count: number }>(
      'SELECT COUNT(*) AS count FROM inventory_transactions WHERE product_id = ?',
      [tea.id]
    )
    expect(count).toBe(0)
  })
})
