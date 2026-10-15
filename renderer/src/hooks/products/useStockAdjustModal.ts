import { useState, type FormEvent } from 'react'
import type { ProductDto, StockMovementType } from '../../../../shared/catalog'
import { api, errorText } from '../../lib/api'
import { parseNumber } from '../../lib/format'

interface Options {
  product: ProductDto
  onSaved: () => void
}

export function useStockAdjustModal({ product, onSaved }: Options) {
  const [type, setType] = useState<StockMovementType>('in')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const amount = parseNumber(quantity)
  const after =
    amount === null
      ? null
      : type === 'in'
        ? product.quantity + amount
        : type === 'out'
          ? product.quantity - amount
          : amount
  const insufficient = after !== null && after < 0

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (amount === null || insufficient) return
    setSaving(true)
    setError(null)
    const result = await api('products:adjustStock', {
      productId: product.id,
      type,
      quantity: amount,
      reason
    })
    setSaving(false)
    if (result.ok) onSaved()
    else setError(errorText(result))
  }

  return {
    type,
    setType,
    quantity,
    setQuantity,
    reason,
    setReason,
    after,
    insufficient,
    error,
    saving,
    submit
  }
}
