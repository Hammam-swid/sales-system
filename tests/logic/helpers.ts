import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, expect } from 'vitest'
import type { ProductDto, SaveProductRequest } from '../../shared/catalog'
import type { ErrorCode } from '../../shared/ipc'
import type { StoreType } from '../../shared/store'
import type { SessionUser } from '../../main/auth/session'
import { closeDatabase, getDataSource, initDatabase } from '../../main/database/data-source'
import { AppError } from '../../main/errors'
import { saveCategory } from '../../main/services/categories.service'
import { saveCustomer } from '../../main/services/customers.service'
import { saveProduct } from '../../main/services/products.service'
import { createFirstOwner } from '../../main/services/setup.service'
import { saveSupplier } from '../../main/services/suppliers.service'
import { createUser } from '../../main/services/users.service'
import { userData } from './setup'

export interface TestShop {
  owner: SessionUser
  cashier: SessionUser
}

// A brand-new database, migrated and set up as a shop of the given type.
export async function freshShop(storeType: StoreType = 'general'): Promise<TestShop> {
  await closeDatabase()
  for (const suffix of ['', '-wal', '-shm']) rmSync(join(userData, `pos.db${suffix}`), { force: true })
  await initDatabase()

  const ownerDto = await createFirstOwner({
    fullName: 'Owner',
    username: 'owner',
    password: 'owner123',
    storeName: 'Test shop',
    language: 'en',
    storeType
  })
  const owner: SessionUser = { id: ownerDto.id, role: 'owner' }
  const cashierDto = await createUser(
    { fullName: 'Cashier', username: 'cashier', password: 'cashier123', role: 'cashier' },
    owner
  )
  return { owner, cashier: { id: cashierDto.id, role: 'cashier' } }
}

afterEach(async () => {
  await closeDatabase()
})

let barcodeCounter = 1000

export async function makeProduct(
  actor: SessionUser,
  overrides: Partial<SaveProductRequest> = {}
): Promise<ProductDto> {
  return saveProduct(
    {
      name: `Product ${barcodeCounter}`,
      barcode: String(barcodeCounter++),
      categoryId: null,
      unit: 'piece',
      purchasePrice: 5,
      salePrice: 10,
      minQuantity: 2,
      expiryDate: null,
      warrantyMonths: 0,
      trackStock: true,
      isActive: true,
      quantity: 20,
      ...overrides
    },
    actor
  )
}

export async function makeCategory(name: string, parentId: number | null = null, noteOptions?: string[]) {
  return saveCategory({ name, parentId, noteOptions })
}

export async function makeCustomer(name = 'Customer') {
  return saveCustomer({ name, phone: null, address: null })
}

export async function makeSupplier(name = 'Supplier') {
  return saveSupplier({ name, phone: null, address: null })
}

// Fails unless the promise rejects with an AppError carrying this code.
export async function expectError(promise: Promise<unknown>, code: ErrorCode): Promise<void> {
  const error = await promise.then(
    () => null,
    (caught: unknown) => caught
  )
  expect(error, `expected ${code}`).toBeInstanceOf(AppError)
  expect((error as AppError).code).toBe(code)
}

export function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
  return getDataSource().query(sql, params)
}

export async function stockOf(productId: number): Promise<number> {
  const [row] = await query<{ quantity: number }>('SELECT quantity FROM products WHERE id = ?', [
    productId
  ])
  return row.quantity
}

export async function setSetting(key: string, value: string): Promise<void> {
  await query('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value])
}

// One line of a cart, as the checkout screen sends it.
export function line(productId: number, quantity: number, extra: { discount?: number; note?: string | null } = {}) {
  return { productId, quantity, discount: extra.discount ?? 0, note: extra.note ?? null }
}
