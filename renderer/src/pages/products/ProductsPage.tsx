import { Alert } from '../../components/ui/Alert'
import { Tabs } from '../../components/ui/Tabs'
import { useProductsPage } from '../../hooks/products/useProductsPage'
import { t } from '../../i18n'
import { CategoriesTab } from './CategoriesTab'
import { ProductsTab } from './ProductsTab'

export function ProductsPage() {
  const {
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
  } = useProductsPage()

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
          onChange={changeTab}
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
