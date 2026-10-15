import { useEffect } from 'react'
import type { ExportSheet } from '../../../../shared/reports'
import { t } from '../../i18n'
import { api } from '../../lib/api'
import type { DayRange } from '../../lib/dates'
import { formatMoney } from '../../lib/format'
import { useCurrency } from '../../store/settings'
import { useReport } from './useReport'

interface Options {
  range: DayRange
  onSheets: (sheets: ExportSheet[] | null) => void
}

export function useProfitReportTab({ range, onSheets }: Options) {
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

  return { money, data, error }
}
