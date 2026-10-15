import type { Page } from '@playwright/test'
import {
  clearPrintedReceipt,
  expect,
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
  await setUpShop(running.page, 'cafe_fast_food')
})

test.afterAll(async () => {
  await running?.app.close()
})

test.describe.configure({ mode: 'serial' })

async function addTwoBurgersAndNoteOne(page: Page): Promise<void> {
  await goTo(page, 'Point of sale')
  await page.getByRole('group', { name: 'Categories' }).getByRole('button', { name: 'Burgers' }).click()
  const tile = page.getByRole('button', { name: /Cheeseburger/ })
  await tile.click()
  await tile.click()
  await expect(page.getByLabel('Quantity: Cheeseburger')).toHaveValue('2')

  await page.getByRole('button', { name: 'Add a note' }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByRole('heading', { name: 'Note: Cheeseburger' })).toBeVisible()
  await dialog.getByRole('button', { name: 'No sauce' }).click()
  // A new note goes on one unit by default.
  await expect(dialog.getByText('1', { exact: true })).toBeVisible()
  await dialog.getByRole('button', { name: 'Save changes' }).click()

  const quantities = page.getByLabel('Quantity: Cheeseburger')
  await expect(quantities).toHaveCount(2)
  await expect(quantities.nth(0)).toHaveValue('1')
  await expect(quantities.nth(1)).toHaveValue('1')
  await expect(page.getByRole('button', { name: 'No sauce' })).toBeVisible()
}

test('menu items are sold without stock', async () => {
  const { page } = running
  await goTo(page, 'Products & stock')
  await page.getByRole('button', { name: 'Add product' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Product name').fill('Cheeseburger')
  await dialog.getByLabel('Category').selectOption({ label: 'Burgers' })
  await dialog.getByLabel(/^Purchase price/).fill('2')
  await dialog.getByLabel(/^Sale price/).fill('5')
  // Cafes start new products without stock tracking.
  await expect(dialog.getByLabel('Track stock for this product')).not.toBeChecked()
  await expect(dialog.getByLabel('Opening quantity')).toHaveCount(0)
  await dialog.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByRole('row', { name: /Cheeseburger/ }).getByText('No stock')).toBeVisible()
})

test('a note picked for one of two burgers splits the line, and prints with the order number', async () => {
  const { page } = running
  await addTwoBurgersAndNoteOne(page)
  await page.getByRole('group', { name: 'Order type' }).getByRole('button', { name: 'Takeaway' }).click()

  await page.getByRole('button', { name: /^Pay/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm sale' }).click()
  const done = page.getByRole('dialog')
  await expect(done.getByText('Order number')).toBeVisible()
  await expect(done.getByText('001', { exact: true })).toBeVisible()

  await clearPrintedReceipt(page)
  await done.getByRole('button', { name: 'Print receipt' }).click()
  const receipt = await printedReceipt(page)
  expect(receipt).toContain('001')
  expect(receipt).toContain('Takeaway')
  expect(receipt).toContain('No sauce')
  await done.getByRole('button', { name: 'New invoice' }).click()
})

test('the next order is 002', async () => {
  const { page } = running
  await page.getByRole('button', { name: /Cheeseburger/ }).click()
  await page.getByRole('button', { name: /^Pay/ }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm sale' }).click()
  await expect(page.getByRole('dialog').getByText('002', { exact: true })).toBeVisible()
  await page.getByRole('dialog').getByRole('button', { name: 'New invoice' }).click()
})

test('a held cart keeps its notes when resumed', async () => {
  const { page } = running
  await addTwoBurgersAndNoteOne(page)
  await page.getByRole('button', { name: 'Hold', exact: true }).click()
  await expect(page.getByText('Invoice put on hold')).toBeVisible()
  await expect(page.getByLabel('Quantity: Cheeseburger')).toHaveCount(0)

  await page.getByRole('button', { name: 'Held (1)' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Resume' }).click()
  await expect(page.getByLabel('Quantity: Cheeseburger')).toHaveCount(2)
  await expect(page.getByRole('button', { name: 'No sauce' })).toBeVisible()
})
