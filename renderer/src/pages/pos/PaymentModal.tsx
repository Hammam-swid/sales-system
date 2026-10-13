import { useState, type FormEvent } from 'react'
import { CircleCheck, Printer } from 'lucide-react'
import {
  roundTo,
  type CustomerDto,
  type HoldSaleRequest,
  type SaleDto
} from '../../../../shared/sales'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { TextField } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { t } from '../../i18n'
import { api, errorText } from '../../lib/api'
import { formatMoney, parseNumber } from '../../lib/format'
import { usePrintStore } from '../../store/print'
import { useCurrency } from '../../store/settings'

interface PaymentModalProps {
  cart: HoldSaleRequest
  total: number
  customer: CustomerDto | null
  // Called as soon as the sale is saved, so the cart can be emptied.
  onCompleted: () => void
  onClose: () => void
}

export function PaymentModal({ cart, total, customer, onCompleted, onClose }: PaymentModalProps) {
  const currency = useCurrency()
  const print = usePrintStore((state) => state.print)
  const money = (value: number) => formatMoney(value, currency)

  const [paid, setPaid] = useState(String(total))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState<{ sale: SaleDto; change: number } | null>(null)

  const tendered = parseNumber(paid)
  const change = tendered === null ? 0 : Math.max(0, roundTo(tendered - total, 2))
  const remaining = tendered === null ? 0 : Math.max(0, roundTo(total - tendered, 2))
  const needsCustomer = remaining > 0 && !customer

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (tendered === null || tendered < 0 || needsCustomer) return
    setSaving(true)
    setError(null)
    const result = await api('sales:checkout', { ...cart, paidAmount: Math.min(tendered, total) })
    setSaving(false)
    if (result.ok) {
      setDone({ sale: result.data, change })
      onCompleted()
    } else {
      setError(errorText(result))
    }
  }

  if (done) {
    return (
      <Modal title={t.pos.done} onClose={onClose}>
        <div className="space-y-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <CircleCheck aria-hidden className="size-12 text-success" />
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
                  {money(roundTo(done.sale.total - done.sale.paidAmount, 2))}
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
          <Button variant="secondary" size="sm" onClick={() => setPaid(String(total))}>
            {t.pos.payFull}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setPaid('0')}>
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
