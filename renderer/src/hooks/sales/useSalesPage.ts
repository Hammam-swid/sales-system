import { useCallback, useEffect, useRef, useState } from 'react'
import type { ListSalesResponse, SaleStatusFilter } from '../../../../shared/sales'
import { api, errorText } from '../../lib/api'
import { useCurrency } from '../../store/settings'

const PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 250

export function useSalesPage() {
  const currency = useCurrency()
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<SaleStatusFilter>('all')
  const [page, setPage] = useState(1)
  const [data, setData] = useState<ListSalesResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
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
    const result = await api('sales:list', { search, status, page, pageSize: PAGE_SIZE })
    if (current !== requestId.current) return
    if (result.ok) {
      setData(result.data)
      setError(null)
    } else {
      setError(errorText(result))
    }
  }, [search, status, page])

  useEffect(() => {
    void load()
  }, [load])

  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const changeStatus = (value: SaleStatusFilter) => {
    setStatus(value)
    setPage(1)
  }

  return {
    currency,
    searchInput,
    setSearchInput,
    status,
    changeStatus,
    data,
    error,
    total,
    page,
    pageCount,
    // The rows shown on this page, counted from 1.
    rangeFrom: (page - 1) * PAGE_SIZE + 1,
    rangeTo: Math.min(page * PAGE_SIZE, total),
    previousPage: () => setPage((value) => value - 1),
    nextPage: () => setPage((value) => value + 1),
    openId,
    openSale: setOpenId,
    closeSale: () => setOpenId(null),
    // A return changes the invoice's status and totals in the list.
    reload: load
  }
}
