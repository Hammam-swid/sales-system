import type { SalesGrouping } from '../../../shared/reports'
import { t } from '../i18n'
import { formatDay, formatMonth } from './dates'

// How a report period reads on screen and in exports: a day, a week or a month.
export function periodLabel(period: string, groupBy: SalesGrouping): string {
  if (groupBy === 'month') return formatMonth(period)
  if (groupBy === 'week') return t.reports.weekOf(formatDay(period))
  return formatDay(period)
}
