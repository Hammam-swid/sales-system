import { useCallback, useEffect, useState } from 'react'
import type { CategoryDto } from '../../../../shared/catalog'
import { Alert } from '../../components/ui/Alert'
import { Tabs } from '../../components/ui/Tabs'
import { t } from '../../i18n/ar'
import { api, errorText } from '../../lib/api'
import { useCan } from '../../store/auth'
import { CategoriesTab } from './CategoriesTab'
import { ProductsTab } from './ProductsTab'

type TabId = 'products' | 'categories'

export function ProductsPage() {
  const canManage = useCan('products.manage')
  const canAdjustStock = useCan('inventory.adjust')
  const [tab, setTab] = useState<TabId>('products')
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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="space-y-1">
        <h2 className="type-h2">{t.products.title}</h2>
        <p className="type-body text-ink-muted">{t.products.subtitle}</p>
      </header>

      {tabs.length > 1 && (
        <Tabs
          tabs={tabs}
          active={tab}
          onChange={(id) => {
            setTab(id)
            setNotice(null)
          }}
        />
      )}

      {notice && <Alert tone="success">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}

      {tab === 'products' ? (
        <ProductsTab
          categories={categories}
          canManage={canManage}
          canAdjustStock={canAdjustStock}
          onNotice={setNotice}
          // Product counts per category change when products are added, moved or removed.
          onCatalogChanged={loadCategories}
        />
      ) : (
        <CategoriesTab categories={categories} onNotice={setNotice} onChanged={loadCategories} />
      )}
    </div>
  )
}
