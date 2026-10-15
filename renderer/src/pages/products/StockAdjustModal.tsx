import type { ProductDto, StockMovementType } from '../../../../shared/catalog'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { SelectField, TextField } from '../../components/ui/Field'
import { Modal } from '../../components/ui/Modal'
import { useStockAdjustModal } from '../../hooks/products/useStockAdjustModal'
import { t } from '../../i18n'
import { formatQuantity } from '../../lib/format'
import { unitLabel } from '../../lib/units'

interface StockAdjustModalProps {
  product: ProductDto
  onClose: () => void
  onSaved: () => void
}

const AMOUNT_LABEL: Record<StockMovementType, string> = {
  in: t.stock.amountIn,
  out: t.stock.amountOut,
  adjustment: t.stock.counted
}

export function StockAdjustModal({ product, onClose, onSaved }: StockAdjustModalProps) {
  const {
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
  } = useStockAdjustModal({ product, onSaved })

  const unit = unitLabel(product.unit)

  return (
    <Modal title={t.stock.titleFor(product.name)} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}

        <dl className="type-body-sm flex items-center justify-between rounded-md bg-surface px-4 py-3">
          <dt className="text-ink-muted">{t.stock.current}</dt>
          <dd className="type-label-strong tabular-nums">
            {formatQuantity(product.quantity)} {unit}
          </dd>
        </dl>

        <SelectField
          label={t.stock.type}
          value={type}
          onChange={(event) => setType(event.target.value as StockMovementType)}
        >
          <option value="in">{t.stock.typeIn}</option>
          <option value="out">{t.stock.typeOut}</option>
          <option value="adjustment">{t.stock.typeAdjustment}</option>
        </SelectField>

        <TextField
          label={`${AMOUNT_LABEL[type]} (${unit})`}
          type="number"
          min={0}
          step="any"
          dir="ltr"
          className="text-start"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          error={insufficient ? t.errors.INSUFFICIENT_STOCK : undefined}
          hint={
            after !== null && !insufficient
              ? `${t.stock.after}: ${formatQuantity(after)} ${unit}`
              : undefined
          }
          autoFocus
          required
        />

        <TextField
          label={t.stock.reason}
          placeholder={t.stock.reasonPlaceholder}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          maxLength={200}
          required
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" loading={saving} disabled={insufficient}>
            {t.stock.save}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
