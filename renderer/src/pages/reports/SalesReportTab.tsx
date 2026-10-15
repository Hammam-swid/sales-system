import type { ExportSheet, SalesGrouping } from '../../../../shared/reports'
import { Alert } from '../../components/ui/Alert'
import { Card } from '../../components/ui/Card'
import { StatTile } from '../../components/ui/StatTile'
import { useSalesReportTab } from '../../hooks/reports/useSalesReportTab'
import { t } from '../../i18n'
import type { DayRange } from '../../lib/dates'
import { periodLabel } from '../../lib/periods'
import { SalesChart } from './SalesChart'

interface SalesReportTabProps {
  range: DayRange
  groupBy: SalesGrouping
  onSheets: (sheets: ExportSheet[] | null) => void
}

export function SalesReportTab({ range, groupBy, onSheets }: SalesReportTabProps) {
  const { money, data, error } = useSalesReportTab({ range, groupBy, onSheets })

  if (error) return <Alert>{error}</Alert>
  if (!data) return <p className="type-body-sm py-10 text-center text-ink-muted">{t.common.loading}</p>

  // The table lists only periods that had activity; the chart keeps the empty ones for scale.
  const activePeriods = data.periods.filter((period) => period.invoices > 0).reverse()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          emphasis
          label={t.reports.netSales}
          value={money(data.net)}
          hint={
            data.returns > 0 ? `${t.reports.returns}: ${money(data.returns)}` : t.reports.grossSales
          }
        />
        <StatTile label={t.reports.invoices} value={data.invoices} />
        <StatTile
          label={t.reports.averageInvoice}
          value={money(data.invoices > 0 ? data.sales / data.invoices : 0)}
        />
        <StatTile
          label={t.reports.collected}
          value={money(data.collected)}
          hint={`${t.reports.credit}: ${money(data.credit)}`}
        />
      </div>

      <Card className="p-6">
        <h3 className="type-h4 mb-4">{t.reports.salesChartTitle}</h3>
        {data.invoices === 0 ? (
          <p className="type-body-sm py-16 text-center text-ink-muted">{t.reports.noSales}</p>
        ) : (
          // data.groupBy, not the selected grouping: right after the selector changes,
          // the periods on screen are still the previous grouping's until the new ones load.
          <SalesChart periods={data.periods} groupBy={data.groupBy} />
        )}
      </Card>

      {activePeriods.length > 0 && (
        <Card className="overflow-x-auto">
          <table className="type-body-sm w-full">
            <thead className="type-label border-b border-border text-ink-muted">
              <tr>
                <th className="px-6 py-3 text-start">{t.reports.periodColumn}</th>
                <th className="px-6 py-3 text-end">{t.reports.invoices}</th>
                <th className="px-6 py-3 text-end">{t.reports.grossSales}</th>
                <th className="px-6 py-3 text-end">{t.reports.returns}</th>
                <th className="px-6 py-3 text-end">{t.reports.netSales}</th>
              </tr>
            </thead>
            <tbody>
              {activePeriods.map((period) => (
                <tr key={period.period} className="border-b border-border">
                  <td className="px-6 py-2">{periodLabel(period.period, data.groupBy)}</td>
                  <td className="px-6 py-2 text-end tabular-nums">{period.invoices}</td>
                  <td className="px-6 py-2 text-end tabular-nums">{money(period.sales)}</td>
                  <td className="px-6 py-2 text-end tabular-nums">
                    {period.returns > 0 ? money(period.returns) : '—'}
                  </td>
                  <td className="px-6 py-2 text-end font-medium tabular-nums">
                    {money(period.net)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="type-label-strong">
                <td className="px-6 py-3">{t.reports.total}</td>
                <td className="px-6 py-3 text-end tabular-nums">{data.invoices}</td>
                <td className="px-6 py-3 text-end tabular-nums">{money(data.sales)}</td>
                <td className="px-6 py-3 text-end tabular-nums">{money(data.returns)}</td>
                <td className="px-6 py-3 text-end tabular-nums">{money(data.net)}</td>
              </tr>
            </tfoot>
          </table>
        </Card>
      )}

      <p className="type-caption text-ink-muted">{t.reports.returnsNote}</p>
    </div>
  )
}
