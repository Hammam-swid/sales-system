import {
  expect,
  goTo,
  launchApp,
  OWNER,
  setUpShop,
  signIn,
  signOut,
  test,
  type RunningApp
} from './app'

let running: RunningApp

test.beforeAll(async () => {
  running = await launchApp()
  await setUpShop(running.page, 'general')
})

test.afterAll(async () => {
  await running?.app.close()
})

test.describe.configure({ mode: 'serial' })

test('the owner adds a cashier', async () => {
  const { page } = running
  await goTo(page, 'Users')
  await page.getByRole('button', { name: 'Add user' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Full name').fill('Sam Cashier')
  await dialog.getByLabel('Username').fill('sam')
  await dialog.getByLabel('Password', { exact: true }).fill('cashier1')
  await dialog.getByLabel('Role').selectOption({ label: 'Cashier' })
  await dialog.getByRole('button', { name: 'Add', exact: true }).click()
  await expect(page.getByRole('row', { name: /Sam Cashier/ })).toBeVisible()
})

test('a cashier sees only what a cashier may use', async () => {
  const { page } = running
  await signOut(page)
  await signIn(page, 'sam', 'cashier1')

  const nav = page.getByRole('navigation')
  for (const allowed of ['Point of sale', 'Products & stock', 'Invoices', 'Customers']) {
    await expect(nav.getByRole('link', { name: allowed, exact: true })).toBeVisible()
  }
  for (const hidden of ['Settings', 'Users', 'Reports', 'Purchases', 'Expenses', 'Suppliers']) {
    await expect(nav.getByRole('link', { name: hidden, exact: true })).toHaveCount(0)
  }

  await goTo(page, 'Products & stock')
  await expect(page.getByRole('columnheader', { name: 'Sale price' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Purchase price' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Add product' })).toHaveCount(0)
})

test('a user changes their own password', async () => {
  const { page } = running
  await page.getByRole('button', { name: 'User menu' }).click()
  await page.getByRole('menuitem', { name: 'Change password' }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Current password').fill('cashier1')
  await dialog.getByLabel('New password').fill('cashier2')
  await dialog.getByLabel('Confirm password').fill('cashier2')
  await dialog.getByRole('button', { name: 'Save changes' }).click()
  await expect(dialog.getByText('Password changed')).toBeVisible()
  await dialog.getByRole('button', { name: 'Close' }).first().click()

  await signOut(page)
  await page.getByLabel('Username').fill('sam')
  await page.getByLabel('Password', { exact: true }).fill('cashier1')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await signIn(page, 'sam', 'cashier2')
})

test('the owner makes a backup from Settings', async () => {
  const { page } = running
  await signOut(page)
  await signIn(page, OWNER.username, OWNER.password)
  await goTo(page, 'Settings')
  await page.getByRole('tab', { name: 'Backup' }).click()
  await page.getByRole('button', { name: 'Create a backup in the folder' }).click()
  await expect(page.getByText(/^Backup created: pos-backup-/)).toBeVisible()
  await expect(page.getByRole('cell', { name: /^pos-backup-.*\.db$/ })).toBeVisible()
})
