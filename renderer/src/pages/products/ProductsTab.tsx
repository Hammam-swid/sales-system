import {
  ArrowUpDown,
  CalendarClock,
  History,
  Pencil,
  Plus,
  Search,
  Trash2,
  TriangleAlert
} from 'lucide-react'
import type { CategoryDto, ProductStatusFilter } from '../../../../shared/catalog'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { IconButton } from '../../components/ui/IconButton'
import { useProductsTab } from '../../hooks/products/useProductsTab'
import { t } from '../../i18n'
import { categoryOptionLabel, orderCategories } from '../../lib/categories'
import { cn } from '../../lib/cn'
import { formatMoney, formatQuantity } from '../../lib/format'
import { unitLabel } from '../../lib/units'
import { MovementsModal } from './MovementsModal'
import { ProductFormModal } from './ProductFormModal'
import { StockAdjustModal } from './StockAdjustModal'

const CONTROL =
  'type-body-sm h-11 rounded-sm border border-border-strong bg-bg px-3 text-ink placeholder:text-ink-muted'

interface ProductsTabProps {
  categories: CategoryDto[]
  canManage: boolean
  canAdjustStock: boolean
  onNotice: (message: string | null) => void
  onCatalogChanged: () => void
}

export function ProductsTab({
  categories,
  canManage,
  canAdjustStock,
  onNotice,
  onCatalogChanged
}: ProductsTabProps) {
  const {
    currency,
    searchInput,
    setSearchInput,
    searchNow,
    categoryId,
    changeCategory,
    status,
    changeStatus,
    lowStockOnly,
    toggleLowStock,
    lowStockCount,
    expiryDates,
    expiringOnly,
    toggleExpiring,
    expiringCount,
    expiryState,
    data,
    error,
    showActions,
    columnCount,
    total,
    page,
    pageCount,
    rangeFrom,
    rangeTo,
    previousPage,
    nextPage,
    dialog,
    openDialog,
    closeDialog,
    finish,
    removeProduct
  } = useProductsTab({ canManage, canAdjustStock, onNotice, onCatalogChanged })

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-64 flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') searchNow()
            }}
            placeholder={t.products.searchPlaceholder}
            aria-label={t.products.searchPlaceholder}
            className={cn(CONTROL, 'w-full ps-10')}
            autoFocus
          />
        </div>

        <select
          value={categoryId ?? ''}
          onChange={(event) =>
            changeCategory(event.target.value === '' ? null : Number(event.target.value))
          }
          aria-label={t.products.category}
          className={CONTROL}
        >
          <option value="">{t.products.allCategories}</option>
          {orderCategories(categories).map((node) => (
            <option key={node.category.id} value={node.category.id}>
              {categoryOptionLabel(node)}
            </option>
          ))}
        </select>

        {canManage && (
          <select
            value={status}
            onChange={(event) => changeStatus(event.target.value as ProductStatusFilter)}
            aria-label={t.products.status}
            className={CONTROL}
          >
            <option value="active">{t.products.statusActive}</option>
            <option value="inactive">{t.products.statusInactive}</option>
            <option value="all">{t.products.statusAll}</option>
          </select>
        )}

        <button
          type="button"
          aria-pressed={lowStockOnly}
          onClick={toggleLowStock}
          className={cn(
            'type-label flex h-11 items-center gap-2 rounded-sm border px-3 transition-colors duration-[120ms] ease-brand',
            lowStockOnly
              ? 'border-warning bg-warning-tint text-warning'
              : 'border-border-strong bg-bg text-ink hover:bg-surface'
          )}
        >
          <TriangleAlert
            aria-hidden
            className={cn('size-4', lowStockCount > 0 && !lowStockOnly && 'text-warning')}
          />
          {t.products.lowStockFilter(lowStockCount)}
        </button>

        {expiryDates && (
          <button
            type="button"
            aria-pressed={expiringOnly}
            onClick={toggleExpiring}
            className={cn(
              'type-label flex h-11 items-center gap-2 rounded-sm border px-3 transition-colors duration-[120ms] ease-brand',
              expiringOnly
                ? 'border-warning bg-warning-tint text-warning'
                : 'border-border-strong bg-bg text-ink hover:bg-surface'
            )}
          >
            <CalendarClock
              aria-hidden
              className={cn('size-4', expiringCount > 0 && !expiringOnly && 'text-warning')}
            />
            {t.products.expiryFilter(expiringCount)}
          </button>
        )}

        {canManage && (
          <Button
            icon={<Plus aria-hidden className="size-4" />}
            onClick={() => openDialog({ kind: 'create' })}
          >
            {t.products.add}
          </Button>
        )}
      </div>

      {error && <Alert>{error}</Alert>}

      <Card className="overflow-x-auto">
        <table className="type-body-sm w-full">
          <thead className="type-label border-b border-border text-ink-muted">
            <tr>
              <th className="px-4 py-3 text-start">{t.products.name}</th>
              <th className="px-4 py-3 text-start">{t.products.category}</th>
              {canManage && <th className="px-4 py-3 text-end">{t.products.purchasePrice}</th>}
              <th className="px-4 py-3 text-end">{t.products.salePrice}</th>
              <th className="px-4 py-3 text-end">{t.products.quantity}</th>
              <th className="px-4 py-3 text-start">{t.products.unit}</th>
              {expiryDates && <th className="px-4 py-3 text-start">{t.products.expiryDate}</th>}
              <th className="px-4 py-3 text-start">{t.products.status}</th>
              {showActions && <th className="px-4 py-3 text-end">{t.common.actions}</th>}
            </tr>
          </thead>
          <tbody>
            {data === null && !error && (
              <tr>
                <td colSpan={columnCount} className="px-4 py-10 text-center text-ink-muted">
                  {t.common.loading}
                </td>
              </tr>
            )}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={columnCount} className="px-4 py-10 text-center text-ink-muted">
                  {t.products.empty}
                </td>
              </tr>
            )}
            {data?.items.map((product) => (
              <tr key={product.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <div className="type-label text-ink">{product.name}</div>
                  {product.barcode && (
                    <div dir="ltr" className="type-caption text-end text-ink-muted tabular-nums">
                      {product.barcode}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-ink-muted">{product.categoryName ?? '—'}</td>
                {canManage && (
                  <td className="px-4 py-3 text-end tabular-nums">
                    {product.purchasePrice === null
                      ? '—'
                      : formatMoney(product.purchasePrice, currency)}
                  </td>
                )}
                <td className="px-4 py-3 text-end font-medium tabular-nums">
                  {formatMoney(product.salePrice, currency)}
                </td>
                <td className="px-4 py-3 text-end tabular-nums">
                  {product.trackStock ? formatQuantity(product.quantity) : '—'}
                </td>
                <td className="px-4 py-3 text-ink-muted">{unitLabel(product.unit)}</td>
                {expiryDates && (
                  <td className="px-4 py-3">
                    {product.expiryDate === null ? (
                      <span className="text-ink-muted">—</span>
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <span dir="ltr" className="tabular-nums">
                          {product.expiryDate}
                        </span>
                        {expiryState(product) === 'expired' && (
                          <Badge tone="danger">{t.products.expired}</Badge>
                        )}
                        {expiryState(product) === 'soon' && (
                          <Badge tone="warning">{t.products.expiringSoon}</Badge>
                        )}
                      </div>
                    )}
                  </td>
                )}
                <td className="px-4 py-3">
                  {!product.isActive ? (
                    <Badge>{t.products.archived}</Badge>
                  ) : !product.trackStock ? (
                    <Badge>{t.products.untracked}</Badge>
                  ) : product.isLowStock ? (
                    <Badge tone="warning">{t.products.lowStock}</Badge>
                  ) : (
                    <Badge tone="success">{t.common.active}</Badge>
                  )}
                </td>
                {showActions && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end">
                      {canAdjustStock && product.trackStock && (
                        <>
                          <IconButton
                            icon={ArrowUpDown}
                            label={t.products.adjustStock}
                            onClick={() => openDialog({ kind: 'stock', product })}
                          />
                          <IconButton
                            icon={History}
                            label={t.products.movements}
                            onClick={() => openDialog({ kind: 'movements', product })}
                          />
                        </>
                      )}
                      {canManage && (
                        <>
                          <IconButton
                            icon={Pencil}
                            label={t.common.edit}
                            onClick={() => openDialog({ kind: 'edit', product })}
                          />
                          <IconButton
                            icon={Trash2}
                            label={t.products.delete}
                            tone="danger"
                            onClick={() => openDialog({ kind: 'delete', product })}
                          />
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="type-body-sm text-ink-muted tabular-nums">
            {t.products.pageInfo(rangeFrom, rangeTo, total)}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={previousPage}
            >
              {t.products.previous}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= pageCount}
              onClick={nextPage}
            >
              {t.products.next}
            </Button>
          </div>
        </div>
      )}

      {(dialog?.kind === 'create' || dialog?.kind === 'edit') && (
        <ProductFormModal
          product={dialog.kind === 'edit' ? dialog.product : undefined}
          categories={categories}
          onClose={() => closeDialog()}
          onSaved={() => finish(dialog.kind === 'edit' ? t.products.saved : t.products.created)}
        />
      )}
      {dialog?.kind === 'stock' && (
        <StockAdjustModal
          product={dialog.product}
          onClose={() => closeDialog()}
          onSaved={() => finish(t.stock.saved)}
        />
      )}
      {dialog?.kind === 'movements' && (
        <MovementsModal product={dialog.product} onClose={() => closeDialog()} />
      )}
      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          title={t.products.deleteTitle}
          body={t.products.deleteBody(dialog.product.name)}
          confirmLabel={t.products.delete}
          onConfirm={() => removeProduct(dialog.product)}
          onClose={() => closeDialog()}
        />
      )}
    </div>
  )
}
