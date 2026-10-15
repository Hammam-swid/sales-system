import { FileSpreadsheet, FileText } from 'lucide-react'
import type { SalesGrouping } from '../../../../shared/reports'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Tabs } from '../../components/ui/Tabs'
import {
  REPORT_TABS,
  useReportsPage,
  type ReportPreset
} from '../../hooks/reports/useReportsPage'
import { t } from '../../i18n'
import { formatDay, today } from '../../lib/dates'
import { BalancesReportTab } from './BalancesReportTab'
import { ProductsReportTab } from './ProductsReportTab'
import { ProfitReportTab } from './ProfitReportTab'
import { SalesReportTab } from './SalesReportTab'

const CONTROL = 'type-body-sm h-11 rounded-sm border border-border-strong bg-bg px-3 text-ink'

export function ReportsPage() {
  const {
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
  } = useReportsPage()

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
          tabs={REPORT_TABS}
          active={tab}
          onChange={changeTab}
        />

        {usesRange && (
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={preset}
              onChange={(event) => choosePreset(event.target.value as ReportPreset)}
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
                  onChange={(event) => setCustomFrom(event.target.value)}
                  aria-label={t.reports.from}
                  className={CONTROL}
                />
                <input
                  type="date"
                  value={customRange.to}
                  min={customRange.from}
                  onChange={(event) => setCustomTo(event.target.value)}
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
