/// <reference lib="dom" />
// The callbacks passed to page.evaluate run inside the app window, hence the DOM types.
import { mkdtempSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  _electron as electron,
  expect,
  test,
  type ElectronApplication,
  type Page
} from '@playwright/test'

export { expect, test }

export interface RunningApp {
  app: ElectronApplication
  page: Page
  userData: string
  // Where Excel/PDF exports land: the save dialog is answered with this folder.
  exportDir: string
}

// Replaces the system print dialog: remembers what the receipt said and ends the print job.
function installPrintStub(): void {
  const target = window as unknown as { printedReceipt?: string }
  window.print = () => {
    target.printedReceipt = document.querySelector('.print-host')?.textContent ?? ''
    window.dispatchEvent(new Event('afterprint'))
  }
}

// Starts the built app (npm run build first) with its own data folder, so the
// real database is never touched.
export async function launchApp(userData = mkdtempSync(join(tmpdir(), 'pos-e2e-'))): Promise<RunningApp> {
  const exportDir = mkdtempSync(join(tmpdir(), 'pos-e2e-export-'))
  const app = await electron.launch({
    args: ['.', `--user-data-dir=${userData}`],
    // An empty renderer URL makes the app load the built files, not a dev server.
    env: { ...process.env, POS_EXPORT_DIR: exportDir, ELECTRON_RENDERER_URL: '' }
  })
  const page = await app.firstWindow()
  await page.addInitScript(installPrintStub)
  await page.evaluate(installPrintStub)
  return { app, page, userData, exportDir }
}

export const OWNER = { username: 'owner', password: 'owner123' }

export const STORE_TYPE_LABELS = {
  general: 'General shop',
  grocery: 'Grocery shop',
  cleaning: 'Cleaning supplies shop',
  electronics: 'Phones, electronics and computers shop',
  cafe: 'Cafe',
  cafe_fast_food: 'Cafe and fast food'
} as const

// First-run setup in English; ends signed in on the home screen.
export async function setUpShop(page: Page, storeType: keyof typeof STORE_TYPE_LABELS): Promise<void> {
  const language = page.getByLabel(/^(Language|اللغة)$/)
  await expect(language).toBeVisible()
  if ((await language.inputValue()) !== 'en') {
    // Switching language reloads the window.
    await language.selectOption('en')
    await expect(page.getByRole('heading', { name: 'First-time setup' })).toBeVisible()
  }
  await page.getByLabel('Shop name').fill('E2E Shop')
  await page.getByLabel('Business type').selectOption({ label: STORE_TYPE_LABELS[storeType] })
  await page.getByLabel('Your full name').fill('Test Owner')
  await page.getByLabel('Username').fill(OWNER.username)
  await page.getByLabel('Password', { exact: true }).fill(OWNER.password)
  await page.getByLabel('Confirm password').fill(OWNER.password)
  await page.getByRole('button', { name: 'Create account and start' }).click()
  await expect(page.getByRole('navigation')).toBeVisible()
}

export async function signIn(page: Page, username: string, password: string): Promise<void> {
  await page.getByLabel('Username').fill(username)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('navigation')).toBeVisible()
}

export async function signOut(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'User menu' }).click()
  await page.getByRole('menuitem', { name: 'Sign out' }).click()
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
}

export async function goTo(page: Page, navLabel: string): Promise<void> {
  await page.getByRole('navigation').getByRole('link', { name: navLabel, exact: true }).click()
}

// The text of the last receipt sent to the printer.
export async function printedReceipt(page: Page): Promise<string> {
  const read = () =>
    page.evaluate(() => (window as unknown as { printedReceipt?: string }).printedReceipt ?? '')
  await expect.poll(read).not.toBe('')
  return read()
}

export async function clearPrintedReceipt(page: Page): Promise<void> {
  await page.evaluate(() => {
    ;(window as unknown as { printedReceipt?: string }).printedReceipt = ''
  })
}

export function exportedFiles(running: RunningApp): string[] {
  return readdirSync(running.exportDir)
}
