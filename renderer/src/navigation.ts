import {
  ChartColumn,
  ClipboardList,
  House,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  Truck,
  UserCog,
  Users,
  Wallet,
  type LucideIcon
} from 'lucide-react'
import type { Permission } from '../../shared/permissions'
import { t } from './i18n/ar'

export interface NavItem {
  path: string
  label: string
  icon: LucideIcon
  // Omit for sections every signed-in user may open.
  permission?: Permission
}

// One list drives the sidebar, the home shortcuts and the route guards.
export const NAV_ITEMS: NavItem[] = [
  { path: '/', label: t.nav.home, icon: House },
  { path: '/pos', label: t.nav.pos, icon: ShoppingCart, permission: 'pos.sell' },
  { path: '/products', label: t.nav.products, icon: Package, permission: 'products.view' },
  { path: '/sales', label: t.nav.sales, icon: Receipt, permission: 'sales.view' },
  { path: '/customers', label: t.nav.customers, icon: Users, permission: 'customers.view' },
  { path: '/suppliers', label: t.nav.suppliers, icon: Truck, permission: 'suppliers.manage' },
  { path: '/purchases', label: t.nav.purchases, icon: ClipboardList, permission: 'purchases.manage' },
  { path: '/expenses', label: t.nav.expenses, icon: Wallet, permission: 'expenses.manage' },
  { path: '/reports', label: t.nav.reports, icon: ChartColumn, permission: 'reports.view' },
  { path: '/users', label: t.nav.users, icon: UserCog, permission: 'users.manage' },
  { path: '/settings', label: t.nav.settings, icon: Settings, permission: 'settings.manage' }
]

// Sections that have a real screen so far; the rest show a "coming soon" page.
export const BUILT_PATHS: readonly string[] = [
  '/',
  '/pos',
  '/products',
  '/sales',
  '/customers',
  '/suppliers',
  '/purchases',
  '/expenses',
  '/reports',
  '/users'
]
