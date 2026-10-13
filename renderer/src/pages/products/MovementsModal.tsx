import { useEffect, useState } from 'react'
import type { ProductDto, StockMovementDto, StockMovementType } from '../../../../shared/catalog'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { t } from '../../i18n'
import { api, errorText } from '../../lib/api'
import { formatDateTime, formatQuantity } from '../../lib/format'

const TYPE_LABEL: Record<StockMovementType, string> = {
  in: t.stock.typeIn,
  out: t.stock.typeOut,
  adjustment: t.stock.typeAdjustment
}

const TYPE_TONE = { in: 'success', out: 'danger', adjustment: 'brand' } as const

// Signed change to the stock level, with an explicit sign so it never relies on color alone.
function signedQuantity(movement: StockMovementDto): string {
  const delta = movement.type === 'out' ? -movement.quantity : movement.quantity
  return `${delta > 0 ? '+' : delta < 0 ? '−' : ''}${formatQuantity(Math.abs(delta))}`
}

export function MovementsModal({ product, onClose }: { product: ProductDto; onClose: () => void }) {
  const [movements, setMovements] = useState<StockMovementDto[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void api('products:movements', { productId: product.id }).then((result) => {
      if (result.ok) setMovements(result.data)
      else setError(errorText(result))
    })
  }, [product.id])

  return (
    <Modal title={t.stock.historyFor(product.name)} size="lg" onClose={onClose}>
      {error && <Alert>{error}</Alert>}
      {movements === null && !error && (
        <p className="type-body-sm py-6 text-center text-ink-muted">{t.common.loading}</p>
      )}
      {movements?.length === 0 && (
        <p className="type-body-sm py-6 text-center text-ink-muted">{t.stock.noMovements}</p>
      )}
      {movements && movements.length > 0 && (
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="type-body-sm w-full">
            <thead className="type-label border-b border-border text-ink-muted">
              <tr>
                <th className="py-2 pe-4 text-start">{t.stock.date}</th>
                <th className="px-4 py-2 text-start">{t.stock.type}</th>
                <th className="px-4 py-2 text-end">{t.products.quantity}</th>
                <th className="px-4 py-2 text-start">{t.stock.reason}</th>
                <th className="py-2 ps-4 text-start">{t.stock.by}</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((movement) => (
                <tr key={movement.id} className="border-b border-border last:border-0">
                  <td className="py-2 pe-4 whitespace-nowrap text-ink-muted tabular-nums">
                    {formatDateTime(movement.createdAt)}
                  </td>
                  <td className="px-4 py-2">
                    <Badge tone={TYPE_TONE[movement.type]}>{TYPE_LABEL[movement.type]}</Badge>
                  </td>
                  <td dir="ltr" className="px-4 py-2 text-start font-medium tabular-nums">
                    {signedQuantity(movement)}
                  </td>
                  <td className="px-4 py-2">{movement.reason ?? '—'}</td>
                  <td className="py-2 ps-4 text-ink-muted">{movement.userName ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  )
}
