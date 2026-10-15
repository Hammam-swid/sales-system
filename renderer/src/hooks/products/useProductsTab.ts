import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  ListProductsResponse,
  ProductDto,
  ProductStatusFilter
} from '../../../../shared/catalog'
import { EXPIRY_WARNING_DAYS, localDate } from '../../../../shared/store'
import { t } from '../../i18n'
import { api, errorText } from '../../lib/api'
import { useCurrency, useFeature } from '../../store/settings'

export const PRODUCTS_PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 250

export type ProductsDialog =
  | { kind: 'create' }
  | { kind: 'edit'; product: ProductDto }
  | { kind: 'stock'; product: ProductDto }
  | { kind: 'movements'; product: ProductDto }
  | { kind: 'delete'; product: ProductDto }
  | null

export type ExpiryState = 'expired' | 'soon' | null

interface Options {
  canManage: boolean
  canAdjustStock: boolean
  onNotice: (message: string | null) => void
  onCatalogChanged: () => void
}

export function useProductsTab({ canManage, canAdjustStock, onNotice, onCatalogChanged }: Options) {
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
  const [dialog, setDialog] = useState<ProductsDialog>(null)
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
      pageSize: PRODUCTS_PAGE_SIZE
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

  // Every filter change starts again from the first page.
  const searchNow = () => {
    setSearch(searchInput.trim())
    setPage(1)
  }
  const changeCategory = (id: number | null) => {
    setCategoryId(id)
    setPage(1)
  }
  const changeStatus = (value: ProductStatusFilter) => {
    setStatus(value)
    setPage(1)
  }
  const toggleLowStock = () => {
    setLowStockOnly((value) => !value)
    setPage(1)
  }
  const toggleExpiring = () => {
    setExpiringOnly((value) => !value)
    setPage(1)
  }

  const showActions = canManage || canAdjustStock
  const columnCount = 6 + (canManage ? 1 : 0) + (expiryDates ? 1 : 0) + (showActions ? 1 : 0)
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PRODUCTS_PAGE_SIZE))
  const today = localDate()
  const expiryLimit = localDate(EXPIRY_WARNING_DAYS)

  const expiryState = (product: ProductDto): ExpiryState => {
    if (product.expiryDate === null) return null
    if (product.expiryDate < today) return 'expired'
    return product.expiryDate <= expiryLimit ? 'soon' : null
  }

  return {
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
    lowStockCount: data?.lowStockCount ?? 0,
    expiryDates,
    expiringOnly,
    toggleExpiring,
    expiringCount: data?.expiringCount ?? 0,
    expiryState,
    data,
    error,
    showActions,
    columnCount,
    total,
    page,
    pageCount,
    // The rows shown on this page, counted from 1.
    rangeFrom: (page - 1) * PRODUCTS_PAGE_SIZE + 1,
    rangeTo: Math.min(page * PRODUCTS_PAGE_SIZE, total),
    previousPage: () => setPage((value) => value - 1),
    nextPage: () => setPage((value) => value + 1),
    dialog,
    openDialog: setDialog,
    closeDialog: () => setDialog(null),
    finish,
    removeProduct
  }
}
