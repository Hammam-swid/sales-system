import { describe, expect, it } from 'vitest'
import {
  customerStatement,
  deleteCustomer,
  listCustomers,
  recalculateCustomer,
  recordCustomerPayment
} from '../../main/services/customers.service'
import { createPurchase } from '../../main/services/purchases.service'
import { checkout } from '../../main/services/sales.service'
import { recordSupplierPayment, supplierStatement } from '../../main/services/suppliers.service'
import {
  expectError,
  freshShop,
  line,
  makeCustomer,
  makeProduct,
  makeSupplier,
  query
} from './helpers'

describe('customers', () => {
  it('pay off debt, never beyond it, with a matching statement', async () => {
    const { owner } = await freshShop()
    const p = await makeProduct(owner, { salePrice: 100 })
    const customer = await makeCustomer('Sara')
    await checkout(
      { items: [line(p.id, 1)], discount: 0, customerId: customer.id, paidAmount: 0 },
      owner
    )

    await expectError(
      recordCustomerPayment({ id: customer.id, amount: 150 }, owner),
      'PAYMENT_EXCEEDS'
    )
    const after = await recordCustomerPayment({ id: customer.id, amount: 60, note: 'cash' }, owner)
    expect(after.balance).toBe(40)

    const statement = await customerStatement({ id: customer.id })
    expect(statement.entries.map((e) => [e.kind, e.change, e.balanceAfter])).toEqual([
      ['invoice', 100, 100],
      ['payment', -60, 40]
    ])
    expect(statement.computedBalance).toBe(40)
  })

  it('recalculate a balance that drifted from its history', async () => {
    const { owner } = await freshShop()
    const p = await makeProduct(owner, { salePrice: 30 })
    const customer = await makeCustomer()
    await checkout(
      { items: [line(p.id, 1)], discount: 0, customerId: customer.id, paidAmount: 10 },
      owner
    )
    await query('UPDATE customers SET balance = 999 WHERE id = ?', [customer.id])
    expect((await recalculateCustomer({ id: customer.id }, owner)).balance).toBe(20)
  })

  it('cannot be deleted once they have invoices', async () => {
    const { owner } = await freshShop()
    const p = await makeProduct(owner)
    const customer = await makeCustomer()
    await checkout(
      { items: [line(p.id, 1)], discount: 0, customerId: customer.id, paidAmount: 10 },
      owner
    )
    await expectError(deleteCustomer({ id: customer.id }), 'RECORD_IN_USE')
    const unused = await makeCustomer('Unused')
    await deleteCustomer({ id: unused.id })
    expect((await listCustomers({})).map((c) => c.name)).toEqual(['Customer'])
  })
})

describe('suppliers', () => {
  it('are paid against what the shop owes them', async () => {
    const { owner } = await freshShop()
    const supplier = await makeSupplier()
    const p = await makeProduct(owner)
    await createPurchase(
      {
        supplierId: supplier.id,
        items: [{ productId: p.id, quantity: 10, unitCost: 3 }],
        paidAmount: 0
      },
      owner
    )
    await expectError(
      recordSupplierPayment({ id: supplier.id, amount: 31 }, owner),
      'PAYMENT_EXCEEDS'
    )
    expect((await recordSupplierPayment({ id: supplier.id, amount: 30 }, owner)).balance).toBe(0)
    expect((await supplierStatement({ id: supplier.id })).computedBalance).toBe(0)
  })
})
