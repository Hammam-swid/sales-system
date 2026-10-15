import { existsSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { performance } from 'node:perf_hooks'
import { expect, goTo, launchApp, test } from '../e2e/app'
import { BUDGETS } from './budgets'
import { LATEST_FILE, writeReport, type BenchmarkResult, type Timing } from './report'

// The same folder the benchmark filled (see tests/perf/setup.ts).
const perfData = process.env.PERF_DATA_DIR ?? join(tmpdir(), 'pos-perf-data')
const LAUNCHES = 3
const SEARCHES = ['rice', 'soap', 'cable', 'juice', 'bread', 'tea', 'detergent', 'phone case']

function timing(name: string, times: number[]): Timing {
  const sorted = [...times].sort((a, b) => a - b)
  const at = (p: number) => sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)]
  return {
    name,
    runs: times.length,
    p50: at(50),
    p95: at(95),
    max: sorted[sorted.length - 1],
    budget: BUDGETS[name] ?? null,
    scans: []
  }
}

test('app startup and checkout search on the busy-shop database', async () => {
  test.setTimeout(5 * 60_000)
  test.skip(!existsSync(join(perfData, 'pos.db')) || !existsSync(LATEST_FILE), 'Run the benchmark first')

  const toLogin: number[] = []
  const toHome: number[] = []
  const searches: number[] = []

  for (let launch = 0; launch < LAUNCHES; launch++) {
    const started = performance.now()
    const running = await launchApp(perfData)
    const { app, page } = running
    try {
      const signIn = page.getByRole('button', { name: 'Sign in' })
      await expect(signIn).toBeVisible({ timeout: 30_000 })
      toLogin.push(performance.now() - started)

      await page.getByLabel('Username').fill('owner')
      await page.getByLabel('Password', { exact: true }).fill('owner123')
      const signedIn = performance.now()
      await signIn.click()
      await expect(page.getByRole('navigation')).toBeVisible()
      toHome.push(performance.now() - signedIn)

      if (launch === 0) {
        await goTo(page, 'Point of sale')
        const search = page.getByRole('searchbox', { name: 'Search for a product or scan a barcode…' })
        for (const term of SEARCHES) {
          const typed = performance.now()
          await search.fill(term)
          // Results replace the grid after a 200 ms pause in typing, which is part of what the cashier waits for.
          await expect(page.getByRole('button', { name: new RegExp(`Product \\d+ ${term}`) }).first()).toBeVisible()
          await expect(page.getByRole('button', { name: /Product \d+ / }).filter({ hasNotText: term })).toHaveCount(0)
          searches.push(performance.now() - typed)
        }
      }
    } finally {
      await app.close()
    }
  }

  const result: BenchmarkResult = JSON.parse(readFileSync(LATEST_FILE, 'utf8'))
  result.startup = [
    timing('App start to sign-in screen', toLogin),
    timing('Sign-in to home screen', toHome),
    timing('POS: typing to products shown', searches)
  ]
  console.log(`\n${writeReport(result)}`)
})
