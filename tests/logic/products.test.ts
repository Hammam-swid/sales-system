import { describe, expect, it } from 'vitest'
import { localDate } from '../../shared/store'
import {
  adjustStock,
  deleteProduct,
  listMovements,
  listProducts,
  saveProduct
} from '../../main/services/products.service'
import { checkout } from '../../main/services/sales.service'
import { expectError, freshShop, line, makeProduct, stockOf } from './helpers'

describe('products', () => {
  it('records opening stock as a movement and refuses a duplicate barcode', async () => {
    const { owner } = await freshShop()
    const product = await makeProduct(owner, { barcode: '111', quantity: 12 })
    expect(product.quantity).toBe(12)
    const movements = await listMovements({ productId: product.id })
    expect(movements).toHaveLength(1)
    expect(movements[0]).toMatchObject({ type: 'in', quantity: 12 })
    await expectError(makeProduct(owner, { barcode: '111' }), 'BARCODE_TAKEN')
  })

  it('never changes stock when a product is edited', async () => {
    const { owner } = await freshShop()
    const product = await makeProduct(owner, { quantity: 7 })
    const edited = await saveProduct(
      { ...product, id: product.id, name: 'Renamed', salePrice: 12, purchasePrice: 6, quantity: 999 },
      owner
    )
    expect(edited.name).toBe('Renamed')
    expect(edited.quantity).toBe(7)
  })

  it('hides cost prices from cashiers', async () => {
    const { owner, cashier } = await freshShop()
    await makeProduct(owner)
    const [asCashier] = (await listProducts({}, cashier)).items
    const [asOwner] = (await listProducts({}, owner)).items
    expect(asCashier.purchasePrice).toBeNull()
    expect(asOwner.purchasePrice).toBe(5)
  })

  it('deletes a product without history and archives one that was sold', async () => {
    const { owner } = await freshShop()
    const unused = await makeProduct(owner)
    const sold = await makeProduct(owner)
    await checkout({ items: [line(sold.id, 1)], discount: 0, customerId: null, paidAmount: 10 }, owner)

    expect(await deleteProduct({ id: unused.id }, owner)).toEqual({ outcome: 'deleted' })
    expect(await deleteProduct({ id: sold.id }, owner)).toEqual({ outcome: 'archived' })
    const all = await listProducts({ status: 'all' }, owner)
    expect(all.items.map((p) => [p.id, p.isActive])).toEqual([[sold.id, false]])
  })

  it('adjusts stock in, out and by count, never below zero', async () => {
    const { owner } = await freshShop()
    const product = await makeProduct(owner, { quantity: 10 })
    await adjustStock({ productId: product.id, type: 'in', quantity: 5, reason: 'delivery' }, owner)
    await adjustStock({ productId: product.id, type: 'out', quantity: 3, reason: 'damaged' }, owner)
    expect(await stockOf(product.id)).toBe(12)
    const counted = await adjustStock(
      { productId: product.id, type: 'adjustment', quantity: 9, reason: 'count' },
      owner
    )
    expect(counted.quantity).toBe(9)
    const [latest] = await listMovements({ productId: product.id })
    expect(latest).toMatchObject({ type: 'adjustment', quantity: -3 })
    await expectError(
      adjustStock({ productId: product.id, type: 'out', quantity: 50, reason: 'x' }, owner),
      'INSUFFICIENT_STOCK'
    )
  })

  it('finds by name or barcode prefix, and filters low stock', async () => {
    const { owner } = await freshShop()
    await makeProduct(owner, { name: 'Green tea', barcode: '6200001', quantity: 1, minQuantity: 2 })
    await makeProduct(owner, { name: 'Coffee beans', barcode: '6200002', quantity: 50 })
    expect((await listProducts({ search: 'tea' }, owner)).items.map((p) => p.name)).toEqual([
      'Green tea'
    ])
    expect((await listProducts({ search: '62000' }, owner)).total).toBe(2)
    const low = await listProducts({ lowStockOnly: true }, owner)
    expect(low.items.map((p) => p.name)).toEqual(['Green tea'])
    expect(low.lowStockCount).toBe(1)
  })

  it('flags expired and soon-expiring products', async () => {
    const { owner } = await freshShop('grocery')
    await makeProduct(owner, { name: 'Old milk', expiryDate: localDate(-1) })
    await makeProduct(owner, { name: 'Yogurt', expiryDate: localDate(10) })
    await makeProduct(owner, { name: 'Rice', expiryDate: localDate(200) })
    await makeProduct(owner, { name: 'Salt', expiryDate: null })
    const expiring = await listProducts({ expiringOnly: true }, owner)
    expect(expiring.items.map((p) => p.name).sort()).toEqual(['Old milk', 'Yogurt'])
    expect(expiring.expiringCount).toBe(2)
    await expectError(makeProduct(owner, { expiryDate: '2026-02-31' }), 'VALIDATION')
  })

  it('treats items sold without stock as never low and never adjustable', async () => {
    const { owner } = await freshShop('cafe')
    const espresso = await makeProduct(owner, { trackStock: false, quantity: 5, minQuantity: 3 })
    expect(espresso.quantity).toBe(0)
    expect(espresso.isLowStock).toBe(false)
    expect((await listProducts({ lowStockOnly: true }, owner)).total).toBe(0)
    expect((await listProducts({ trackedOnly: true }, owner)).total).toBe(0)
    await expectError(
      adjustStock({ productId: espresso.id, type: 'in', quantity: 1, reason: 'x' }, owner),
      'VALIDATION'
    )
  })

  it('validates names, units, prices and warranty', async () => {
    const { owner } = await freshShop()
    await expectError(makeProduct(owner, { name: '' }), 'VALIDATION')
    await expectError(makeProduct(owner, { unit: 'crate' as never }), 'VALIDATION')
    await expectError(makeProduct(owner, { salePrice: -1 }), 'VALIDATION')
    await expectError(makeProduct(owner, { warrantyMonths: 500 }), 'VALIDATION')
  })
})
