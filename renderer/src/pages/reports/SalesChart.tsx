import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps
} from 'recharts'
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent'
import type { SalesGrouping, SalesPeriod } from '../../../../shared/reports'
import { t } from '../../i18n/ar'
import { formatDay, formatMonth, formatShortDay } from '../../lib/dates'
import { formatMoney } from '../../lib/format'
import { useCurrency } from '../../store/settings'

// One series, so one color: the brand blue, which passes contrast on both the light
// and dark chart surfaces. Text and axes stay in ink tokens.
const BAR_COLOR = 'var(--color-blue-500)'

export function periodLabel(period: string, groupBy: SalesGrouping): string {
  if (groupBy === 'month') return formatMonth(period)
  if (groupBy === 'week') return t.reports.weekOf(formatDay(period))
  return formatDay(period)
}

function axisLabel(period: string, groupBy: SalesGrouping): string {
  return groupBy === 'month' ? formatMonth(period) : formatShortDay(period)
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 })

interface SalesChartProps {
  periods: SalesPeriod[]
  groupBy: SalesGrouping
}

// Net sales per period. Time runs right to left, matching the page direction.
export function SalesChart({ periods, groupBy }: SalesChartProps) {
  const currency = useCurrency()

  const renderTooltip = ({ active, payload }: TooltipContentProps<ValueType, NameType>) => {
    const point = active ? (payload[0]?.payload as SalesPeriod | undefined) : undefined
    if (!point) return null
    return (
      // The chart itself is laid out left-to-right; its text is still Arabic.
      <div
        dir="rtl"
        className="type-body-sm rounded-md border border-border bg-bg px-3 py-2 text-ink shadow-md"
      >
        <p className="type-label">{periodLabel(point.period, groupBy)}</p>
        <p className="tabular-nums">
          {t.reports.netSales}: {formatMoney(point.net, currency)}
        </p>
        <p className="text-ink-muted tabular-nums">
          {t.reports.invoices}: {point.invoices}
          {point.returns > 0 && ` · ${t.reports.returns}: ${formatMoney(point.returns, currency)}`}
        </p>
      </div>
    )
  }

  return (
    // chart-box is a hook for the print stylesheet.
    <div dir="ltr" className="chart-box h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={periods} margin={{ top: 8, right: 0, bottom: 0, left: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="period"
            reversed
            tickFormatter={(period: string) => axisLabel(period, groupBy)}
            tick={{ fill: 'var(--ink-muted)', fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: 'var(--border-strong)' }}
            minTickGap={24}
          />
          <YAxis
            orientation="right"
            tickFormatter={(value: number) => compact.format(value)}
            tick={{ fill: 'var(--ink-muted)', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={48}
          />
          <Tooltip content={renderTooltip} cursor={{ fill: 'var(--border)', opacity: 0.5 }} />
          <Bar
            dataKey="net"
            name={t.reports.netSales}
            fill={BAR_COLOR}
            radius={[4, 4, 0, 0]}
            maxBarSize={32}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
