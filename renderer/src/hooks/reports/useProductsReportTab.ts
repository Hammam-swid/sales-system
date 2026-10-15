import { useEffect } from 'react'
import type { ExportSheet } from '../../../../shared/reports'
import { t } from '../../i18n'
import { api } from '../../lib/api'
import type { DayRange } from '../../lib/dates'
import { formatDate, formatMoney } from '../../lib/format'
import { unitLabel } from '../../lib/units'
import { useCurrency } from '../../store/settings'
import { useReport } from './useReport'

interface Options {
  range: DayRange
  onSheets: (sheets: ExportSheet[] | null) => void
}

export function useProductsReportTab({ range, onSheets }: Options) {
  const currency = useCurrency()
  const money = (value: number) => formatMoney(value, currency)
  const { data, error } = useReport(() => api('reports:products', range), `${range.from}|${range.to}`)

  useEffect(() => {
    if (!data) {
      onSheets(null)
      return
    }
    onSheets([
      {
        name: t.reports.bestSellers,
        columns: [
          { header: t.reports.product, width: 32 },
          { header: t.reports.soldQuantity },
          { header: t.products.unit, width: 12 },
          { header: t.reports.revenue, money: true },
          { header: t.reports.profit, money: true }
        ],
        rows: data.bestSellers.map((row) => [
          row.name,
          row.quantity,
          unitLabel(row.unit),
          row.revenue,
          row.profit
        ])
      },
      {
        name: t.reports.slowMoving,
        columns: [
          { header: t.reports.product, width: 32 },
          { header: t.reports.stock },
          { header: t.products.unit, width: 12 },
          { header: t.reports.stockValue, money: true },
          { header: t.reports.soldQuantity },
          { header: t.reports.lastSold, width: 20 }
        ],
        rows: data.slowMoving.map((row) => [
          row.name,
          row.stock,
          unitLabel(row.unit),
          row.stockValue,
          row.soldInPeriod,
          row.lastSoldAt ? formatDate(row.lastSoldAt) : t.reports.neverSold
        ])
      },
      {
        name: t.reports.inventoryValue,
        columns: [{ header: t.parties.entry, width: 30 }, { header: t.parties.amount, money: true }],
        rows: [
          [t.reports.inventoryCost, data.inventory.costValue],
          [t.reports.inventoryRetail, data.inventory.retailValue],
          [t.reports.inventoryCount, data.inventory.productCount],
          [t.reports.lowStock, data.inventory.lowStockCount]
        ]
      }
    ])
  }, [data, onSheets])

  return { money, data, error }
}
