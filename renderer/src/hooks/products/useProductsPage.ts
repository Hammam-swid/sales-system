import { useCallback, useEffect, useState } from 'react'
import type { CategoryDto } from '../../../../shared/catalog'
import { t } from '../../i18n'
import { api, errorText } from '../../lib/api'
import { useCan } from '../../store/auth'

export type ProductsTabId = 'products' | 'categories'

export function useProductsPage() {
  const canManage = useCan('products.manage')
  const canAdjustStock = useCan('inventory.adjust')
  const [tab, setTab] = useState<ProductsTabId>('products')
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadCategories = useCallback(async () => {
    const result = await api('categories:list')
    if (result.ok) setCategories(result.data)
    else setError(errorText(result))
  }, [])

  useEffect(() => {
    void loadCategories()
  }, [loadCategories])

  const tabs = [
    { id: 'products' as const, label: t.products.tabProducts },
    // Cashiers only browse products; category management is hidden from them.
    ...(canManage ? [{ id: 'categories' as const, label: t.products.tabCategories }] : [])
  ]

  const changeTab = (id: ProductsTabId) => {
    setTab(id)
    setNotice(null)
  }

  return {
    canManage,
    canAdjustStock,
    tab,
    tabs,
    changeTab,
    categories,
    loadCategories,
    notice,
    setNotice,
    error
  }
}
