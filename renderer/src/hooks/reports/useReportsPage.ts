import { useCallback, useState } from 'react'
import type { ExportSheet, SalesGrouping } from '../../../../shared/reports'
import { t } from '../../i18n'
import { api, errorText } from '../../lib/api'
import { daysAgo, monthRange, today, yearStart, type DayRange } from '../../lib/dates'

export type ReportsTabId = 'sales' | 'profit' | 'products' | 'balances'
export type ReportPreset = 'today' | 'last7' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom'

export const REPORT_TABS = [
  { id: 'sales' as const, label: t.reports.tabSales },
  { id: 'profit' as const, label: t.reports.tabProfit },
  { id: 'products' as const, label: t.reports.tabProducts },
  { id: 'balances' as const, label: t.reports.tabBalances }
]

function presetRange(preset: Exclude<ReportPreset, 'custom'>): DayRange {
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

export function useReportsPage() {
  const [tab, setTab] = useState<ReportsTabId>('sales')
  const [preset, setPreset] = useState<ReportPreset>('thisMonth')
  const [customRange, setCustomRange] = useState<DayRange>({ from: monthRange(0).from, to: today() })
  const [groupBy, setGroupBy] = useState<SalesGrouping>('day')
  // What the visible tab would export; null while it is loading.
  const [sheets, setSheets] = useState<ExportSheet[] | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null)

  const range = preset === 'custom' ? customRange : presetRange(preset)
  const usesRange = tab !== 'balances'
  const tabLabel = REPORT_TABS.find((entry) => entry.id === tab)?.label ?? t.reports.title
  const fileName = usesRange
    ? `${t.reports.title} - ${tabLabel} ${range.from} ${range.to}`
    : `${t.reports.title} - ${tabLabel} ${today()}`

  const choosePreset = (next: ReportPreset) => {
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

  const changeTab = (id: ReportsTabId) => {
    setTab(id)
    setSheets(null)
    setNotice(null)
  }

  // An emptied date input keeps the previous day.
  const setCustomFrom = (from: string) => {
    if (from) setCustomRange((current) => ({ ...current, from }))
  }
  const setCustomTo = (to: string) => {
    if (to) setCustomRange((current) => ({ ...current, to }))
  }

  return {
    tab,
    changeTab,
    preset,
    choosePreset,
    customRange,
    setCustomFrom,
    setCustomTo,
    groupBy,
    setGroupBy,
    range,
    usesRange,
    tabLabel,
    sheets,
    onSheets,
    notice,
    error,
    exporting,
    runExport
  }
}
