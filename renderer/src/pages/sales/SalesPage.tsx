import { Eye, Search } from 'lucide-react'
import type {
  PaymentStatus,
  SaleStatus,
  SaleStatusFilter
} from '../../../../shared/sales'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { IconButton } from '../../components/ui/IconButton'
import { useSalesPage } from '../../hooks/sales/useSalesPage'
import { t } from '../../i18n'
import { cn } from '../../lib/cn'
import { formatDateTime, formatMoney } from '../../lib/format'
import { SaleDetailModal } from './SaleDetailModal'

const CONTROL =
  'type-body-sm h-11 rounded-sm border border-border-strong bg-bg px-3 text-ink placeholder:text-ink-muted'

export const PAYMENT_TONE: Record<PaymentStatus, 'success' | 'warning' | 'danger'> = {
  paid: 'success',
  partial: 'warning',
  unpaid: 'danger'
}

export const STATUS_TONE: Record<SaleStatus, 'neutral' | 'brand' | 'warning' | 'danger'> = {
  completed: 'brand',
  held: 'neutral',
  partially_returned: 'warning',
  returned: 'danger'
}

export function SalesPage() {
  const {
    currency,
    searchInput,
    setSearchInput,
    status,
    changeStatus,
    data,
    error,
    total,
    page,
    pageCount,
    rangeFrom,
    rangeTo,
    previousPage,
    nextPage,
    openId,
    openSale,
    closeSale,
    reload
  } = useSalesPage()

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <h2 className="type-h2">{t.sales.title}</h2>
        <p className="type-body text-ink-muted">{t.sales.subtitle}</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t.sales.searchPlaceholder}
            aria-label={t.sales.searchPlaceholder}
            className={cn(CONTROL, 'w-full ps-10')}
            autoFocus
          />
        </div>
        <select
          value={status}
          onChange={(event) => changeStatus(event.target.value as SaleStatusFilter)}
          aria-label={t.sales.status}
          className={CONTROL}
        >
          <option value="all">{t.sales.statusAll}</option>
          <option value="completed">{t.sales.statusCompleted}</option>
          <option value="returned">{t.sales.statusReturned}</option>
        </select>
      </div>

      {error && <Alert>{error}</Alert>}

      <Card className="overflow-x-auto">
        <table className="type-body-sm w-full">
          <thead className="type-label border-b border-border text-ink-muted">
            <tr>
              <th className="px-4 py-3 text-start">{t.sales.number}</th>
              <th className="px-4 py-3 text-start">{t.sales.date}</th>
              <th className="px-4 py-3 text-start">{t.sales.customer}</th>
              <th className="px-4 py-3 text-start">{t.sales.cashier}</th>
              <th className="px-4 py-3 text-end">{t.sales.total}</th>
              <th className="px-4 py-3 text-start">{t.sales.payment}</th>
              <th className="px-4 py-3 text-start">{t.sales.status}</th>
              <th className="px-4 py-3 text-end">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody>
            {data === null && !error && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-ink-muted">
                  {t.common.loading}
                </td>
              </tr>
            )}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-ink-muted">
                  {t.sales.empty}
                </td>
              </tr>
            )}
            {data?.items.map((sale) => (
              <tr key={sale.id} className="border-b border-border last:border-0">
                <td dir="ltr" className="type-label px-4 py-3 text-end text-ink tabular-nums">
                  {sale.invoiceNumber}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-ink-muted tabular-nums">
                  {formatDateTime(sale.createdAt)}
                </td>
                <td className="px-4 py-3">{sale.customerName ?? t.sales.walkIn}</td>
                <td className="px-4 py-3 text-ink-muted">{sale.userName ?? '—'}</td>
                <td className="px-4 py-3 text-end font-medium tabular-nums">
                  {formatMoney(sale.total, currency)}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={PAYMENT_TONE[sale.paymentStatus]}>
                    {t.sales.paymentStatus[sale.paymentStatus]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={STATUS_TONE[sale.status]}>{t.sales.saleStatus[sale.status]}</Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <IconButton icon={Eye} label={t.sales.view} onClick={() => openSale(sale.id)} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="type-body-sm text-ink-muted tabular-nums">
            {t.products.pageInfo(rangeFrom, rangeTo, total)}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={previousPage}
            >
              {t.products.previous}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= pageCount}
              onClick={nextPage}
            >
              {t.products.next}
            </Button>
          </div>
        </div>
      )}

      {openId !== null && (
        <SaleDetailModal
          saleId={openId}
          onChanged={reload}
          onClose={closeSale}
        />
      )}
    </div>
  )
}
