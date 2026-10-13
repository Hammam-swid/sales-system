// Single source of truth for role-based access.
// The main process enforces it on every IPC call; the renderer uses it only to hide UI.

export type UserRole = 'owner' | 'manager' | 'cashier'

export const USER_ROLES: readonly UserRole[] = ['owner', 'manager', 'cashier']

export type Permission =
  | 'pos.sell'
  | 'products.view'
  | 'products.manage'
  | 'inventory.adjust'
  | 'sales.view'
  | 'sales.return'
  | 'customers.view'
  | 'customers.manage'
  | 'suppliers.manage'
  | 'purchases.manage'
  | 'expenses.manage'
  | 'reports.view'
  | 'users.manage'
  | 'settings.manage'
  | 'audit.view'

const ALL_PERMISSIONS: readonly Permission[] = [
  'pos.sell',
  'products.view',
  'products.manage',
  'inventory.adjust',
  'sales.view',
  'sales.return',
  'customers.view',
  'customers.manage',
  'suppliers.manage',
  'purchases.manage',
  'expenses.manage',
  'reports.view',
  'users.manage',
  'settings.manage',
  'audit.view'
]

const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  owner: ALL_PERMISSIONS,
  manager: ALL_PERMISSIONS,
  // Sales only, plus the read access the checkout screen needs.
  cashier: ['pos.sell', 'products.view', 'sales.view', 'customers.view']
}

export function can(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission)
}
