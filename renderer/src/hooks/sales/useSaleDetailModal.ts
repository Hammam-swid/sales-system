import { useCallback, useEffect, useState } from 'react'
import { roundTo, type ReturnSaleResponse, type SaleDto } from '../../../../shared/sales'
import { t } from '../../i18n'
import { api, errorText } from '../../lib/api'
import { formatMoney } from '../../lib/format'
import { useCan } from '../../store/auth'
import { usePrintStore } from '../../store/print'
import { useCurrency } from '../../store/settings'

interface Options {
  saleId: number
  // Called after a return changes the invoice, so the list behind can refresh.
  onChanged: () => void
}

export function useSaleDetailModal({ saleId, onChanged }: Options) {
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

  const startReturn = () => {
    setOutcome(null)
    setReturning(true)
  }

  const finishReturn = (result: ReturnSaleResponse) => {
    setSale(result.sale)
    setOutcome(result)
    setReturning(false)
    onChanged()
  }

  const remaining = sale ? Math.max(0, roundTo(sale.total - sale.paidAmount, 2)) : 0
  const hasReturns = sale ? sale.items.some((item) => item.returnedQuantity > 0) : false

  return {
    money,
    canReturn,
    print,
    sale,
    error,
    title,
    returning,
    startReturn,
    cancelReturn: () => setReturning(false),
    finishReturn,
    outcome,
    remaining,
    hasReturns
  }
}
