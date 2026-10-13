import { AuditLog } from './AuditLog'
import { Category } from './Category'
import { Customer } from './Customer'
import { Expense } from './Expense'
import { ExpenseCategory } from './ExpenseCategory'
import { InventoryTransaction } from './InventoryTransaction'
import { Product } from './Product'
import { Purchase } from './Purchase'
import { PurchaseItem } from './PurchaseItem'
import { Sale } from './Sale'
import { SaleItem } from './SaleItem'
import { Setting } from './Setting'
import { Supplier } from './Supplier'
import { User } from './User'

export {
  AuditLog,
  Category,
  Customer,
  Expense,
  ExpenseCategory,
  InventoryTransaction,
  Product,
  Purchase,
  PurchaseItem,
  Sale,
  SaleItem,
  Setting,
  Supplier,
  User
}

// Listed explicitly (no glob paths) so entities survive bundling and asar packaging.
export const entities = [
  User,
  Category,
  Supplier,
  Customer,
  Product,
  InventoryTransaction,
  Sale,
  SaleItem,
  Purchase,
  PurchaseItem,
  ExpenseCategory,
  Expense,
  AuditLog,
  Setting
]
