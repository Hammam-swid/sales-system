import { useCallback, useEffect, useRef, useState } from 'react'
import { Eye, Plus, Search } from 'lucide-react'
import type { ListPurchasesResponse, PurchaseDto } from '../../../../shared/parties'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { IconButton } from '../../components/ui/IconButton'
import { Modal } from '../../components/ui/Modal'
import { t } from '../../i18n'
import { api, errorText } from '../../lib/api'
import { formatDateTime, formatMoney, formatQuantity } from '../../lib/format'
import { useCurrency } from '../../store/settings'
import { unitLabel } from '../products/ProductsTab'
import { PAYMENT_TONE } from '../sales/SalesPage'
import { PurchaseFormModal } from './PurchaseFormModal'

const PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 250

export function PurchasesPage() {
  const currency = useCurrency()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<ListPurchasesResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [openId, setOpenId] = useState<number | null>(null)
  const requestId = useRef(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [searchInput])

  const load = useCallback(async () => {
    const current = ++requestId.current
    const result = await api('purchases:list', { search, page, pageSize: PAGE_SIZE })
    if (current !== requestId.current) return
    if (result.ok) {
      setData(result.data)
      setError(null)
    } else {
      setError(errorText(result))
    }
  }, [search, page])

  useEffect(() => {
    void load()
  }, [load])

  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <h2 className="type-h2">{t.purchases.title}</h2>
        <p className="type-body text-ink-muted">{t.purchases.subtitle}</p>
      </header>

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
            placeholder={t.purchases.searchPlaceholder}
            aria-label={t.purchases.searchPlaceholder}
            className="type-body-sm h-11 w-full rounded-sm border border-border-strong bg-bg ps-10 pe-3 text-ink placeholder:text-ink-muted"
          />
        </div>
        <Button icon={<Plus aria-hidden className="size-4" />} onClick={() => setCreating(true)}>
          {t.purchases.add}
        </Button>
      </div>

      {notice && <Alert tone="success">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}

      <Card className="overflow-x-auto">
        <table className="type-body-sm w-full">
          <thead className="type-label border-b border-border text-ink-muted">
            <tr>
              <th className="px-4 py-3 text-start">{t.purchases.number}</th>
              <th className="px-4 py-3 text-start">{t.sales.date}</th>
              <th className="px-4 py-3 text-start">{t.purchases.supplier}</th>
              <th className="px-4 py-3 text-end">{t.sales.total}</th>
              <th className="px-4 py-3 text-end">{t.sales.paid}</th>
              <th className="px-4 py-3 text-start">{t.sales.payment}</th>
              <th className="px-4 py-3 text-end">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody>
            {data === null && !error && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-muted">
                  {t.common.loading}
                </td>
              </tr>
            )}
            {data?.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-muted">
                  {t.purchases.empty}
                </td>
              </tr>
            )}
            {data?.items.map((purchase) => (
              <tr key={purchase.id} className="border-b border-border last:border-0">
                <td dir="ltr" className="type-label px-4 py-3 text-end text-ink tabular-nums">
                  {purchase.number}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-ink-muted tabular-nums">
                  {formatDateTime(purchase.createdAt)}
                </td>
                <td className="px-4 py-3">{purchase.supplierName ?? '—'}</td>
                <td className="px-4 py-3 text-end font-medium tabular-nums">
                  {formatMoney(purchase.total, currency)}
                </td>
                <td className="px-4 py-3 text-end tabular-nums">
                  {formatMoney(purchase.paidAmount, currency)}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={PAYMENT_TONE[purchase.paymentStatus]}>
                    {t.sales.paymentStatus[purchase.paymentStatus]}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <IconButton
                      icon={Eye}
                      label={t.purchases.view}
                      onClick={() => setOpenId(purchase.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {total > PAGE_SIZE && (
        <div className="flex items-center justify-between">
          <p className="type-body-sm text-ink-muted tabular-nums">
            {t.products.pageInfo((page - 1) * PAGE_SIZE + 1, Math.min(page * PAGE_SIZE, total), total)}
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

      {creating && (
        <PurchaseFormModal
          onClose={() => setCreating(false)}
          onSaved={() => {
            setCreating(false)
            setNotice(t.purchases.saved)
            setPage(1)
            void load()
          }}
        />
      )}
      {openId !== null && <PurchaseDetailModal id={openId} onClose={() => setOpenId(null)} />}
    </div>
  )
}

function PurchaseDetailModal({ id, onClose }: { id: number; onClose: () => void }) {
  const currency = useCurrency()
  const money = (value: number) => formatMoney(value, currency)
  const [purchase, setPurchase] = useState<PurchaseDto | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void api('purchases:get', { id }).then((result) => {
      if (result.ok) setPurchase(result.data)
      else setError(errorText(result))
    })
  }, [id])

  return (
    <Modal
      title={purchase ? t.purchases.detailTitle(purchase.number) : t.purchases.title}
      size="lg"
      onClose={onClose}
    >
      {error && <Alert>{error}</Alert>}
      {!purchase && !error && (
        <p className="type-body-sm py-6 text-center text-ink-muted">{t.common.loading}</p>
      )}
      {purchase && (
        <div className="space-y-5">
          <div className="type-body-sm flex flex-wrap items-center gap-x-6 gap-y-2">
            <span className="text-ink-muted tabular-nums">{formatDateTime(purchase.createdAt)}</span>
            <span>
              <span className="text-ink-muted">{t.purchases.supplier}: </span>
              {purchase.supplierName ?? '—'}
            </span>
            <span>
              <span className="text-ink-muted">{t.purchases.recordedBy}: </span>
              {purchase.userName ?? '—'}
            </span>
            <Badge tone={PAYMENT_TONE[purchase.paymentStatus]}>
              {t.sales.paymentStatus[purchase.paymentStatus]}
            </Badge>
          </div>

          <div className="max-h-[45vh] overflow-y-auto rounded-md border border-border">
            <table className="type-body-sm w-full">
              <thead className="type-label border-b border-border bg-surface text-ink-muted">
                <tr>
                  <th className="px-4 py-2 text-start">{t.sales.item}</th>
                  <th className="px-4 py-2 text-end">{t.sales.quantity}</th>
                  <th className="px-4 py-2 text-end">{t.purchases.unitCost}</th>
                  <th className="px-4 py-2 text-end">{t.sales.lineTotal}</th>
                </tr>
              </thead>
              <tbody>
                {purchase.items.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-2">{item.productName}</td>
                    <td className="px-4 py-2 text-end tabular-nums">
                      {formatQuantity(item.quantity)} {unitLabel(item.unit)}
                    </td>
                    <td className="px-4 py-2 text-end tabular-nums">{money(item.unitCost)}</td>
                    <td className="px-4 py-2 text-end font-medium tabular-nums">
                      {money(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <dl className="type-body-sm ms-auto w-72 space-y-1">
            <div className="flex justify-between">
              <dt className="type-label-strong">{t.sales.total}</dt>
              <dd className="type-label-strong tabular-nums">{money(purchase.total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-muted">{t.sales.paid}</dt>
              <dd className="tabular-nums">{money(purchase.paidAmount)}</dd>
            </div>
            {purchase.total > purchase.paidAmount && (
              <div className="flex justify-between">
                <dt className="text-ink-muted">{t.purchases.owed}</dt>
                <dd className="tabular-nums">{money(purchase.total - purchase.paidAmount)}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </Modal>
  )
}
