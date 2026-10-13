import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Printer, Undo2 } from 'lucide-react'
import {
  returnedValue,
  roundTo,
  type ReturnSaleResponse,
  type SaleDto
} from '../../../../shared/sales'
import { formatOrderNumber, warrantyEnd } from '../../../../shared/store'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { t } from '../../i18n'
import { api, errorText } from '../../lib/api'
import {
  formatDate,
  formatDateTime,
  formatMoney,
  formatQuantity,
  parseNumber
} from '../../lib/format'
import { useCan } from '../../store/auth'
import { usePrintStore } from '../../store/print'
import { useCurrency } from '../../store/settings'
import { PAYMENT_TONE, STATUS_TONE } from './SalesPage'

interface SaleDetailModalProps {
  saleId: number
  // Called after a return changes the invoice, so the list behind can refresh.
  onChanged: () => void
  onClose: () => void
}

export function SaleDetailModal({ saleId, onChanged, onClose }: SaleDetailModalProps) {
  const currency = useCurrency()
  const canReturn = useCan('sales.return')
  const print = usePrintStore((state) => state.print)
  const money = (value: number) => formatMoney(value, currency)

  const [sale, setSale] = useState<SaleDto | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [returning, setReturning] = useState(false)
  const [outcome, setOutcome] = useState<ReturnSaleResponse | null>(null)

  const load = useCallback(async () => {
    const result = await api('sales:get', { id: saleId })
    if (result.ok) setSale(result.data)
    else setError(errorText(result))
  }, [saleId])

  useEffect(() => {
    void load()
  }, [load])

  const title = sale ? t.sales.detailTitle(sale.invoiceNumber) : t.sales.title

  if (sale && returning) {
    return (
      <ReturnForm
        sale={sale}
        onCancel={() => setReturning(false)}
        onClose={onClose}
        onDone={(result) => {
          setSale(result.sale)
          setOutcome(result)
          setReturning(false)
          onChanged()
        }}
      />
    )
  }

  const remaining = sale ? Math.max(0, roundTo(sale.total - sale.paidAmount, 2)) : 0
  const hasReturns = sale ? sale.items.some((item) => item.returnedQuantity > 0) : false

  return (
    <Modal title={title} size="lg" onClose={onClose}>
      {error && <Alert>{error}</Alert>}
      {!sale && !error && (
        <p className="type-body-sm py-6 text-center text-ink-muted">{t.common.loading}</p>
      )}
      {sale && (
        <div className="space-y-5">
          {outcome && (
            <Alert tone="success">
              {t.sales.returnDone} — {t.sales.returnValue}: {money(outcome.returnValue)}
              {outcome.cashRefund > 0 && ` · ${t.sales.cashRefund}: ${money(outcome.cashRefund)}`}
              {outcome.debtReduction > 0 &&
                ` · ${t.sales.debtReduction}: ${money(outcome.debtReduction)}`}
            </Alert>
          )}

          <div className="type-body-sm flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-ink-muted tabular-nums">{formatDateTime(sale.createdAt)}</span>
            <span>
              <span className="text-ink-muted">{t.sales.customer}: </span>
              {sale.customerName ?? t.sales.walkIn}
            </span>
            <span>
              <span className="text-ink-muted">{t.sales.cashier}: </span>
              {sale.userName ?? '—'}
            </span>
            {sale.orderNumber !== null && (
              <span>
                <span className="text-ink-muted">{t.pos.orderNumber}: </span>
                <span dir="ltr" className="tabular-nums">
                  {formatOrderNumber(sale.orderNumber)}
                </span>
              </span>
            )}
            {sale.orderType && (
              <span>
                <span className="text-ink-muted">{t.pos.orderType}: </span>
                {t.orderTypes[sale.orderType]}
              </span>
            )}
            <Badge tone={STATUS_TONE[sale.status]}>{t.sales.saleStatus[sale.status]}</Badge>
            <Badge tone={PAYMENT_TONE[sale.paymentStatus]}>
              {t.sales.paymentStatus[sale.paymentStatus]}
            </Badge>
          </div>

          <div className="max-h-[40vh] overflow-y-auto rounded-md border border-border">
            <table className="type-body-sm w-full">
              <thead className="type-label border-b border-border bg-surface text-ink-muted">
                <tr>
                  <th className="px-4 py-2 text-start">{t.sales.item}</th>
                  <th className="px-4 py-2 text-end">{t.sales.price}</th>
                  <th className="px-4 py-2 text-end">{t.sales.quantity}</th>
                  <th className="px-4 py-2 text-end">{t.sales.discount}</th>
                  <th className="px-4 py-2 text-end">{t.sales.lineTotal}</th>
                  {hasReturns && <th className="px-4 py-2 text-end">{t.sales.returned}</th>}
                </tr>
              </thead>
              <tbody>
                {sale.items.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">
                      {item.productName}
                      {item.note && <div className="type-caption text-ink-muted">{item.note}</div>}
                      {item.warrantyMonths > 0 && (
                        <div className="type-caption text-ink-muted">
                          {t.receipt.warranty(
                            item.warrantyMonths,
                            formatDate(
                              `${warrantyEnd(sale.createdAt, item.warrantyMonths)}T00:00:00`
                            )
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2 text-end tabular-nums">{money(item.unitPrice)}</td>
                    <td className="px-4 py-2 text-end tabular-nums">
                      {formatQuantity(item.quantity)}
                    </td>
                    <td className="px-4 py-2 text-end tabular-nums">
                      {item.discount > 0 ? money(item.discount) : '—'}
                    </td>
                    <td className="px-4 py-2 text-end font-medium tabular-nums">
                      {money(item.total)}
                    </td>
                    {hasReturns && (
                      <td className="px-4 py-2 text-end tabular-nums">
                        {item.returnedQuantity > 0 ? formatQuantity(item.returnedQuantity) : '—'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="type-body-sm ms-auto w-72 space-y-1">
            <div className="flex justify-between">
              <dt className="text-ink-muted">{t.pos.subtotal}</dt>
              <dd className="tabular-nums">{money(sale.subtotal)}</dd>
            </div>
            {sale.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-muted">{t.pos.discount}</dt>
                <dd className="tabular-nums">− {money(sale.discount)}</dd>
              </div>
            )}
            {sale.tax > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-muted">{t.sales.tax}</dt>
                <dd className="tabular-nums">{money(sale.tax)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-border pt-1">
              <dt className="type-label-strong">{t.sales.total}</dt>
              <dd className="type-label-strong tabular-nums">{money(sale.total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">{t.sales.paid}</dt>
              <dd className="tabular-nums">{money(sale.paidAmount)}</dd>
            </div>
            {remaining > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-muted">{t.sales.remaining}</dt>
                <dd className="tabular-nums">{money(remaining)}</dd>
              </div>
            )}
            {sale.returnedValue > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-muted">{t.sales.returnedValue}</dt>
                <dd className="tabular-nums">{money(sale.returnedValue)}</dd>
              </div>
            )}
          </dl>

          <div className="flex justify-end gap-2">
            {canReturn && sale.status !== 'returned' && (
              <Button
                variant="secondary"
                icon={<Undo2 aria-hidden className="size-4" />}
                onClick={() => {
                  setOutcome(null)
                  setReturning(true)
                }}
              >
                {t.sales.return}
              </Button>
            )}
            <Button icon={<Printer aria-hidden className="size-4" />} onClick={() => print(sale)}>
              {t.pos.printReceipt}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}

interface ReturnFormProps {
  sale: SaleDto
  onCancel: () => void
  onClose: () => void
  onDone: (result: ReturnSaleResponse) => void
}

function ReturnForm({ sale, onCancel, onClose, onDone }: ReturnFormProps) {
  const currency = useCurrency()
  const returnable = sale.items
    .map((item) => ({ item, max: roundTo(item.quantity - item.returnedQuantity, 3) }))
    .filter(({ max }) => max > 0)

  const [quantities, setQuantities] = useState<Record<number, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const chosen = returnable
    .map(({ item, max }) => ({ item, max, quantity: parseNumber(quantities[item.id] ?? '') ?? 0 }))
    .filter(({ quantity }) => quantity > 0)
  const invalid = chosen.some(({ quantity, max }) => quantity > max)

  // Same formula the main process uses, so the preview matches the result to the cent.
  const preview = roundTo(
    returnedValue(
      sale,
      sale.items.map((item) => ({
        ...item,
        returnedQuantity:
          item.returnedQuantity + (chosen.find((entry) => entry.item.id === item.id)?.quantity ?? 0)
      }))
    ) - sale.returnedValue,
    2
  )

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (chosen.length === 0 || invalid) return
    setSaving(true)
    setError(null)
    const result = await api('sales:return', {
      saleId: sale.id,
      items: chosen.map(({ item, quantity }) => ({ saleItemId: item.id, quantity }))
    })
    setSaving(false)
    if (result.ok) onDone(result.data)
    else setError(errorText(result))
  }

  return (
    <Modal title={t.sales.returnTitle(sale.invoiceNumber)} size="lg" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}

        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setQuantities(
                Object.fromEntries(returnable.map(({ item, max }) => [item.id, String(max)]))
              )
            }
          >
            {t.sales.returnAll}
          </Button>
        </div>

        <ul className="max-h-[45vh] space-y-2 overflow-y-auto">
          {returnable.map(({ item, max }) => {
            const value = parseNumber(quantities[item.id] ?? '') ?? 0
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
                  onChange={(event) =>
                    setQuantities((current) => ({ ...current, [item.id]: event.target.value }))
                  }
                  aria-label={`${t.sales.returnQuantity}: ${item.productName}`}
                  aria-invalid={value > max ? true : undefined}
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
