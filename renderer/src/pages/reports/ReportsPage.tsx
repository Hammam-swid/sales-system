import { useCallback, useState } from 'react'
import { FileSpreadsheet, FileText } from 'lucide-react'
import type { ExportSheet, SalesGrouping } from '../../../../shared/reports'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Tabs } from '../../components/ui/Tabs'
import { t } from '../../i18n'
import { api, errorText } from '../../lib/api'
import { daysAgo, formatDay, monthRange, today, yearStart, type DayRange } from '../../lib/dates'
import { BalancesReportTab } from './BalancesReportTab'
import { ProductsReportTab } from './ProductsReportTab'
import { ProfitReportTab } from './ProfitReportTab'
import { SalesReportTab } from './SalesReportTab'

type TabId = 'sales' | 'profit' | 'products' | 'balances'
type Preset = 'today' | 'last7' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom'

const TABS = [
  { id: 'sales' as const, label: t.reports.tabSales },
  { id: 'profit' as const, label: t.reports.tabProfit },
  { id: 'products' as const, label: t.reports.tabProducts },
  { id: 'balances' as const, label: t.reports.tabBalances }
]

const CONTROL = 'type-body-sm h-11 rounded-sm border border-border-strong bg-bg px-3 text-ink'

function presetRange(preset: Exclude<Preset, 'custom'>): DayRange {
  switch (preset) {
    case 'today':
      return { from: today(), to: today() }
    case 'last7':
      return { from: daysAgo(6), to: today() }
    case 'thisMonth':
      return { from: monthRange(0).from, to: today() }
    case 'lastMonth':
      return monthRange(-1)
    case 'thisYear':
      return { from: yearStart(), to: today() }
  }
}

export function ReportsPage() {
  const [tab, setTab] = useState<TabId>('sales')
  const [preset, setPreset] = useState<Preset>('thisMonth')
  const [customRange, setCustomRange] = useState<DayRange>({ from: monthRange(0).from, to: today() })
  const [groupBy, setGroupBy] = useState<SalesGrouping>('day')
  // What the visible tab would export; null while it is loading.
  const [sheets, setSheets] = useState<ExportSheet[] | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null)

  const range = preset === 'custom' ? customRange : presetRange(preset)
  const usesRange = tab !== 'balances'
  const tabLabel = TABS.find((entry) => entry.id === tab)?.label ?? t.reports.title
  const fileName = usesRange
    ? `${t.reports.title} - ${tabLabel} ${range.from} ${range.to}`
    : `${t.reports.title} - ${tabLabel} ${today()}`

  const choosePreset = (next: Preset) => {
    setPreset(next)
    // A year of daily bars is unreadable; start it by month.
    if (next === 'thisYear') setGroupBy('month')
    else if (next !== 'custom') setGroupBy('day')
  }

  const onSheets = useCallback((next: ExportSheet[] | null) => setSheets(next), [])

  const runExport = async (kind: 'excel' | 'pdf') => {
    setExporting(kind)
    setNotice(null)
    setError(null)
    const result =
      kind === 'excel'
        ? await api('export:excel', { fileName, sheets: sheets ?? [] })
        : await api('export:pdf', { fileName })
    setExporting(null)
    if (!result.ok) setError(errorText(result))
    else if (result.data.saved && result.data.path) setNotice(t.reports.exported(result.data.path))
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="type-h2">
            {t.reports.title}
            <span className="hidden print:inline"> — {tabLabel}</span>
          </h2>
          <p className="type-body text-ink-muted">
            {usesRange
              ? t.reports.rangeLabel(formatDay(range.from), formatDay(range.to))
              : formatDay(today())}
          </p>
        </div>
        <div className="no-print flex gap-2">
          <Button
            variant="secondary"
            icon={<FileSpreadsheet aria-hidden className="size-4" />}
            loading={exporting === 'excel'}
            disabled={!sheets || exporting !== null}
            onClick={() => runExport('excel')}
          >
            {t.reports.exportExcel}
          </Button>
          <Button
            variant="secondary"
            icon={<FileText aria-hidden className="size-4" />}
            loading={exporting === 'pdf'}
            disabled={!sheets || exporting !== null}
            onClick={() => runExport('pdf')}
          >
            {t.reports.exportPdf}
          </Button>
        </div>
      </header>

      <div className="no-print space-y-4">
        <Tabs
          tabs={TABS}
          active={tab}
          onChange={(id) => {
            setTab(id)
            setSheets(null)
            setNotice(null)
          }}
        />

        {usesRange && (
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={preset}
              onChange={(event) => choosePreset(event.target.value as Preset)}
              aria-label={t.reports.period}
              className={CONTROL}
            >
              <option value="today">{t.reports.today}</option>
              <option value="last7">{t.reports.last7}</option>
              <option value="thisMonth">{t.reports.thisMonth}</option>
              <option value="lastMonth">{t.reports.lastMonth}</option>
              <option value="thisYear">{t.reports.thisYear}</option>
              <option value="custom">{t.reports.custom}</option>
            </select>

            {preset === 'custom' && (
              <>
                <input
                  type="date"
                  value={customRange.from}
                  max={customRange.to}
                  onChange={(event) =>
                    event.target.value &&
                    setCustomRange((current) => ({ ...current, from: event.target.value }))
                  }
                  aria-label={t.reports.from}
                  className={CONTROL}
                />
                <input
                  type="date"
                  value={customRange.to}
                  min={customRange.from}
                  onChange={(event) =>
                    event.target.value &&
                    setCustomRange((current) => ({ ...current, to: event.target.value }))
                  }
                  aria-label={t.reports.to}
                  className={CONTROL}
                />
              </>
            )}

            {tab === 'sales' && (
              <select
                value={groupBy}
                onChange={(event) => setGroupBy(event.target.value as SalesGrouping)}
                aria-label={t.reports.groupBy}
                className={CONTROL}
              >
                <option value="day">{t.reports.byDay}</option>
                <option value="week">{t.reports.byWeek}</option>
                <option value="month">{t.reports.byMonth}</option>
              </select>
            )}
          </div>
        )}

        {notice && <Alert tone="success">{notice}</Alert>}
        {error && <Alert>{error}</Alert>}
      </div>

      {tab === 'sales' && <SalesReportTab range={range} groupBy={groupBy} onSheets={onSheets} />}
      {tab === 'profit' && <ProfitReportTab range={range} onSheets={onSheets} />}
      {tab === 'products' && <ProductsReportTab range={range} onSheets={onSheets} />}
      {tab === 'balances' && <BalancesReportTab onSheets={onSheets} />}
    </div>
  )
}
