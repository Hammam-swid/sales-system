import { CircleCheck, Printer } from 'lucide-react'
import type { CustomerDto, HoldSaleRequest } from '../../../../shared/sales'
import { formatOrderNumber } from '../../../../shared/store'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { usePaymentModal } from '../../hooks/pos/usePaymentModal'
import { t } from '../../i18n'

interface PaymentModalProps {
  cart: HoldSaleRequest
  total: number
  customer: CustomerDto | null
  // Called as soon as the sale is saved, so the cart can be emptied.
  onCompleted: () => void
  onClose: () => void
}

export function PaymentModal({ cart, total, customer, onCompleted, onClose }: PaymentModalProps) {
  const {
    currency,
    money,
    print,
    paid,
    setPaid,
    payFull,
    payNothing,
    tendered,
    change,
    remaining,
    needsCustomer,
    error,
    saving,
    done,
    submit
  } = usePaymentModal({ cart, total, customer, onCompleted })

  if (done) {
    return (
      <Modal title={t.pos.done} onClose={onClose}>
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <CircleCheck aria-hidden className="size-12 text-success" />
            {done.sale.orderNumber !== null && (
              <>
                <p className="type-body-sm text-ink-muted">{t.pos.orderNumber}</p>
                <p dir="ltr" className="type-h1 tabular-nums">
                  {formatOrderNumber(done.sale.orderNumber)}
                </p>
              </>
            )}
            <p className="type-body-sm text-ink-muted">{t.pos.invoiceNumber}</p>
            <p dir="ltr" className="type-h3 tabular-nums">
              {done.sale.invoiceNumber}
            </p>
          </div>
          <dl className="type-body-sm space-y-2 rounded-md bg-surface px-4 py-3">
            <div className="flex justify-between">
              <dt className="text-ink-muted">{t.pos.total}</dt>
              <dd className="type-label-strong tabular-nums">{money(done.sale.total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">{t.pos.amountPaid}</dt>
              <dd className="tabular-nums">{money(done.sale.paidAmount)}</dd>
            </div>
            {done.change > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-muted">{t.pos.change}</dt>
                <dd className="type-label-strong tabular-nums">{money(done.change)}</dd>
              </div>
            )}
            {done.sale.total > done.sale.paidAmount && (
              <div className="flex justify-between">
                <dt className="text-ink-muted">{t.pos.remainingDebt}</dt>
                <dd className="type-label-strong text-warning tabular-nums">
                  {money(done.debt)}
                </dd>
              </div>
            )}
          </dl>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              icon={<Printer aria-hidden className="size-4" />}
              onClick={() => print(done.sale)}
            >
              {t.pos.printReceipt}
            </Button>
            <Button onClick={onClose} autoFocus>
              {t.pos.newSale}
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title={t.pos.paymentTitle} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}

        <div className="flex items-baseline justify-between rounded-md bg-surface px-4 py-3">
          <span className="type-label text-ink-muted">{t.pos.total}</span>
          <span className="type-h2 tabular-nums">{money(total)}</span>
        </div>

        <TextField
          label={`${t.pos.amountPaid} (${currency})`}
          type="number"
          min={0}
          step="any"
          dir="ltr"
          className="text-start"
          value={paid}
          onChange={(event) => setPaid(event.target.value)}
          onFocus={(event) => event.target.select()}
          autoFocus
          required
        />
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={payFull}>
            {t.pos.payFull}
          </Button>
          <Button variant="secondary" size="sm" onClick={payNothing}>
            {t.pos.payNothing}
          </Button>
        </div>

        {change > 0 && (
          <div className="type-body-sm flex justify-between rounded-md bg-success-tint px-4 py-3 text-success">
            <span>{t.pos.change}</span>
            <span className="type-label-strong tabular-nums">{money(change)}</span>
          </div>
        )}
        {remaining > 0 && (
          <div className="type-body-sm flex justify-between rounded-md bg-warning-tint px-4 py-3 text-warning">
            <span>
              {t.pos.remainingDebt}
              {customer && ` (${customer.name})`}
            </span>
            <span className="type-label-strong tabular-nums">{money(remaining)}</span>
          </div>
        )}
        {needsCustomer && <Alert>{t.pos.needCustomer}</Alert>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" loading={saving} disabled={tendered === null || needsCustomer}>
            {t.pos.confirm}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
