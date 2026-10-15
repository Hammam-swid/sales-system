import {
  PRODUCT_UNITS,
  type CategoryDto,
  type ProductDto,
  type ProductUnit
} from '../../../../shared/catalog'
import { MAX_WARRANTY_MONTHS } from '../../../../shared/store'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { CheckboxField, SelectField, TextField } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { useProductFormModal } from '../../hooks/products/useProductFormModal'
import { t } from '../../i18n'
import { categoryOptionLabel, orderCategories } from '../../lib/categories'

interface ProductFormModalProps {
  // Omit to create a new product.
  product?: ProductDto
  categories: CategoryDto[]
  onClose: () => void
  onSaved: () => void
}

export function ProductFormModal({ product, categories, onClose, onSaved }: ProductFormModalProps) {
  const {
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
  } = useProductFormModal({ product, onSaved })

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
          {!product && trackStock && (
            <TextField
              label={t.products.openingQuantity}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              required
              {...numberProps}
            />
          )}
          {trackStock && (
            <TextField
              label={t.products.minQuantity}
              value={minQuantity}
              onChange={(event) => setMinQuantity(event.target.value)}
              required
              {...numberProps}
            />
          )}
        </div>
        {trackStock && <p className="type-caption text-ink-muted">{t.products.minQuantityHint}</p>}

        {(untrackedItems || !trackStock) && (
          <div>
            <CheckboxField
              label={t.products.trackStock}
              checked={trackStock}
              onChange={(event) => setTrackStock(event.target.checked)}
            />
            <p className="type-caption text-ink-muted">{t.products.trackStockHint}</p>
          </div>
        )}

        {(expiryDates || warranty) && (
          <div className="grid grid-cols-2 gap-4">
            {expiryDates && (
              <TextField
                label={t.products.expiryDate}
                hint={t.products.expiryDateHint}
                type="date"
                value={expiryDate}
                onChange={(event) => setExpiryDate(event.target.value)}
                dir="ltr"
                className="text-start"
              />
            )}
            {warranty && (
              <TextField
                label={t.products.warrantyMonths}
                hint={t.products.warrantyHint}
                value={warrantyMonths}
                onChange={(event) => setWarrantyMonths(event.target.value)}
                max={MAX_WARRANTY_MONTHS}
                required
                {...numberProps}
                step={1}
              />
            )}
          </div>
        )}

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
