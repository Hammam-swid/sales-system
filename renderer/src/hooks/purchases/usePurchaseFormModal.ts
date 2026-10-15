import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { ProductDto } from '../../../../shared/catalog'
import type { PartyDto } from '../../../../shared/parties'
import { roundTo } from '../../../../shared/sales'
import { api, errorText } from '../../lib/api'
import { parseNumber } from '../../lib/format'
import { useCurrency } from '../../store/settings'

const SEARCH_DEBOUNCE_MS = 200
const RESULT_LIMIT = 8

export interface PurchaseLine {
  product: ProductDto
  quantity: string
  unitCost: string
}

export function usePurchaseFormModal(onSaved: () => void) {
  const currency = useCurrency()
  const [suppliers, setSuppliers] = useState<PartyDto[]>([])
  const [supplierId, setSupplierId] = useState<number | null>(null)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProductDto[]>([])
  const [lines, setLines] = useState<PurchaseLine[]>([])
  // Follows the total until the user types their own amount.
  const [paid, setPaid] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const requestId = useRef(0)
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    void api('suppliers:list', {}).then((result) => {
      if (result.ok) setSuppliers(result.data)
      else setError(errorText(result))
    })
  }, [])

  const search = async (term: string): Promise<ProductDto[]> => {
    const current = ++requestId.current
    if (term === '') {
      setResults([])
      return []
    }
    // Archived products are included: restocking one is how it comes back.
    const result = await api('products:list', {
      search: term,
      status: 'all',
      // Items sold without stock cannot be received.
      trackedOnly: true,
      pageSize: RESULT_LIMIT
    })
    if (current !== requestId.current || !result.ok) return []
    setResults(result.data.items)
    return result.data.items
  }

  useEffect(() => {
    const timer = setTimeout(() => void search(query.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  const addProduct = (product: ProductDto) => {
    setLines((current) =>
      current.some((line) => line.product.id === product.id)
        ? current
        : [...current, { product, quantity: '1', unitCost: String(product.purchasePrice ?? 0) }]
    )
    setQuery('')
    setResults([])
    searchRef.current?.focus()
  }

  // A scanner types the barcode and presses Enter.
  const submitSearch = async () => {
    const term = query.trim()
    const items = await search(term)
    const match = items.find((item) => item.barcode === term) ?? (items.length === 1 ? items[0] : null)
    if (match) addProduct(match)
  }

  const updateLine = (productId: number, patch: Partial<Pick<PurchaseLine, 'quantity' | 'unitCost'>>) =>
    setLines((current) =>
      current.map((line) => (line.product.id === productId ? { ...line, ...patch } : line))
    )

  const parsed = lines.map((line) => {
    const quantity = parseNumber(line.quantity)
    const unitCost = parseNumber(line.unitCost)
    const valid = quantity !== null && quantity > 0 && unitCost !== null && unitCost >= 0
    return { line, quantity, unitCost, valid, total: valid ? roundTo(quantity * unitCost, 2) : 0 }
  })
  const total = roundTo(parsed.reduce((sum, entry) => sum + entry.total, 0), 2)
  const paidValue = paid === null ? total : (parseNumber(paid) ?? 0)
  const owed = Math.max(0, roundTo(total - paidValue, 2))
  const canSave = supplierId !== null && parsed.length > 0 && parsed.every((entry) => entry.valid)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!canSave || supplierId === null) return
    setSaving(true)
    setError(null)
    const result = await api('purchases:create', {
      supplierId,
      items: parsed.map((entry) => ({
        productId: entry.line.product.id,
        quantity: entry.quantity ?? 0,
        unitCost: entry.unitCost ?? 0
      })),
      paidAmount: Math.min(Math.max(paidValue, 0), total)
    })
    setSaving(false)
    if (result.ok) onSaved()
    else setError(errorText(result))
  }

  const removeLine = (productId: number) =>
    setLines((current) => current.filter((other) => other.product.id !== productId))

  return {
    currency,
    suppliers,
    supplierId,
    setSupplierId,
    query,
    setQuery,
    searchRef,
    submitSearch,
    results,
    addProduct,
    parsed,
    updateLine,
    removeLine,
    total,
    paid,
    setPaid,
    owed,
    canSave,
    error,
    saving,
    submit
  }
}
