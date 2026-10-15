import type { HeldSaleDto } from '../../../../shared/sales'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useHeldSalesModal } from '../../hooks/pos/useHeldSalesModal'
import { t } from '../../i18n'
import { formatDateTime, formatMoney } from '../../lib/format'

interface HeldSalesModalProps {
  cartHasItems: boolean
  onResumed: (held: HeldSaleDto) => void
  onClose: () => void
}

export function HeldSalesModal({ cartHasItems, onResumed, onClose }: HeldSalesModalProps) {
  const { currency, held, error, resume, discard } = useHeldSalesModal({ onResumed, onClose })

  return (
    <Modal title={t.pos.heldSales} size="lg" onClose={onClose}>
      <div className="space-y-4">
        {error && <Alert>{error}</Alert>}
        {cartHasItems && held && held.length > 0 && (
          <p className="type-caption w-fit rounded-sm bg-warning-tint px-2 text-warning">
            {t.pos.resumeReplaces}
          </p>
        )}
        {held === null && !error && (
          <p className="type-body-sm py-6 text-center text-ink-muted">{t.common.loading}</p>
        )}
        {held?.length === 0 && (
          <p className="type-body-sm py-6 text-center text-ink-muted">{t.pos.noHeld}</p>
        )}
        <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
          {held?.map((sale) => (
            <li
              key={sale.id}
              className="flex items-center justify-between gap-4 rounded-md border border-border bg-surface px-4 py-3"
            >
              <div className="min-w-0">
                <p className="type-label text-ink">
                  {sale.customerName ?? t.sales.walkIn} · {t.pos.items(sale.items.length)}
                </p>
                <p className="type-caption text-ink-muted tabular-nums">
                  {formatDateTime(sale.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="type-label-strong tabular-nums">
                  {formatMoney(sale.total, currency)}
                </span>
                <Button size="sm" onClick={() => resume(sale.id)}>
                  {t.pos.resume}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => discard(sale.id)}>
                  {t.pos.discard}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  )
}
