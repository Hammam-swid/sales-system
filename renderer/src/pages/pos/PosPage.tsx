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
import { ORDER_TYPES } from '../../../../shared/store'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { IconButton } from '../../components/ui/IconButton'
import { usePosPage } from '../../hooks/pos/usePosPage'
import { t } from '../../i18n'
import { cn } from '../../lib/cn'
import { formatQuantity, parseNumber } from '../../lib/format'
import { unitLabel } from '../../lib/units'
import type { DiscountMode } from '../../store/cart'
import { HeldSalesModal } from './HeldSalesModal'
import { LineNoteModal } from './LineNoteModal'
import { PaymentModal } from './PaymentModal'

const SMALL_INPUT =
  'type-body-sm h-9 rounded-sm border border-border-strong bg-bg px-2 text-center text-ink tabular-nums'

export function PosPage() {
  const pos = usePosPage()
  const { cart, money, totals } = pos

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
            ref={pos.searchRef}
            type="search"
            value={pos.query}
            onChange={(event) => pos.setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void pos.submitSearch()
            }}
            placeholder={t.pos.searchPlaceholder}
            aria-label={t.pos.searchPlaceholder}
            className="type-body h-12 w-full rounded-md border border-border-strong bg-bg ps-12 pe-4 text-ink placeholder:text-ink-muted"
            autoFocus
          />
        </div>

        {pos.posCategories && pos.topCategories.length > 0 && (
          <div role="group" aria-label={t.pos.categories} className="flex flex-wrap gap-2">
            {[{ id: null, name: t.products.allCategories }, ...pos.topCategories].map(
              (category) => (
                <button
                  key={category.id ?? 'all'}
                  type="button"
                  aria-pressed={pos.categoryId === category.id}
                  onClick={() => pos.chooseCategory(category.id)}
                  className={cn(
                    'type-label h-11 rounded-md border px-4 transition-colors duration-[120ms] ease-brand',
                    pos.categoryId === category.id
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-border-strong bg-bg text-ink hover:bg-surface'
                  )}
                >
                  {category.name}
                </button>
              )
            )}
          </div>
        )}

        {pos.error && <Alert>{pos.error}</Alert>}
        {pos.notice && <Alert tone="success">{pos.notice}</Alert>}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {pos.products?.length === 0 && (
            <p className="type-body py-12 text-center text-ink-muted">{t.pos.noProducts}</p>
          )}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
            {pos.products?.map((product) => {
              const soldOut = product.trackStock && product.quantity <= 0
              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={soldOut}
                  onClick={() => pos.pickProduct(product)}
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
            <Button variant="ghost" size="sm" onClick={pos.openHeld}>
              {t.pos.heldCount(pos.heldCount)}
            </Button>
            <IconButton
              icon={X}
              label={t.pos.clear}
              disabled={cart.lines.length === 0}
              onClick={pos.clearCart}
            />
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5">
          {pos.lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 py-10 text-center text-ink-muted">
              <ShoppingCart aria-hidden className="size-10" />
              <p className="type-body-sm">{t.pos.emptyCart}</p>
            </div>
          ) : (
            <ul>
              {pos.lines.map(({ line, step, max, atMax, noteOptions, total }) => (
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
                      max={line.product.trackStock ? max : undefined}
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
                      {money(total)}
                    </span>
                  </div>
                  {(noteOptions.length > 0 || line.note !== '') && (
                    <button
                      type="button"
                      onClick={() => pos.openNote(line.id)}
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
              ))}
            </ul>
          )}
        </div>

        <footer className="space-y-3 border-t border-border px-5 py-4">
          {pos.orderTypes && (
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
              {pos.customers.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            {pos.customer && pos.customer.balance > 0 && (
              <span className="type-caption block text-warning">
                {t.pos.customerDebt(money(pos.customer.balance))}
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
            {pos.taxRate > 0 && (
              <div className="flex justify-between">
                <dt className="text-ink-muted">{t.pos.tax(pos.taxRate)}</dt>
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
              disabled={!pos.canCheckout}
              onClick={pos.hold}
            >
              {t.pos.hold}
            </Button>
            <Button className="flex-1" disabled={!pos.canCheckout} onClick={pos.openPayment}>
              {t.pos.pay} — {money(totals.total)}
            </Button>
          </div>
        </footer>
      </aside>

      {pos.dialog === 'payment' && (
        <PaymentModal
          cart={pos.cartPayload()}
          total={totals.total}
          customer={pos.customer}
          onCompleted={() => cart.clear()}
          onClose={pos.afterSale}
        />
      )}
      {pos.noteLine && (
        <LineNoteModal
          line={pos.noteLine}
          options={pos.noteLineOptions}
          onApply={(note, count) => {
            if (pos.noteLine) cart.setLineNote(pos.noteLine.id, note, count)
          }}
          onClose={pos.closeNote}
        />
      )}
      {pos.dialog === 'held' && (
        <HeldSalesModal
          cartHasItems={cart.lines.length > 0}
          onResumed={pos.resumeHeld}
          onClose={pos.afterSale}
        />
      )}
    </div>
  )
}
