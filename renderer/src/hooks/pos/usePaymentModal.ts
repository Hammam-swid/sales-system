import { useState, type FormEvent } from 'react'
import {
  roundTo,
  type CustomerDto,
  type HoldSaleRequest,
  type SaleDto
} from '../../../../shared/sales'
import { api, errorText } from '../../lib/api'
import { formatMoney, parseNumber } from '../../lib/format'
import { usePrintStore } from '../../store/print'
import { useCurrency } from '../../store/settings'

interface Options {
  cart: HoldSaleRequest
  total: number
  customer: CustomerDto | null
  // Called as soon as the sale is saved, so the cart can be emptied.
  onCompleted: () => void
}

export function usePaymentModal({ cart, total, customer, onCompleted }: Options) {
  const currency = useCurrency()
  const print = usePrintStore((state) => state.print)
  const money = (value: number) => formatMoney(value, currency)

  const [paid, setPaid] = useState(String(total))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  // `debt` is what the customer still owes on the saved invoice.
  const [done, setDone] = useState<{ sale: SaleDto; change: number; debt: number } | null>(null)

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
      setDone({
        sale: result.data,
        change,
        debt: Math.max(0, roundTo(result.data.total - result.data.paidAmount, 2))
      })
      onCompleted()
    } else {
      setError(errorText(result))
    }
  }

  return {
    currency,
    money,
    print,
    paid,
    setPaid,
    payFull: () => setPaid(String(total)),
    payNothing: () => setPaid('0'),
    tendered,
    change,
    remaining,
    needsCustomer,
    error,
    saving,
    done,
    submit
  }
}
