import { useState, type FormEvent } from 'react'
import {
  PRODUCT_UNITS,
  type CategoryDto,
  type ProductDto,
  type ProductUnit
} from '../../../../shared/catalog'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { CheckboxField, SelectField, TextField } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { t } from '../../i18n/ar'
import { api, errorText } from '../../lib/api'
import { categoryOptionLabel, orderCategories } from '../../lib/categories'
import { parseNumber } from '../../lib/format'
import { useCurrency } from '../../store/settings'

interface ProductFormModalProps {
  // Omit to create a new product.
  product?: ProductDto
  categories: CategoryDto[]
  onClose: () => void
  onSaved: () => void
}

function isKnownUnit(unit: string): unit is ProductUnit {
  return (PRODUCT_UNITS as readonly string[]).includes(unit)
}

export function ProductFormModal({ product, categories, onClose, onSaved }: ProductFormModalProps) {
  const currency = useCurrency()
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
  const [isActive, setIsActive] = useState(product?.isActive ?? true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const purchase = parseNumber(purchasePrice)
  const sale = parseNumber(salePrice)
  const belowCost = purchase !== null && sale !== null && sale < purchase

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const min = parseNumber(minQuantity)
    const opening = parseNumber(quantity)
    if (purchase === null || sale === null || min === null || (!product && opening === null)) {
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
      isActive,
      quantity: product ? undefined : (opening ?? 0)
    })
    setSaving(false)
    if (result.ok) onSaved()
    else setError(errorText(result))
  }

  const numberProps = { type: 'number', min: 0, step: 'any', dir: 'ltr', className: 'text-start' } as const

  return (
    <Modal title={product ? t.products.edit : t.products.add} size="lg" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}

        <TextField
          label={t.products.name}
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={120}
          autoFocus
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label={t.products.barcode}
            hint={t.products.barcodeHint}
            value={barcode}
            onChange={(event) => setBarcode(event.target.value)}
            // A scanner ends with Enter; keep that from submitting a half-filled form.
            onKeyDown={(event) => {
              if (event.key === 'Enter') event.preventDefault()
            }}
            maxLength={64}
            dir="ltr"
            className="text-start"
            spellCheck={false}
          />
          <SelectField
            label={t.products.category}
            value={categoryId ?? ''}
            onChange={(event) =>
              setCategoryId(event.target.value === '' ? null : Number(event.target.value))
            }
          >
            <option value="">{t.products.noCategory}</option>
            {orderCategories(categories).map((node) => (
              <option key={node.category.id} value={node.category.id}>
                {categoryOptionLabel(node)}
              </option>
            ))}
          </SelectField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <TextField
            label={`${t.products.purchasePrice} (${currency})`}
            value={purchasePrice}
            onChange={(event) => setPurchasePrice(event.target.value)}
            required
            {...numberProps}
          />
          <TextField
            label={`${t.products.salePrice} (${currency})`}
            value={salePrice}
            onChange={(event) => setSalePrice(event.target.value)}
            warning={belowCost ? t.products.sellingBelowCost : undefined}
            required
            {...numberProps}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <SelectField
            label={t.products.unit}
            value={unit}
            onChange={(event) => setUnit(event.target.value as ProductUnit)}
          >
            {PRODUCT_UNITS.map((option) => (
              <option key={option} value={option}>
                {t.units[option]}
              </option>
            ))}
          </SelectField>
          {!product && (
            <TextField
              label={t.products.openingQuantity}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              required
              {...numberProps}
            />
          )}
          <TextField
            label={t.products.minQuantity}
            value={minQuantity}
            onChange={(event) => setMinQuantity(event.target.value)}
            required
            {...numberProps}
          />
        </div>
        <p className="type-caption text-ink-muted">{t.products.minQuantityHint}</p>

        {product && (
          <CheckboxField
            label={t.products.productActive}
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
          />
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" loading={saving}>
            {product ? t.common.save : t.common.add}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
