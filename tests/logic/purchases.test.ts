import { describe, expect, it } from 'vitest'
import { createPurchase, getPurchase, listPurchases } from '../../main/services/purchases.service'
import { listSuppliers } from '../../main/services/suppliers.service'
import { expectError, freshShop, makeProduct, makeSupplier, query, stockOf } from './helpers'

describe('purchases', () => {
  it('raise stock, average the cost and record what is owed to the supplier', async () => {
    const { owner } = await freshShop()
    const supplier = await makeSupplier()
    const rice = await makeProduct(owner, { purchasePrice: 4, quantity: 10 })

    const purchase = await createPurchase(
      {
        supplierId: supplier.id,
        items: [{ productId: rice.id, quantity: 10, unitCost: 6 }],
        paidAmount: 40
      },
      owner
    )
    expect(purchase).toMatchObject({
      total: 60,
      paidAmount: 40,
      paymentStatus: 'partial',
      number: 'PUR-000001'
    })
    expect(await stockOf(rice.id)).toBe(20)
    const [{ purchase_price }] = await query<{ purchase_price: number }>(
      'SELECT purchase_price FROM products WHERE id = ?',
      [rice.id]
    )
    // (10 x 4 + 10 x 6) / 20
    expect(purchase_price).toBe(5)
    expect((await listSuppliers({}))[0].balance).toBe(20)
    expect((await getPurchase({ id: purchase.id })).items).toHaveLength(1)
    expect((await listPurchases({})).total).toBe(1)
  })

  it('refuse items sold without stock, repeated lines and unknown suppliers', async () => {
    const { owner } = await freshShop('cafe')
    const supplier = await makeSupplier()
    const tea = await makeProduct(owner, { trackStock: false })
    const milk = await makeProduct(owner)
    const one = (productId: number) => ({ productId, quantity: 1, unitCost: 1 })

    await expectError(
      createPurchase({ supplierId: supplier.id, items: [one(tea.id)], paidAmount: 0 }, owner),
      'VALIDATION'
    )
    await expectError(
      createPurchase({ supplierId: supplier.id, items: [one(milk.id), one(milk.id)], paidAmount: 0 }, owner),
      'VALIDATION'
    )
    await expectError(
      createPurchase({ supplierId: 999, items: [one(milk.id)], paidAmount: 0 }, owner),
      'NOT_FOUND'
    )
  })
})
