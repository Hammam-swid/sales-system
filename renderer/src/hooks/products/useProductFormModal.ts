import { useState, type FormEvent } from 'react'
import type { ProductDto, ProductUnit } from '../../../../shared/catalog'
import { MAX_WARRANTY_MONTHS } from '../../../../shared/store'
import { t } from '../../i18n'
import { api, errorText } from '../../lib/api'
import { parseNumber } from '../../lib/format'
import { isKnownUnit } from '../../lib/units'
import { useCurrency, useFeature } from '../../store/settings'

interface Options {
  // Omit to create a new product.
  product?: ProductDto
  onSaved: () => void
}

export function useProductFormModal({ product, onSaved }: Options) {
  const currency = useCurrency()
  const expiryDates = useFeature('expiryDates')
  const warranty = useFeature('warranty')
  const untrackedItems = useFeature('untrackedItems')
  const [name, setName] = useState(product?.name ?? '')
  const [barcode, setBarcode] = useState(product?.barcode ?? '')
  const [categoryId, setCategoryId] = useState<number | null>(product?.categoryId ?? null)
  const [unit, setUnit] = useState<ProductUnit>(
    product && isKnownUnit(product.unit) ? product.unit : 'piece'
  )
  const [purchasePrice, setPurchasePrice] = useState(String(product?.purchasePrice ?? ''))
  const [salePrice, setSalePrice] = useState(String(product?.salePrice ?? ''))
  const [quantity, setQuantity] = useState('0')
  const [minQuantity, setMinQuantity] = useState(String(product?.minQuantity ?? '0'))
  const [expiryDate, setExpiryDate] = useState(product?.expiryDate ?? '')
  const [warrantyMonths, setWarrantyMonths] = useState(String(product?.warrantyMonths ?? '0'))
  // A shop that sells without stock (a cafe) starts new products that way.
  const [trackStock, setTrackStock] = useState(product?.trackStock ?? !untrackedItems)
  const [isActive, setIsActive] = useState(product?.isActive ?? true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const purchase = parseNumber(purchasePrice)
  const sale = parseNumber(salePrice)
  const belowCost = purchase !== null && sale !== null && sale < purchase

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const min = trackStock ? parseNumber(minQuantity) : 0
    const opening = trackStock ? parseNumber(quantity) : 0
    const months = parseNumber(warrantyMonths)
    if (
      purchase === null ||
      sale === null ||
      min === null ||
      (!product && opening === null) ||
      months === null ||
      !Number.isInteger(months) ||
      months > MAX_WARRANTY_MONTHS
    ) {
      setError(t.errors.VALIDATION)
      return
    }

    setSaving(true)
    setError(null)
    const result = await api('products:save', {
      id: product?.id,
      name,
      barcode: barcode.trim() === '' ? null : barcode.trim(),
      categoryId,
      unit,
      purchasePrice: purchase,
      salePrice: sale,
      minQuantity: min,
      expiryDate: expiryDate === '' ? null : expiryDate,
      warrantyMonths: months,
      trackStock,
      isActive,
      quantity: product ? undefined : (opening ?? 0)
    })
    setSaving(false)
    if (result.ok) onSaved()
    else setError(errorText(result))
  }

  return {
    currency,
    expiryDates,
    warranty,
    untrackedItems,
    name,
    setName,
    barcode,
    setBarcode,
    categoryId,
    setCategoryId,
    unit,
    setUnit,
    purchasePrice,
    setPurchasePrice,
    salePrice,
    setSalePrice,
    belowCost,
    quantity,
    setQuantity,
    minQuantity,
    setMinQuantity,
    expiryDate,
    setExpiryDate,
    warrantyMonths,
    setWarrantyMonths,
    trackStock,
    setTrackStock,
    isActive,
    setIsActive,
    error,
    saving,
    submit
  }
}
