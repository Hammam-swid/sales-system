import { useCallback, useEffect, useRef, useState } from 'react'
import type { ListPurchasesResponse } from '../../../../shared/parties'
import { t } from '../../i18n'
import { api, errorText } from '../../lib/api'
import { useCurrency } from '../../store/settings'

export const PURCHASES_PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 250

export function usePurchasesPage() {
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
    const result = await api('purchases:list', { search, page, pageSize: PURCHASES_PAGE_SIZE })
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
  const pageCount = Math.max(1, Math.ceil(total / PURCHASES_PAGE_SIZE))

  const saved = () => {
    setCreating(false)
    setNotice(t.purchases.saved)
    setPage(1)
    void load()
  }

  return {
    currency,
    searchInput,
    setSearchInput,
    data,
    error,
    notice,
    total,
    page,
    pageCount,
    // More than one page of purchases exists.
    paged: total > PURCHASES_PAGE_SIZE,
    // The rows shown on this page, counted from 1.
    rangeFrom: (page - 1) * PURCHASES_PAGE_SIZE + 1,
    rangeTo: Math.min(page * PURCHASES_PAGE_SIZE, total),
    previousPage: () => setPage((value) => value - 1),
    nextPage: () => setPage((value) => value + 1),
    creating,
    startCreating: () => setCreating(true),
    stopCreating: () => setCreating(false),
    saved,
    openId,
    openPurchase: setOpenId,
    closePurchase: () => setOpenId(null)
  }
}
