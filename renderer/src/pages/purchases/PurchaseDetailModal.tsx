import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { usePurchaseDetailModal } from '../../hooks/purchases/usePurchaseDetailModal'
import { t } from '../../i18n'
import { formatDateTime, formatQuantity } from '../../lib/format'
import { unitLabel } from '../../lib/units'
import { PAYMENT_TONE } from '../sales/SalesPage'

export function PurchaseDetailModal({ id, onClose }: { id: number; onClose: () => void }) {
  const { money, purchase, error } = usePurchaseDetailModal(id)

  return (
    <Modal
      title={purchase ? t.purchases.detailTitle(purchase.number) : t.purchases.title}
      size="lg"
      onClose={onClose}
    >
      {error && <Alert>{error}</Alert>}
      {!purchase && !error && (
        <p className="type-body-sm py-6 text-center text-ink-muted">{t.common.loading}</p>
      )}
      {purchase && (
        <div className="space-y-5">
          <div className="type-body-sm flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-ink-muted tabular-nums">{formatDateTime(purchase.createdAt)}</span>
            <span>
              <span className="text-ink-muted">{t.purchases.supplier}: </span>
              {purchase.supplierName ?? '—'}
            </span>
            <span>
              <span className="text-ink-muted">{t.purchases.recordedBy}: </span>
              {purchase.userName ?? '—'}
            </span>
            <Badge tone={PAYMENT_TONE[purchase.paymentStatus]}>
              {t.sales.paymentStatus[purchase.paymentStatus]}
            </Badge>
          </div>

          <div className="max-h-[45vh] overflow-y-auto rounded-md border border-border">
            <table className="type-body-sm w-full">
              <thead className="type-label border-b border-border bg-surface text-ink-muted">
                <tr>
                  <th className="px-4 py-2 text-start">{t.sales.item}</th>
                  <th className="px-4 py-2 text-end">{t.sales.quantity}</th>
                  <th className="px-4 py-2 text-end">{t.purchases.unitCost}</th>
                  <th className="px-4 py-2 text-end">{t.sales.lineTotal}</th>
                </tr>
              </thead>
              <tbody>
                {purchase.items.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">{item.productName}</td>
                    <td className="px-4 py-2 text-end tabular-nums">
                      {formatQuantity(item.quantity)} {unitLabel(item.unit)}
                    </td>
                    <td className="px-4 py-2 text-end tabular-nums">{money(item.unitCost)}</td>
                    <td className="px-4 py-2 text-end font-medium tabular-nums">
                      {money(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="type-body-sm ms-auto w-72 space-y-1">
            <div className="flex justify-between">
              <dt className="type-label-strong">{t.sales.total}</dt>
              <dd className="type-label-strong tabular-nums">{money(purchase.total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">{t.sales.paid}</dt>
              <dd className="tabular-nums">{money(purchase.paidAmount)}</dd>
            </div>
            {purchase.total > purchase.paidAmount && (
              <div className="flex justify-between">
                <dt className="text-ink-muted">{t.purchases.owed}</dt>
                <dd className="tabular-nums">{money(purchase.total - purchase.paidAmount)}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </Modal>
  )
}
