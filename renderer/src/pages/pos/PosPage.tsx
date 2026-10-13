import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Minus,
  NotebookPen,
  PauseCircle,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  X
} from 'lucide-react'
import {
  computeTotals,
  lineTotal,
  roundTo,
  type CustomerDto,
  type PosProduct
} from '../../../../shared/sales'
import { noteOptionsFor, type CategoryDto } from '../../../../shared/catalog'
import { ORDER_TYPES, localDate } from '../../../../shared/store'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { IconButton } from '../../components/ui/IconButton'
import { t } from '../../i18n'
import { api, errorText } from '../../lib/api'
import { cn } from '../../lib/cn'
import { formatMoney, formatQuantity, parseNumber } from '../../lib/format'
import {
  maxQuantity,
  quantityInCart,
  quantityStep,
  useCartStore,
  type DiscountMode
} from '../../store/cart'
import { useFeature, useSettingsStore } from '../../store/settings'
import { unitLabel } from '../products/ProductsTab'
import { HeldSalesModal } from './HeldSalesModal'
import { LineNoteModal } from './LineNoteModal'
import { PaymentModal } from './PaymentModal'

const RESULT_LIMIT = 30
const SEARCH_DEBOUNCE_MS = 200

const SMALL_INPUT =
  'type-body-sm h-9 rounded-sm border border-border-strong bg-bg px-2 text-center text-ink tabular-nums'

