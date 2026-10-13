import { useCallback, useEffect, useRef, useState } from 'react'
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
import { EXPIRY_WARNING_DAYS, localDate } from '../../../../shared/store'
import type {
  CategoryDto,
  ListProductsResponse,
  ProductDto,
  ProductStatusFilter,
  ProductUnit
} from '../../../../shared/catalog'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { IconButton } from '../../components/ui/IconButton'
import { t } from '../../i18n'
import { api, errorText } from '../../lib/api'
import { categoryOptionLabel, orderCategories } from '../../lib/categories'
import { cn } from '../../lib/cn'
import { formatMoney, formatQuantity } from '../../lib/format'
import { useCurrency, useFeature } from '../../store/settings'
import { MovementsModal } from './MovementsModal'
import { ProductFormModal } from './ProductFormModal'
import { StockAdjustModal } from './StockAdjustModal'

const PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 250

const CONTROL =
  'type-body-sm h-11 rounded-sm border border-border-strong bg-bg px-3 text-ink placeholder:text-ink-muted'

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit'; product: ProductDto }
  | { kind: 'stock'; product: ProductDto }
  | { kind: 'movements'; product: ProductDto }
  | { kind: 'delete'; product: ProductDto }
  | null

interface ProductsTabProps {
  categories: CategoryDto[]
  canManage: boolean
  canAdjustStock: boolean
  onNotice: (message: string | null) => void
  onCatalogChanged: () => void
}

export function unitLabel(unit: string): string {
  return t.units[unit as ProductUnit] ?? unit
}

export function ProductsTab({
  categories,
  canManage,
  canAdjustStock,
  onNotice,
  onCatalogChanged
}: ProductsTabProps) {
  const currency = useCurrency()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [status, setStatus] = useState<ProductStatusFilter>('active')
  const [lowStockOnly, setLowStockOnly] = useState(false)
  const expiryDates = useFeature('expiryDates')
  const [expiringOnly, setExpiringOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<ListProductsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [dialog, setDialog] = useState<Dialog>(null)
  const requestId = useRef(0)

  // Typing waits a moment before searching; a barcode scanner ends with Enter and searches at once.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  const load = useCallback(async () => {
    const current = ++requestId.current
    const result = await api('products:list', {
      search,
      categoryId,
      status,
      lowStockOnly,
      expiringOnly,
      page,
      pageSize: PAGE_SIZE
    })
    // Ignore responses that arrive after a newer request was sent.
    if (current !== requestId.current) return
    if (result.ok) {
      setData(result.data)
      setError(null)
    } else {
      setError(errorText(result))
    }
  }, [search, categoryId, status, lowStockOnly, expiringOnly, page])

  useEffect(() => {
    void load()
  }, [load])

  const finish = (message: string) => {
    setDialog(null)
    onNotice(message)
    void load()
    onCatalogChanged()
  }

  const removeProduct = async (product: ProductDto) => {
    const result = await api('products:delete', { id: product.id })
    if (!result.ok) return errorText(result)
    finish(result.data.outcome === 'archived' ? t.products.archivedNotice : t.products.deleted)
  }

  const showActions = canManage || canAdjustStock
  const columnCount = 6 + (canManage ? 1 : 0) + (expiryDates ? 1 : 0) + (showActions ? 1 : 0)
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const lowStockCount = data?.lowStockCount ?? 0
  const expiringCount = data?.expiringCount ?? 0
  const today = localDate()
  const expiryLimit = localDate(EXPIRY_WARNING_DAYS)

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
              if (event.key === 'Enter') {
                setSearch(searchInput.trim())
                setPage(1)
              }
            }}
            placeholder={t.products.searchPlaceholder}
            aria-label={t.products.searchPlaceholder}
            className={cn(CONTROL, 'w-full ps-10')}
            autoFocus
          />
        </div>

        <select
          value={categoryId ?? ''}
          onChange={(event) => {
            setCategoryId(event.target.value === '' ? null : Number(event.target.value))
            setPage(1)
          }}
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
            onChange={(event) => {
              setStatus(event.target.value as ProductStatusFilter)
              setPage(1)
            }}
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
          onClick={() => {
            setLowStockOnly((value) => !value)
            setPage(1)
          }}
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
            onClick={() => {
              setExpiringOnly((value) => !value)
              setPage(1)
            }}
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
            onClick={() => setDialog({ kind: 'create' })}
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
                        {product.expiryDate < today ? (
                          <Badge tone="danger">{t.products.expired}</Badge>
                        ) : (
                          product.expiryDate <= expiryLimit && (
                            <Badge tone="warning">{t.products.expiringSoon}</Badge>
                          )
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
                            onClick={() => setDialog({ kind: 'stock', product })}
                          />
                          <IconButton
                            icon={History}
                            label={t.products.movements}
                            onClick={() => setDialog({ kind: 'movements', product })}
                          />
                        </>
                      )}
                      {canManage && (
                        <>
                          <IconButton
                            icon={Pencil}
                            label={t.common.edit}
                            onClick={() => setDialog({ kind: 'edit', product })}
                          />
                          <IconButton
                            icon={Trash2}
                            label={t.products.delete}
                            tone="danger"
                            onClick={() => setDialog({ kind: 'delete', product })}
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
            {t.products.pageInfo(
              (page - 1) * PAGE_SIZE + 1,
              Math.min(page * PAGE_SIZE, total),
              total
            )}
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              {t.products.previous}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page >= pageCount}
              onClick={() => setPage((value) => value + 1)}
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
          onClose={() => setDialog(null)}
          onSaved={() => finish(dialog.kind === 'edit' ? t.products.saved : t.products.created)}
        />
      )}
      {dialog?.kind === 'stock' && (
        <StockAdjustModal
          product={dialog.product}
          onClose={() => setDialog(null)}
          onSaved={() => finish(t.stock.saved)}
        />
      )}
      {dialog?.kind === 'movements' && (
        <MovementsModal product={dialog.product} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === 'delete' && (
        <ConfirmDialog
          title={t.products.deleteTitle}
          body={t.products.deleteBody(dialog.product.name)}
          confirmLabel={t.products.delete}
          onConfirm={() => removeProduct(dialog.product)}
          onClose={() => setDialog(null)}
        />
      )}
    </div>
  )
}
