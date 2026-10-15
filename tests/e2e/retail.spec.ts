import { localDate } from '../../shared/store'
import {
  clearPrintedReceipt,
  expect,
  exportedFiles,
  goTo,
  launchApp,
  printedReceipt,
  setUpShop,
  test,
  type RunningApp
} from './app'

let running: RunningApp

test.beforeAll(async () => {
  running = await launchApp()
  await setUpShop(running.page, 'grocery')
})

test.afterAll(async () => {
  await running?.app.close()
})

test.describe.configure({ mode: 'serial' })

test('add a category and a product that expires soon', async () => {
  const { page } = running
  await goTo(page, 'Products & stock')

  await page.getByRole('tab', { name: 'Categories' }).click()
  await page.getByRole('button', { name: 'Add category' }).click()
  const categoryDialog = page.getByRole('dialog')
  await categoryDialog.getByLabel('Category name').fill('Bakery')
  await categoryDialog.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByRole('cell', { name: 'Bakery' })).toBeVisible()

  await page.getByRole('tab', { name: 'Products' }).click()
  await page.getByRole('button', { name: 'Add product' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Product name').fill('Milk 1L')
  await dialog.getByLabel('Barcode').fill('777001')
  await dialog.getByLabel('Category').selectOption({ label: 'Dairy' })
  await dialog.getByLabel(/^Purchase price/).fill('1.5')
  await dialog.getByLabel(/^Sale price/).fill('2.25')
  await dialog.getByLabel('Opening quantity').fill('10')
  await dialog.getByLabel('Expiry date').fill(localDate(5))
  await dialog.getByRole('button', { name: 'Add', exact: true }).click()

  const row = page.getByRole('row', { name: /Milk 1L/ })
  await expect(row).toBeVisible()
  await expect(row.getByText('Expiring soon')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Expiring soon (1)' })).toBeVisible()
})

test('sell at the point of sale and print the receipt', async () => {
  const { page } = running
  await goTo(page, 'Point of sale')
  const search = page.getByRole('searchbox', { name: 'Search for a product or scan a barcode…' })
  // A scanner types the code and presses Enter.
  for (let i = 0; i < 2; i++) {
    await search.fill('777001')
    await search.press('Enter')
  }
  await expect(page.getByLabel('Quantity: Milk 1L')).toHaveValue('2')

  await page.getByRole('button', { name: /^Pay/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm sale' }).click()
  const done = page.getByRole('dialog')
  await expect(done.getByText('INV-000001')).toBeVisible()

  await clearPrintedReceipt(page)
  await done.getByRole('button', { name: 'Print receipt' }).click()
  const receipt = await printedReceipt(page)
  expect(receipt).toContain('E2E Shop')
  expect(receipt).toContain('Milk 1L')
  expect(receipt).toContain('INV-000001')
  await done.getByRole('button', { name: 'New invoice' }).click()
  await expect(page.getByText('Add products by searching or scanning a barcode')).toBeVisible()
})

test('return part of the invoice', async () => {
  const { page } = running
  await goTo(page, 'Invoices')
  await page.getByRole('row', { name: /INV-000001/ }).getByRole('button', { name: 'View invoice' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByRole('button', { name: 'Return items' }).click()
  await dialog.getByLabel('Return quantity: Milk 1L').fill('1')
  await dialog.getByRole('button', { name: 'Confirm return' }).click()
  await expect(dialog.getByText('Partly returned')).toBeVisible()
  await dialog.getByRole('button', { name: 'Close' }).click()

  await goTo(page, 'Products & stock')
  // 10 opening - 2 sold + 1 returned.
  await expect(page.getByRole('row', { name: /Milk 1L/ }).getByRole('cell', { name: '9', exact: true })).toBeVisible()
})

test('a purchase raises the stock', async () => {
  const { page } = running
  await goTo(page, 'Suppliers')
  await page.getByRole('button', { name: 'Add supplier' }).click()
  await page.getByRole('dialog').getByLabel('Name').fill('Dairy Co')
  await page.getByRole('dialog').getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByRole('cell', { name: 'Dairy Co' })).toBeVisible()

  await goTo(page, 'Purchases')
  await page.getByRole('button', { name: 'New purchase invoice' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Supplier').selectOption({ label: 'Dairy Co' })
  const search = dialog.getByLabel('Search for a product to add, or scan a barcode…')
  await search.fill('777001')
  await search.press('Enter')
  await dialog.getByLabel('Quantity: Milk 1L').fill('6')
  await dialog.getByRole('button', { name: 'Save invoice' }).click()
  await expect(page.getByText('Purchase invoice saved and stock updated')).toBeVisible()

  await goTo(page, 'Products & stock')
  await expect(page.getByRole('row', { name: /Milk 1L/ }).getByRole('cell', { name: '15', exact: true })).toBeVisible()
})

test('reports show the sale and export to Excel', async () => {
  const { page } = running
  await goTo(page, 'Reports')
  await expect(page.getByText('Net sales').first()).toBeVisible()
  // 2 x 2.25 sold, 1 returned.
  await expect(page.getByText('$2.25').first()).toBeVisible()
  await page.getByRole('button', { name: 'Export Excel' }).click()
  await expect(page.getByText(/^File saved:/)).toBeVisible()
  expect(exportedFiles(running).some((name) => name.endsWith('.xlsx'))).toBe(true)
})
