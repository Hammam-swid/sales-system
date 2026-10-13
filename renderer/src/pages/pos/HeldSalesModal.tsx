import { useCallback, useEffect, useState } from 'react'
import type { HeldSaleDto } from '../../../../shared/sales'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { t } from '../../i18n'
import { api, errorText } from '../../lib/api'
import { formatDateTime, formatMoney } from '../../lib/format'
import { useCurrency } from '../../store/settings'

interface HeldSalesModalProps {
  cartHasItems: boolean
  onResumed: (held: HeldSaleDto) => void
  onClose: () => void
}

export function HeldSalesModal({ cartHasItems, onResumed, onClose }: HeldSalesModalProps) {
  const currency = useCurrency()
  const [held, setHeld] = useState<HeldSaleDto[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const result = await api('sales:held')
    if (result.ok) setHeld(result.data)
    else setError(errorText(result))
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const resume = async (id: number) => {
    const result = await api('sales:resumeHeld', { id })
    if (!result.ok) {
      setError(errorText(result))
      return
    }
    onResumed(result.data)
    onClose()
  }

  const discard = async (id: number) => {
    const result = await api('sales:discardHeld', { id })
    if (result.ok) void load()
    else setError(errorText(result))
  }

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
