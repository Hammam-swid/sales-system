import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DATASET, type GeneratedStats } from './generate'

export const RESULTS_DIR = join(__dirname, 'results')
export const LATEST_FILE = join(RESULTS_DIR, 'latest.json')

export interface Timing {
  name: string
  runs: number
  p50: number
  p95: number
  max: number
  budget: number | null
  // Table scans SQLite reported for the statements this operation ran.
  scans: string[]
}

export interface BenchmarkResult {
  stats: GeneratedStats | null
  timings: Timing[]
  dbBytes: number
  // Measured in the running app by startup.spec.ts.
  startup: Timing[]
}

// Notes on known slow spots, shown under the table when that operation is over budget.
const DIAGNOSES: Record<string, string> = {}

const ms = (value: number) => (value >= 100 ? value.toFixed(0) : value.toFixed(1))
const count = (value: number) => value.toLocaleString('en')

export function renderReport(result: BenchmarkResult): string {
  const all = [...result.timings, ...result.startup]
  const over = all.filter((t) => t.budget !== null && t.p95 > t.budget)
  const { stats } = result
  const lines = [
    `# Performance results — ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`,
    '',
    `Dataset: ${count(DATASET.products)} products, ${count(DATASET.customers)} customers, ` +
      `${count(DATASET.sales)} invoices over ${DATASET.years} years, ${count(DATASET.purchases)} purchases, ` +
      `${count(DATASET.expenses)} expenses.`,
    stats
      ? `Generated ${count(stats.saleItems)} invoice lines and ${count(stats.movements)} stock movements in ${stats.seconds.toFixed(1)} s.`
      : 'Reused an existing generated database.',
    `Database file: ${(result.dbBytes / 1024 / 1024).toFixed(1)} MB.`,
    '',
    over.length === 0
      ? '**All operations are within budget.**'
      : `**${over.length} operation(s) over budget:** ${over.map((t) => t.name).join(', ')}.`,
    '',
    '| Operation | Runs | p50 (ms) | p95 (ms) | max (ms) | Budget (ms) | Result |',
    '|---|---:|---:|---:|---:|---:|---|',
    ...all.map(
      (t) =>
        `| ${t.name} | ${t.runs} | ${ms(t.p50)} | ${ms(t.p95)} | ${ms(t.max)} | ${t.budget ?? '—'} | ${
          t.budget === null ? '—' : t.p95 <= t.budget ? 'ok' : '**over**'
        } |`
    ),
    ''
  ]

  const diagnosed = over.filter((t) => DIAGNOSES[t.name])
  if (diagnosed.length > 0) {
    lines.push('## Why it is slow', '')
    for (const t of diagnosed) lines.push(`- **${t.name}:** ${DIAGNOSES[t.name]}`)
    lines.push('')
  }

  const scanned = all.filter((t) => t.scans.length > 0)
  if (scanned.length > 0) {
    lines.push('## Full table scans', '', 'SQLite reads every row of these tables for the operation:', '')
    for (const t of scanned) lines.push(`- ${t.name}: ${t.scans.join('; ')}`)
    lines.push('')
  }
  if (result.startup.length === 0) {
    lines.push('_App startup was not measured in this run._', '')
  }
  return lines.join('\n')
}

// Writes latest.json plus a dated .md and .json copy; returns the markdown.
export function writeReport(result: BenchmarkResult): string {
  mkdirSync(RESULTS_DIR, { recursive: true })
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')
  const markdown = renderReport(result)
  writeFileSync(join(RESULTS_DIR, `${stamp}.md`), markdown)
  writeFileSync(join(RESULTS_DIR, `${stamp}.json`), JSON.stringify(result, null, 2))
  writeFileSync(LATEST_FILE, JSON.stringify(result, null, 2))
  return markdown
}
