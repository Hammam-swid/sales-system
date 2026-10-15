import { useEffect, useState } from 'react'
import type { PurchaseDto } from '../../../../shared/parties'
import { api, errorText } from '../../lib/api'
import { formatMoney } from '../../lib/format'
import { useCurrency } from '../../store/settings'

export function usePurchaseDetailModal(id: number) {
  const currency = useCurrency()
  const money = (value: number) => formatMoney(value, currency)
  const [purchase, setPurchase] = useState<PurchaseDto | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void api('purchases:get', { id }).then((result) => {
      if (result.ok) setPurchase(result.data)
      else setError(errorText(result))
    })
  }, [id])

  return { money, purchase, error }
}
