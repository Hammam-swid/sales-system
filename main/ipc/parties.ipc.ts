import {
  customerStatement,
  deleteCustomer,
  listCustomers,
  recalculateCustomer,
  recordCustomerPayment,
  saveCustomer
} from '../services/customers.service'
import { createPurchase, getPurchase, listPurchases } from '../services/purchases.service'
import {
  deleteSupplier,
  listSuppliers,
  recalculateSupplier,
  recordSupplierPayment,
  saveSupplier,
  supplierStatement
} from '../services/suppliers.service'
import { handle } from './handle'

export function registerPartiesIpc(): void {
  // The checkout screen needs the customer list, so viewing is open to cashiers.
  handle('customers:list', { permission: 'customers.view' }, (payload) => listCustomers(payload))
  handle('customers:save', { permission: 'customers.manage' }, (payload) => saveCustomer(payload))
  handle('customers:delete', { permission: 'customers.manage' }, (payload) =>
    deleteCustomer(payload)
  )
  handle('customers:statement', { permission: 'customers.manage' }, (payload) =>
    customerStatement(payload)
  )
  handle('customers:pay', { permission: 'customers.manage' }, (payload, user) =>
    recordCustomerPayment(payload, user)
  )
  handle('customers:recalculate', { permission: 'customers.manage' }, (payload, user) =>
    recalculateCustomer(payload, user)
  )

  handle('suppliers:list', { permission: 'suppliers.manage' }, (payload) => listSuppliers(payload))
  handle('suppliers:save', { permission: 'suppliers.manage' }, (payload) => saveSupplier(payload))
  handle('suppliers:delete', { permission: 'suppliers.manage' }, (payload) =>
    deleteSupplier(payload)
  )
  handle('suppliers:statement', { permission: 'suppliers.manage' }, (payload) =>
    supplierStatement(payload)
  )
  handle('suppliers:pay', { permission: 'suppliers.manage' }, (payload, user) =>
    recordSupplierPayment(payload, user)
  )
  handle('suppliers:recalculate', { permission: 'suppliers.manage' }, (payload, user) =>
    recalculateSupplier(payload, user)
  )

  handle('purchases:list', { permission: 'purchases.manage' }, (payload) => listPurchases(payload))
  handle('purchases:get', { permission: 'purchases.manage' }, (payload) => getPurchase(payload))
  handle('purchases:create', { permission: 'purchases.manage' }, (payload, user) =>
    createPurchase(payload, user)
  )
}
