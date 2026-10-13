import { useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/layout/AppShell'
import { RequirePermission } from './components/RequirePermission'
import { t } from './i18n/ar'
import { BUILT_PATHS, NAV_ITEMS } from './navigation'
import { ComingSoonPage } from './pages/ComingSoonPage'
import { ExpensesPage } from './pages/expenses/ExpensesPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { PartiesPage } from './pages/parties/PartiesPage'
import { CUSTOMER_KIND, SUPPLIER_KIND } from './pages/parties/partyKinds'
import { PosPage } from './pages/pos/PosPage'
import { PurchasesPage } from './pages/purchases/PurchasesPage'
import { ProductsPage } from './pages/products/ProductsPage'
import { SalesPage } from './pages/sales/SalesPage'
import { UsersPage } from './pages/UsersPage'
import { useAuthStore, useCan } from './store/auth'

// Cashiers may browse customers; only managers can edit them or record payments.
function CustomersPage() {
  return <PartiesPage kind={CUSTOMER_KIND} canManage={useCan('customers.manage')} />
}

export default function App() {
  const status = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const init = useAuthStore((state) => state.init)

  useEffect(() => {
    void init()
  }, [init])

  if (status === 'loading') {
    return (
      <div className="type-body flex h-full items-center justify-center bg-bg text-ink-muted">
        {t.common.loading}
      </div>
    )
  }

  if (!user) return <LoginPage />

  // HashRouter, because the packaged app is loaded from a file:// URL.
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route
            path="pos"
            element={
              <RequirePermission permission="pos.sell">
                <PosPage />
              </RequirePermission>
            }
          />
          <Route
            path="sales"
            element={
              <RequirePermission permission="sales.view">
                <SalesPage />
              </RequirePermission>
            }
          />
          <Route
            path="customers"
            element={
              <RequirePermission permission="customers.view">
                <CustomersPage />
              </RequirePermission>
            }
          />
          <Route
            path="suppliers"
            element={
              <RequirePermission permission="suppliers.manage">
                <PartiesPage kind={SUPPLIER_KIND} canManage />
              </RequirePermission>
            }
          />
          <Route
            path="purchases"
            element={
              <RequirePermission permission="purchases.manage">
                <PurchasesPage />
              </RequirePermission>
            }
          />
          <Route
            path="expenses"
            element={
              <RequirePermission permission="expenses.manage">
                <ExpensesPage />
              </RequirePermission>
            }
          />
          <Route
            path="products"
            element={
              <RequirePermission permission="products.view">
                <ProductsPage />
              </RequirePermission>
            }
          />
          <Route
            path="users"
            element={
              <RequirePermission permission="users.manage">
                <UsersPage />
              </RequirePermission>
            }
          />
          {NAV_ITEMS.filter((item) => !BUILT_PATHS.includes(item.path)).map((item) => (
            <Route
              key={item.path}
              path={item.path.slice(1)}
              element={
                item.permission ? (
                  <RequirePermission permission={item.permission}>
                    <ComingSoonPage />
                  </RequirePermission>
                ) : (
                  <ComingSoonPage />
                )
              }
            />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
