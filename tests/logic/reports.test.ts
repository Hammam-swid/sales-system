import { describe, expect, it } from 'vitest'
import { localDate } from '../../shared/store'
import { listExpenseCategories, saveExpense } from '../../main/services/expenses.service'
import { createPurchase } from '../../main/services/purchases.service'
import {
  balancesReport,
  productsReport,
  profitReport,
  salesReport
} from '../../main/services/reports.service'
import { checkout, returnSale } from '../../main/services/sales.service'
import { freshShop, line, makeCustomer, makeProduct, makeSupplier, setSetting } from './helpers'

// A small, fully known day of trading, so every report figure can be checked exactly.
async function tradingDay() {
  const { owner } = await freshShop()
  await setSetting('tax_rate', '10')
  const tea = await makeProduct(owner, { name: 'Tea', purchasePrice: 4, salePrice: 10, quantity: 20 })
  const cups = await makeProduct(owner, {
    name: 'Cups',
    purchasePrice: 1,
    salePrice: 2,
    quantity: 50,
    minQuantity: 60
  })
  const customer = await makeCustomer()
  const supplier = await makeSupplier()

  // Sale 1: 2 tea + 5 cups = 30, tax 3, paid in full.
  await checkout(
    { items: [line(tea.id, 2), line(cups.id, 5)], discount: 0, customerId: null, paidAmount: 100 },
    owner
  )
  // Sale 2: 1 tea = 10, tax 1, total 11, on credit; then returned in full.
  const credit = await checkout(
    { items: [line(tea.id, 1)], discount: 0, customerId: customer.id, paidAmount: 0 },
    owner
  )
  await returnSale(
    { saleId: credit.id, items: [{ saleItemId: credit.items[0].id, quantity: 1 }] },
    owner
  )

  await createPurchase(
    { supplierId: supplier.id, items: [{ productId: cups.id, quantity: 10, unitCost: 1 }], paidAmount: 4 },
    owner
  )
  const rent = (await listExpenseCategories()).find((category) => category.name === 'Rent')!
  await saveExpense({ categoryId: rent.id, amount: 7, expenseDate: localDate() }, owner)
  return { tea, cups }
}

const today = () => ({ from: localDate(), to: localDate() })

describe('reports', () => {
  it('add up the sales report', async () => {
    await tradingDay()
    const report = await salesReport({ ...today(), groupBy: 'day' })
    expect(report).toMatchObject({ invoices: 2, sales: 44, returns: 11, net: 33, tax: 3 })
    expect(report.periods).toHaveLength(1)
  })

  it('add up the profit report', async () => {
    await tradingDay()
    const report = await profitReport(today())
    // Revenue excludes tax: 2 x 10 + 5 x 2 kept. Cost: 2 x 4 + 5 x 1.
    expect(report).toMatchObject({
      revenue: 30,
      costOfGoods: 13,
      grossProfit: 17,
      expenses: 7,
      netProfit: 10,
      tax: 3
    })
    expect(report.expensesByCategory).toEqual([{ category: 'Rent', amount: 7 }])
  })

  it('rank products and value the stock', async () => {
    const { tea, cups } = await tradingDay()
    const report = await productsReport(today())
    expect(report.bestSellers.map((row) => [row.productId, row.quantity])).toEqual([
      [cups.id, 5],
      [tea.id, 2]
    ])
    // Tea: 18 left at cost 4. Cups: 55 left at cost 1.
    expect(report.inventory).toMatchObject({
      productCount: 2,
      costValue: 127,
      retailValue: 290,
      lowStockCount: 1
    })
  })

  it('list who owes and who is owed', async () => {
    await tradingDay()
    const report = await balancesReport()
    expect(report.customerTotal).toBe(0)
    expect(report.supplierTotal).toBe(6)
  })
})
