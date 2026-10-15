import { useState, type FormEvent } from 'react'
import {
  returnedValue,
  roundTo,
  type ReturnSaleResponse,
  type SaleDto
} from '../../../../shared/sales'
import { api, errorText } from '../../lib/api'
import { parseNumber } from '../../lib/format'
import { useCurrency } from '../../store/settings'

interface Options {
  sale: SaleDto
  onDone: (result: ReturnSaleResponse) => void
}

export function useReturnForm({ sale, onDone }: Options) {
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

  const returnAll = () =>
    setQuantities(Object.fromEntries(returnable.map(({ item, max }) => [item.id, String(max)])))

  const setQuantity = (itemId: number, text: string) =>
    setQuantities((current) => ({ ...current, [itemId]: text }))

  // Whether the quantity typed for an item is more than can still be returned.
  const exceeds = (itemId: number, max: number) =>
    (parseNumber(quantities[itemId] ?? '') ?? 0) > max

  return {
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
  }
}
