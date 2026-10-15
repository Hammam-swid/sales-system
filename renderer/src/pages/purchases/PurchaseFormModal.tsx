import { Search, Trash2 } from 'lucide-react'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { SelectField, TextField } from '../../components/ui/Field'
import { IconButton } from '../../components/ui/IconButton'
import { Modal } from '../../components/ui/Modal'
import { usePurchaseFormModal } from '../../hooks/purchases/usePurchaseFormModal'
import { t } from '../../i18n'
import { formatMoney } from '../../lib/format'
import { unitLabel } from '../../lib/units'

const CELL_INPUT =
  'type-body-sm h-9 w-24 rounded-sm border border-border-strong bg-bg px-2 text-center text-ink tabular-nums'

interface PurchaseFormModalProps {
  onClose: () => void
  onSaved: () => void
}

export function PurchaseFormModal({ onClose, onSaved }: PurchaseFormModalProps) {
  const {
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
  } = usePurchaseFormModal(onSaved)

  return (
    <Modal title={t.purchases.add} size="lg" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}

        <SelectField
          label={t.purchases.supplier}
          value={supplierId ?? ''}
          onChange={(event) =>
            setSupplierId(event.target.value === '' ? null : Number(event.target.value))
          }
          required
        >
          <option value="">{t.purchases.chooseSupplier}</option>
          {suppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id}>
              {supplier.name}
            </option>
          ))}
        </SelectField>

        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
          />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                // Enter here adds a product; it must not save the invoice.
                event.preventDefault()
                void submitSearch()
              }
            }}
            placeholder={t.purchases.addProduct}
            aria-label={t.purchases.addProduct}
            className="type-body-sm h-11 w-full rounded-sm border border-border-strong bg-bg ps-10 pe-3 text-ink placeholder:text-ink-muted"
          />
          {results.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-md border border-border bg-bg p-1 shadow-md">
              {results.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => addProduct(product)}
                    className="type-body-sm flex w-full items-center justify-between gap-3 rounded-sm px-3 py-2 text-start hover:bg-surface"
                  >
                    <span className="text-ink">{product.name}</span>
                    <span dir="ltr" className="type-caption text-ink-muted tabular-nums">
                      {product.barcode ?? ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {parsed.length === 0 ? (
          <p className="type-body-sm rounded-md border border-dashed border-border-strong py-8 text-center text-ink-muted">
            {t.purchases.noLines}
          </p>
        ) : (
          <div className="max-h-[36vh] overflow-y-auto rounded-md border border-border">
            <table className="type-body-sm w-full">
              <thead className="type-label border-b border-border bg-surface text-ink-muted">
                <tr>
                  <th className="px-3 py-2 text-start">{t.sales.item}</th>
                  <th className="px-3 py-2 text-center">{t.sales.quantity}</th>
                  <th className="px-3 py-2 text-center">{t.purchases.unitCost}</th>
                  <th className="px-3 py-2 text-end">{t.sales.lineTotal}</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {parsed.map(({ line, total: lineTotal }) => (
                  <tr key={line.product.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">
                      <span className="type-label text-ink">{line.product.name}</span>
                      <span className="type-caption ms-2 text-ink-muted">
                        {unitLabel(line.product.unit)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        dir="ltr"
                        value={line.quantity}
                        onChange={(event) =>
                          updateLine(line.product.id, { quantity: event.target.value })
                        }
                        aria-label={`${t.sales.quantity}: ${line.product.name}`}
                        className={CELL_INPUT}
                        required
                      />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        dir="ltr"
                        value={line.unitCost}
                        onChange={(event) =>
                          updateLine(line.product.id, { unitCost: event.target.value })
                        }
                        aria-label={`${t.purchases.unitCost}: ${line.product.name}`}
                        className={CELL_INPUT}
                        required
                      />
                    </td>
                    <td className="px-3 py-2 text-end font-medium tabular-nums">
                      {formatMoney(lineTotal, currency)}
                    </td>
                    <td className="px-3 py-2">
                      <IconButton
                        icon={Trash2}
                        label={t.purchases.remove}
                        tone="danger"
                        onClick={() => removeLine(line.product.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="grid grid-cols-2 items-end gap-4">
          <TextField
            label={`${t.purchases.paidNow} (${currency})`}
            type="number"
            min={0}
            step="any"
            dir="ltr"
            className="text-start"
            value={paid ?? String(total)}
            onChange={(event) => setPaid(event.target.value)}
          />
          <dl className="type-body-sm space-y-1 rounded-md bg-surface px-4 py-3">
            <div className="flex justify-between">
              <dt className="type-label-strong">{t.sales.total}</dt>
              <dd className="type-label-strong tabular-nums">{formatMoney(total, currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">{t.purchases.owed}</dt>
              <dd className="tabular-nums">{formatMoney(owed, currency)}</dd>
            </div>
          </dl>
        </div>
        <p className="type-caption text-ink-muted">{t.purchases.costNote}</p>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" loading={saving} disabled={!canSave}>
            {t.purchases.save}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
