import { useEffect } from 'react'
import type { ExportSheet } from '../../../../shared/reports'
import { Alert } from '../../components/ui/Alert'
import { Card } from '../../components/ui/Card'
import { StatTile } from '../../components/ui/StatTile'
import { t } from '../../i18n/ar'
import { api } from '../../lib/api'
import type { DayRange } from '../../lib/dates'
import { formatDate, formatMoney, formatQuantity } from '../../lib/format'
import { useCurrency } from '../../store/settings'
import { unitLabel } from '../products/ProductsTab'
import { useReport } from './useReport'

interface ProductsReportTabProps {
  range: DayRange
  onSheets: (sheets: ExportSheet[] | null) => void
}

export function ProductsReportTab({ range, onSheets }: ProductsReportTabProps) {
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

  if (error) return <Alert>{error}</Alert>
  if (!data) return <p className="type-body-sm py-10 text-center text-ink-muted">{t.common.loading}</p>

  const topQuantity = Math.max(...data.bestSellers.map((row) => row.quantity), 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile
          emphasis
          label={`${t.reports.inventoryValue} (${t.reports.inventoryCost})`}
          value={money(data.inventory.costValue)}
        />
        <StatTile label={t.reports.inventoryRetail} value={money(data.inventory.retailValue)} />
        <StatTile label={t.reports.inventoryCount} value={data.inventory.productCount} />
        <StatTile label={t.reports.lowStock} value={data.inventory.lowStockCount} />
      </div>

      <Card className="overflow-x-auto">
        <h3 className="type-h4 px-6 pt-5 pb-3">{t.reports.bestSellers}</h3>
        {data.bestSellers.length === 0 ? (
          <p className="type-body-sm px-6 pb-8 text-center text-ink-muted">
            {t.reports.noProductSales}
          </p>
        ) : (
          <table className="type-body-sm w-full">
            <thead className="type-label border-y border-border text-ink-muted">
              <tr>
                <th className="w-10 px-6 py-3 text-start">#</th>
                <th className="px-6 py-3 text-start">{t.reports.product}</th>
                <th className="w-[34%] px-6 py-3 text-start">{t.reports.soldQuantity}</th>
                <th className="px-6 py-3 text-end">{t.reports.revenue}</th>
                <th className="px-6 py-3 text-end">{t.reports.profit}</th>
              </tr>
            </thead>
            <tbody>
              {data.bestSellers.map((row, index) => (
                <tr key={row.productId} className="border-b border-border last:border-0">
                  <td className="px-6 py-2 text-ink-muted tabular-nums">{index + 1}</td>
                  <td className="type-label px-6 py-2 text-ink">{row.name}</td>
                  <td className="px-6 py-2">
                    {/* The bar ranks; the number beside it is the value. */}
                    <div className="flex items-center gap-3">
                      <div className="h-2 flex-1 rounded-pill bg-border">
                        <div
                          className="h-2 rounded-pill bg-blue-500"
                          style={{ width: `${topQuantity > 0 ? (row.quantity / topQuantity) * 100 : 0}%` }}
                        />
                      </div>
                      <span className="w-24 shrink-0 tabular-nums">
                        {formatQuantity(row.quantity)} {unitLabel(row.unit)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-2 text-end tabular-nums">{money(row.revenue)}</td>
                  <td className="px-6 py-2 text-end font-medium tabular-nums">
                    {money(row.profit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="overflow-x-auto">
        <div className="px-6 pt-5 pb-3">
          <h3 className="type-h4">{t.reports.slowMoving}</h3>
          <p className="type-caption text-ink-muted">{t.reports.slowMovingHint}</p>
        </div>
        <table className="type-body-sm w-full">
          <thead className="type-label border-y border-border text-ink-muted">
            <tr>
              <th className="px-6 py-3 text-start">{t.reports.product}</th>
              <th className="px-6 py-3 text-end">{t.reports.stock}</th>
              <th className="px-6 py-3 text-end">{t.reports.stockValue}</th>
              <th className="px-6 py-3 text-end">{t.reports.soldQuantity}</th>
              <th className="px-6 py-3 text-start">{t.reports.lastSold}</th>
            </tr>
          </thead>
          <tbody>
            {data.slowMoving.map((row) => (
              <tr key={row.productId} className="border-b border-border last:border-0">
                <td className="type-label px-6 py-2 text-ink">{row.name}</td>
                <td className="px-6 py-2 text-end tabular-nums">
                  {formatQuantity(row.stock)} {unitLabel(row.unit)}
                </td>
                <td className="px-6 py-2 text-end tabular-nums">{money(row.stockValue)}</td>
                <td className="px-6 py-2 text-end tabular-nums">
                  {formatQuantity(row.soldInPeriod)}
                </td>
                <td className="px-6 py-2 text-ink-muted tabular-nums">
                  {row.lastSoldAt ? formatDate(row.lastSoldAt) : t.reports.neverSold}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
