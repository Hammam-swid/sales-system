import { Eye, Plus, Search } from 'lucide-react'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { IconButton } from '../../components/ui/IconButton'
import { usePurchasesPage } from '../../hooks/purchases/usePurchasesPage'
import { t } from '../../i18n'
import { formatDateTime, formatMoney } from '../../lib/format'
import { PAYMENT_TONE } from '../sales/SalesPage'
import { PurchaseDetailModal } from './PurchaseDetailModal'
import { PurchaseFormModal } from './PurchaseFormModal'

export function PurchasesPage() {
  const {
    currency,
    searchInput,
    setSearchInput,
    data,
    error,
    notice,
    total,
    page,
    pageCount,
    paged,
    rangeFrom,
    rangeTo,
    previousPage,
    nextPage,
    creating,
    startCreating,
    stopCreating,
    saved,
    openId,
    openPurchase,
    closePurchase
  } = usePurchasesPage()

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <h2 className="type-h2">{t.purchases.title}</h2>
        <p className="type-body text-ink-muted">{t.purchases.subtitle}</p>
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
            placeholder={t.purchases.searchPlaceholder}
            aria-label={t.purchases.searchPlaceholder}
            className="type-body-sm h-11 w-full rounded-sm border border-border-strong bg-bg ps-10 pe-3 text-ink placeholder:text-ink-muted"
          />
        </div>
        <Button icon={<Plus aria-hidden className="size-4" />} onClick={startCreating}>
          {t.purchases.add}
        </Button>
      </div>

      {notice && <Alert tone="success">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}

      <Card className="overflow-x-auto">
        <table className="type-body-sm w-full">
          <thead className="type-label border-b border-border text-ink-muted">
            <tr>
              <th className="px-4 py-3 text-start">{t.purchases.number}</th>
              <th className="px-4 py-3 text-start">{t.sales.date}</th>
              <th className="px-4 py-3 text-start">{t.purchases.supplier}</th>
              <th className="px-4 py-3 text-end">{t.sales.total}</th>
              <th className="px-4 py-3 text-end">{t.sales.paid}</th>
              <th className="px-4 py-3 text-start">{t.sales.payment}</th>
              <th className="px-4 py-3 text-end">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody>
            {data === null && !error && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-muted">
                  {t.common.loading}
                </td>
              </tr>
            )}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-muted">
                  {t.purchases.empty}
                </td>
              </tr>
            )}
            {data?.items.map((purchase) => (
              <tr key={purchase.id} className="border-b border-border last:border-0">
                <td dir="ltr" className="type-label px-4 py-3 text-end text-ink tabular-nums">
                  {purchase.number}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-ink-muted tabular-nums">
                  {formatDateTime(purchase.createdAt)}
                </td>
                <td className="px-4 py-3">{purchase.supplierName ?? '—'}</td>
                <td className="px-4 py-3 text-end font-medium tabular-nums">
                  {formatMoney(purchase.total, currency)}
                </td>
                <td className="px-4 py-3 text-end tabular-nums">
                  {formatMoney(purchase.paidAmount, currency)}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={PAYMENT_TONE[purchase.paymentStatus]}>
                    {t.sales.paymentStatus[purchase.paymentStatus]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <IconButton
                      icon={Eye}
                      label={t.purchases.view}
                      onClick={() => openPurchase(purchase.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {paged && (
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

      {creating && (
        <PurchaseFormModal
          onClose={stopCreating}
          onSaved={saved}
        />
      )}
      {openId !== null && <PurchaseDetailModal id={openId} onClose={closePurchase} />}
    </div>
  )
}
