import { useEffect } from 'react'
import type { ExportSheet, SalesGrouping } from '../../../../shared/reports'
import { t } from '../../i18n'
import { api } from '../../lib/api'
import type { DayRange } from '../../lib/dates'
import { formatMoney } from '../../lib/format'
import { periodLabel } from '../../lib/periods'
import { useCurrency } from '../../store/settings'
import { useReport } from './useReport'

interface Options {
  range: DayRange
  groupBy: SalesGrouping
  onSheets: (sheets: ExportSheet[] | null) => void
}

export function useSalesReportTab({ range, groupBy, onSheets }: Options) {
  const currency = useCurrency()
  const money = (value: number) => formatMoney(value, currency)
  const { data, error } = useReport(
    () => api('reports:sales', { ...range, groupBy }),
    `${range.from}|${range.to}|${groupBy}`
  )

  useEffect(() => {
    if (!data) {
      onSheets(null)
      return
    }
    onSheets([
      {
        name: t.reports.tabSales,
        columns: [
          { header: t.reports.periodColumn, width: 24 },
          { header: t.reports.invoices, width: 14 },
          { header: t.reports.grossSales, money: true },
          { header: t.reports.returns, money: true },
          { header: t.reports.netSales, money: true }
        ],
        rows: [
          ...data.periods.map((period) => [
            periodLabel(period.period, data.groupBy),
            period.invoices,
            period.sales,
            period.returns,
            period.net
          ]),
          [t.reports.total, data.invoices, data.sales, data.returns, data.net]
        ]
      }
    ])
  }, [data, onSheets])

  return { money, data, error }
}
