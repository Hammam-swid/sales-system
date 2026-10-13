import { useEffect } from 'react'
import type { ExportSheet } from '../../../../shared/reports'
import { Alert } from '../../components/ui/Alert'
import { Card } from '../../components/ui/Card'
import { StatTile } from '../../components/ui/StatTile'
import { t } from '../../i18n'
import { api } from '../../lib/api'
import { cn } from '../../lib/cn'
import type { DayRange } from '../../lib/dates'
import { formatMoney } from '../../lib/format'
import { useCurrency } from '../../store/settings'
import { useReport } from './useReport'

interface ProfitReportTabProps {
  range: DayRange
  onSheets: (sheets: ExportSheet[] | null) => void
}

export function ProfitReportTab({ range, onSheets }: ProfitReportTabProps) {
  const currency = useCurrency()
  const money = (value: number) => formatMoney(value, currency)
  const { data, error } = useReport(() => api('reports:profit', range), `${range.from}|${range.to}`)

  useEffect(() => {
    if (!data) {
      onSheets(null)
      return
    }
    onSheets([
      {
        name: t.reports.profitStatement,
        columns: [{ header: t.parties.entry, width: 34 }, { header: t.parties.amount, money: true }],
        rows: [
          [t.reports.revenue, data.revenue],
          [t.reports.costOfGoods, -data.costOfGoods],
          [t.reports.grossProfit, data.grossProfit],
          [t.reports.expenses, -data.expenses],
          [t.reports.netProfit, data.netProfit],
          [t.reports.taxCollected, data.tax]
        ]
      },
      {
        name: t.reports.expensesByCategory,
        columns: [{ header: t.expenses.category, width: 28 }, { header: t.parties.amount, money: true }],
        rows: data.expensesByCategory.map((row) => [row.category, row.amount])
      }
    ])
  }, [data, onSheets])

  if (error) return <Alert>{error}</Alert>
  if (!data) return <p className="type-body-sm py-10 text-center text-ink-muted">{t.common.loading}</p>

  const isLoss = data.netProfit < 0
  const margin = data.revenue > 0 ? ((data.netProfit / data.revenue) * 100).toFixed(1) : null

  // A statement reads top to bottom: what came in, what it cost, what is left.
  const lines: { label: string; value: number; sign: '' | '−'; strong?: boolean }[] = [
    { label: t.reports.revenue, value: data.revenue, sign: '' },
    { label: t.reports.costOfGoods, value: data.costOfGoods, sign: '−' },
    { label: t.reports.grossProfit, value: data.grossProfit, sign: '', strong: true },
    { label: t.reports.expenses, value: data.expenses, sign: '−' }
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          emphasis
          // The label, not a color, says whether this is a profit or a loss.
          label={isLoss ? t.reports.netLoss : t.reports.netProfit}
          value={money(Math.abs(data.netProfit))}
          hint={margin !== null ? t.reports.margin(margin) : undefined}
        />
        <StatTile label={t.reports.revenue} value={money(data.revenue)} />
        <StatTile label={t.reports.costOfGoods} value={money(data.costOfGoods)} />
        <StatTile label={t.reports.expenses} value={money(data.expenses)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h3 className="type-h4 mb-4">{t.reports.profitStatement}</h3>
          <dl className="type-body-sm">
            {lines.map((line) => (
              <div
                key={line.label}
                className={cn(
                  'flex justify-between border-b border-border py-2',
                  line.strong && 'type-label-strong'
                )}
              >
                <dt className={line.strong ? undefined : 'text-ink-muted'}>{line.label}</dt>
                <dd dir="ltr" className="tabular-nums">
                  {line.sign}
                  {money(line.value)}
                </dd>
              </div>
            ))}
            <div className="type-h4 flex justify-between py-3">
              <dt>{isLoss ? t.reports.netLoss : t.reports.netProfit}</dt>
              <dd dir="ltr" className="tabular-nums">
                {isLoss ? '−' : ''}
                {money(Math.abs(data.netProfit))}
              </dd>
            </div>
            {data.tax > 0 && (
              <div className="flex justify-between text-ink-muted">
                <dt>{t.reports.taxCollected}</dt>
                <dd className="tabular-nums">{money(data.tax)}</dd>
              </div>
            )}
          </dl>
        </Card>

        <Card className="p-6">
          <h3 className="type-h4 mb-4">{t.reports.expensesByCategory}</h3>
          {data.expensesByCategory.length === 0 ? (
            <p className="type-body-sm py-8 text-center text-ink-muted">{t.reports.noExpenses}</p>
          ) : (
            <ul className="type-body-sm space-y-3">
              {data.expensesByCategory.map((row) => (
                <li key={row.category} className="space-y-1">
                  <div className="flex justify-between">
                    <span>{row.category}</span>
                    <span className="tabular-nums">{money(row.amount)}</span>
                  </div>
                  {/* Share of total expenses. */}
                  <div className="h-2 rounded-pill bg-border">
                    <div
                      className="h-2 rounded-pill bg-blue-500"
                      style={{ width: `${(row.amount / data.expenses) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  )
}