export function PosPage() {
  const { currency, taxRate } = useSettingsStore((state) => state.settings)
  const cart = useCartStore()
  const money = (value: number) => formatMoney(value, currency)

  const posCategories = useFeature('posCategories')
  const orderTypes = useFeature('orderTypes')
  const lineNotes = useFeature('lineNotes')

  const [query, setQuery] = useState('')
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [noteLineId, setNoteLineId] = useState<number | null>(null)
  const [products, setProducts] = useState<PosProduct[] | null>(null)
  const [customers, setCustomers] = useState<CustomerDto[]>([])
  const [heldCount, setHeldCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [dialog, setDialog] = useState<'payment' | 'held' | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const requestId = useRef(0)

  const fetchProducts = useCallback(
    async (search: string): Promise<PosProduct[] | null> => {
      const current = ++requestId.current
      const result = await api('products:list', {
        search,
        // A typed search or scanned barcode looks in every category.
        categoryId: search === '' ? categoryId : null,
        status: 'active',
        pageSize: RESULT_LIMIT
      })
      if (current !== requestId.current) return null
      if (!result.ok) {
        setError(errorText(result))
        return null
      }
      setProducts(result.data.items)
      return result.data.items
    },
    [categoryId]
  )

  const refreshSideData = useCallback(async () => {
    const [customersResult, heldResult] = await Promise.all([
      api('customers:list', {}),
      api('sales:held')
    ])
    if (customersResult.ok) setCustomers(customersResult.data)
    if (heldResult.ok) setHeldCount(heldResult.data.length)
  }, [])

  useEffect(() => {
    void refreshSideData()
  }, [refreshSideData])

  useEffect(() => {
    if (!posCategories && !lineNotes) return
    void api('categories:list').then((result) => {
      if (result.ok) setCategories(result.data)
    })
  }, [posCategories, lineNotes])

  useEffect(() => {
    const timer = setTimeout(() => void fetchProducts(query.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query, fetchProducts])

  const focusSearch = () => searchRef.current?.focus()
  const topCategories = categories.filter((category) => category.parentId === null)
  const noteLine = cart.lines.find((line) => line.id === noteLineId) ?? null

  const addProduct = (product: PosProduct) => {
    setNotice(null)
    if (!cart.add(product)) setError(`${product.name}: ${t.errors.INSUFFICIENT_STOCK}`)
    // Still sellable, but the cashier should know before handing it over.
    else if (product.expiryDate !== null && product.expiryDate < localDate()) {
      setError(t.pos.expiredProduct(product.name))
    } else setError(null)
  }

  // A barcode scanner types the code and presses Enter: add the match straight to the cart.
  const submitSearch = async () => {
    const term = query.trim()
    if (term === '') return
    const items = await fetchProducts(term)
    if (!items) return
    const match = items.find((item) => item.barcode === term) ?? (items.length === 1 ? items[0] : null)
    if (match) {
      addProduct(match)
      setQuery('')
    }
  }

  const amounts = cart.lines.map((line) => ({
    quantity: line.quantity,
    unitPrice: line.product.salePrice,
    discount: line.discount
  }))
  const subtotal = computeTotals(amounts, 0, 0).subtotal
  const discountAmount =
    cart.discountMode === 'percent'
      ? roundTo((subtotal * Math.min(cart.discountValue, 100)) / 100, 2)
      : cart.discountValue
  const totals = computeTotals(amounts, discountAmount, taxRate)
  const sellable = cart.lines.filter((line) => line.quantity > 0)
  const customer = customers.find((candidate) => candidate.id === cart.customerId) ?? null

  const cartPayload = () => ({
    items: sellable.map((line) => ({
      productId: line.product.id,
      quantity: line.quantity,
      discount: line.discount,
      note: lineNotes && line.note.trim() !== '' ? line.note.trim() : null
    })),
    discount: totals.discount,
    customerId: cart.customerId,
    orderType: orderTypes ? cart.orderType : null
  })

  const hold = async () => {
    const result = await api('sales:hold', cartPayload())
    if (!result.ok) {
      setError(errorText(result))
      return
    }
    cart.clear()
    setError(null)
    setNotice(t.pos.held)
    setHeldCount((count) => count + 1)
    focusSearch()
  }

  const afterSale = () => {
    setDialog(null)
    void fetchProducts(query.trim())
    void refreshSideData()
    focusSearch()
  }

  return (
    <div className="flex h-full gap-6">
      {/* Products */}
      <section className="flex min-w-0 flex-1 flex-col gap-4">
        <div className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-ink-muted"
          />
          <input
            ref={searchRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void submitSearch()
            }}
            placeholder={t.pos.searchPlaceholder}
            aria-label={t.pos.searchPlaceholder}
            className="type-body h-12 w-full rounded-md border border-border-strong bg-bg ps-12 pe-4 text-ink placeholder:text-ink-muted"
            autoFocus
          />
        </div>

        {posCategories && topCategories.length > 0 && (
          <div role="group" aria-label={t.pos.categories} className="flex flex-wrap gap-2">
            {[{ id: null, name: t.products.allCategories }, ...topCategories].map((category) => (
              <button
                key={category.id ?? 'all'}
                type="button"
                aria-pressed={categoryId === category.id}
                onClick={() => {
                  setCategoryId(category.id)
                  setQuery('')
                }}
                className={cn(
                  'type-label h-11 rounded-md border px-4 transition-colors duration-[120ms] ease-brand',
                  categoryId === category.id
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-border-strong bg-bg text-ink hover:bg-surface'
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}

        {error && <Alert>{error}</Alert>}
        {notice && <Alert tone="success">{notice}</Alert>}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {products?.length === 0 && (
            <p className="type-body py-12 text-center text-ink-muted">{t.pos.noProducts}</p>
          )}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
            {products?.map((product) => {
              const soldOut = product.trackStock && product.quantity <= 0
              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={soldOut}
                  onClick={() => {
                    addProduct(product)
                    focusSearch()
                  }}
                  className={cn(
                    'flex min-h-28 flex-col justify-between gap-2 rounded-md border border-border bg-surface p-4 text-start transition-shadow duration-200 ease-brand',
                    soldOut ? 'cursor-not-allowed opacity-55' : 'hover:shadow-md'
                  )}
                >
                  <span className="type-label text-ink">{product.name}</span>
                  <span className="flex items-end justify-between gap-2">
                    <span className="type-label-strong text-accent tabular-nums">
                      {money(product.salePrice)}
                    </span>
                    {product.trackStock && (
                      <span className="type-caption text-ink-muted">
                        {soldOut
                          ? t.pos.outOfStock
                          : t.pos.inStock(formatQuantity(product.quantity), unitLabel(product.unit))}
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Cart */}
      <aside className="flex w-[440px] shrink-0 flex-col rounded-lg border border-border bg-surface">
        <header className="flex items-center justify-between gap-2 border-b border-border px-5 py-3">
          <h2 className="type-h4">{t.pos.cart}</h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setDialog('held')}>
              {t.pos.heldCount(heldCount)}
            </Button>
            <IconButton
              icon={X}
              label={t.pos.clear}
              disabled={cart.lines.length === 0}
              onClick={() => {
                cart.clear()
                focusSearch()
              }}
            />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          {cart.lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center text-ink-muted">
              <ShoppingCart aria-hidden className="size-10" />
              <p className="type-body-sm">{t.pos.emptyCart}</p>
            </div>
          ) : (
            <ul>
              {cart.lines.map((line) => {
                const step = quantityStep(line.product.unit)
                // Stock is shared by every line of the same product.
                const lineMax = roundTo(
                  maxQuantity(line.product) -
                    quantityInCart(cart.lines, line.product.id, line.id),
                  3
                )
                const atMax = line.quantity >= lineMax
                const noteOptions = lineNotes
                  ? noteOptionsFor(categories, line.product.categoryId)
                  : []
                return (
                  <li key={line.id} className="border-b border-border py-3 last:border-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="type-label text-ink">{line.product.name}</p>
                        <p className="type-caption text-ink-muted tabular-nums">
                          {money(line.product.salePrice)} / {unitLabel(line.product.unit)}
                        </p>
                      </div>
                      <IconButton
                        icon={Trash2}
                        label={t.pos.remove}
                        tone="danger"
                        onClick={() => cart.remove(line.id)}
                      />
                    </div>

                    <div className="mt-2 flex items-center gap-2">
                      <IconButton
                        icon={Minus}
                        label={t.pos.decrease}
                        className="border border-border-strong"
                        disabled={line.quantity <= 0}
                        onClick={() => cart.setQuantity(line.id, line.quantity - step)}
                      />
                      <input
                        type="number"
                        min={0}
                        max={line.product.trackStock ? lineMax : undefined}
                        step="any"
                        dir="ltr"
                        value={line.quantity}
                        onChange={(event) =>
                          cart.setQuantity(line.id, parseNumber(event.target.value) ?? 0)
                        }
                        aria-label={`${t.pos.quantity}: ${line.product.name}`}
                        className={cn(SMALL_INPUT, 'w-16')}
                      />
                      <IconButton
                        icon={Plus}
                        label={t.pos.increase}
                        className="border border-border-strong"
                        disabled={atMax}
                        onClick={() => cart.setQuantity(line.id, line.quantity + step)}
                      />
                      <input
                        type="number"
                        min={0}
                        step="any"
                        dir="ltr"
                        value={line.discount === 0 ? '' : line.discount}
                        placeholder={t.sales.discount}
                        onChange={(event) =>
                          cart.setLineDiscount(line.id, parseNumber(event.target.value) ?? 0)
                        }
                        aria-label={`${t.pos.lineDiscount}: ${line.product.name}`}
                        className={cn(SMALL_INPUT, 'w-20 placeholder:text-ink-muted')}
                      />
                      <span className="type-label-strong ms-auto text-ink tabular-nums">
                        {money(
                          lineTotal({
                            quantity: line.quantity,
                            unitPrice: line.product.salePrice,
                            discount: line.discount
                          })
                        )}
                      </span>
                    </div>
                    {(noteOptions.length > 0 || line.note !== '') && (
                      <button
                        type="button"
                        onClick={() => setNoteLineId(line.id)}
                        className={cn(
                          'type-body-sm mt-2 flex min-h-9 w-full items-center gap-2 rounded-sm border border-border-strong bg-bg px-2 py-1 text-start hover:bg-surface',
                          line.note === '' ? 'text-ink-muted' : 'text-ink'
                        )}
                      >
                        <NotebookPen aria-hidden className="size-4 shrink-0" />
                        {line.note === '' ? t.pos.addNote : line.note}
                      </button>
                    )}
                    {atMax && (
                      <p className="type-caption mt-1 text-warning">
                        {t.pos.maxStock(formatQuantity(line.product.quantity))}
                      </p>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <footer className="space-y-3 border-t border-border px-5 py-4">
          {orderTypes && (
            <div role="group" aria-label={t.pos.orderType} className="flex gap-2">
              {ORDER_TYPES.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={cart.orderType === option}
                  onClick={() => cart.setOrderType(option)}
                  className={cn(
                    'type-label h-10 flex-1 rounded-sm border transition-colors duration-[120ms] ease-brand',
                    cart.orderType === option
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-border-strong bg-bg text-ink hover:bg-surface'
                  )}
                >
                  {t.orderTypes[option]}
                </button>
              ))}
            </div>
          )}
          <label className="block space-y-1">
            <span className="type-label text-ink">{t.pos.customer}</span>
            <select
              value={cart.customerId ?? ''}
              onChange={(event) =>
                cart.setCustomer(event.target.value === '' ? null : Number(event.target.value))
              }
              className="type-body-sm h-10 w-full rounded-sm border border-border-strong bg-bg px-3 text-ink"
            >
              <option value="">{t.pos.walkIn}</option>
              {customers.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            {customer && customer.balance > 0 && (
              <span className="type-caption block text-warning">
                {t.pos.customerDebt(money(customer.balance))}
              </span>
            )}
          </label>

          <div className="flex items-center justify-between gap-2">
            <span className="type-label text-ink">{t.pos.discount}</span>
            <div className="flex items-center gap-2">
              <select
                value={cart.discountMode}
                onChange={(event) =>
                  cart.setDiscount(event.target.value as DiscountMode, cart.discountValue)
                }
                aria-label={t.pos.discount}
                className="type-body-sm h-9 rounded-sm border border-border-strong bg-bg px-2 text-ink"
              >
                <option value="amount">{t.pos.discountAmount}</option>
                <option value="percent">{t.pos.discountPercent}</option>
              </select>
              <input
                type="number"
                min={0}
                step="any"
                dir="ltr"
                value={cart.discountValue === 0 ? '' : cart.discountValue}
                placeholder="0"
                onChange={(event) =>
                  cart.setDiscount(cart.discountMode, parseNumber(event.target.value) ?? 0)
                }
                aria-label={t.pos.discount}
                className={cn(SMALL_INPUT, 'w-24')}
              />
            </div>
          </div>

          <dl className="type-body-sm space-y-1">
            <div className="flex justify-between">
              <dt className="text-ink-muted">{t.pos.subtotal}</dt>
              <dd className="tabular-nums">{money(totals.subtotal)}</dd>
            </div>
            {totals.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-muted">{t.pos.discount}</dt>
                <dd className="tabular-nums">− {money(totals.discount)}</dd>
              </div>
            )}
            {taxRate > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-muted">{t.pos.tax(taxRate)}</dt>
                <dd className="tabular-nums">{money(totals.tax)}</dd>
              </div>
            )}
            <div className="flex items-baseline justify-between pt-1">
              <dt className="type-h4 text-ink">{t.pos.total}</dt>
              <dd className="type-h3 text-ink tabular-nums">{money(totals.total)}</dd>
            </div>
          </dl>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              icon={<PauseCircle aria-hidden className="size-4" />}
              disabled={sellable.length === 0}
              onClick={hold}
            >
              {t.pos.hold}
            </Button>
            <Button
              className="flex-1"
              disabled={sellable.length === 0}
              onClick={() => {
                setError(null)
                setNotice(null)
                setDialog('payment')
              }}
            >
              {t.pos.pay} — {money(totals.total)}
            </Button>
          </div>
        </footer>
      </aside>

      {dialog === 'payment' && (
        <PaymentModal
          cart={cartPayload()}
          total={totals.total}
          customer={customer}
          onCompleted={() => cart.clear()}
          onClose={afterSale}
        />
      )}
      {noteLine && (
        <LineNoteModal
          line={noteLine}
          options={noteOptionsFor(categories, noteLine.product.categoryId)}
          onApply={(note, count) => cart.setLineNote(noteLine.id, note, count)}
          onClose={() => setNoteLineId(null)}
        />
      )}
      {dialog === 'held' && (
        <HeldSalesModal
          cartHasItems={cart.lines.length > 0}
          onResumed={(held) => {
            cart.load(held)
            const dropped = held.items.length - useCartStore.getState().lines.length
            setNotice(dropped > 0 ? t.pos.unavailableDropped : null)
            setError(null)
          }}
          onClose={afterSale}
        />
      )}
    </div>
  )
}
