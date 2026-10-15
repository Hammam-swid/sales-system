import type { ReturnSaleResponse, SaleDto } from '../../../../shared/sales'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useReturnForm } from '../../hooks/sales/useReturnForm'
import { t } from '../../i18n'
import { formatMoney, formatQuantity } from '../../lib/format'

interface ReturnFormProps {
  sale: SaleDto
  onCancel: () => void
  onClose: () => void
  onDone: (result: ReturnSaleResponse) => void
}


export function ReturnForm({ sale, onCancel, onClose, onDone }: ReturnFormProps) {
  const {
    currency,
    returnable,
    quantities,
    returnAll,
    setQuantity,
    exceeds,
    chosen,
    invalid,
    preview,
    error,
    saving,
    submit
  } = useReturnForm({ sale, onDone })

  return (
    <Modal title={t.sales.returnTitle(sale.invoiceNumber)} size="lg" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}

        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={returnAll}
          >
            {t.sales.returnAll}
          </Button>
        </div>

        <ul className="max-h-[45vh] space-y-2 overflow-y-auto">
          {returnable.map(({ item, max }) => {
            return (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 rounded-md border border-border bg-surface px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="type-label text-ink">{item.productName}</p>
                  <p className="type-caption text-ink-muted tabular-nums">
                    {t.sales.returnable(formatQuantity(max))}
                  </p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={max}
                  step="any"
                  dir="ltr"
                  placeholder="0"
                  value={quantities[item.id] ?? ''}
                  onChange={(event) => setQuantity(item.id, event.target.value)}
                  aria-label={`${t.sales.returnQuantity}: ${item.productName}`}
                  aria-invalid={exceeds(item.id, max) ? true : undefined}
                  className="type-body-sm h-10 w-24 rounded-sm border border-border-strong bg-bg px-2 text-center text-ink tabular-nums aria-[invalid=true]:border-danger"
                />
              </li>
            )
          })}
        </ul>

        {invalid && <Alert>{t.errors.RETURN_EXCEEDS}</Alert>}

        <div className="flex items-baseline justify-between rounded-md bg-surface px-4 py-3">
          <span className="type-label text-ink-muted">{t.sales.returnValue}</span>
          <span className="type-h3 tabular-nums">{formatMoney(Math.max(preview, 0), currency)}</span>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onCancel}>
            {t.common.cancel}
          </Button>
          <Button
            type="submit"
            variant="danger"
            loading={saving}
            disabled={chosen.length === 0 || invalid}
          >
            {t.sales.confirmReturn}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
