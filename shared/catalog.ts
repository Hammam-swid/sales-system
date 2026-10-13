// Types for the products, categories and inventory module.

export const PRODUCT_UNITS = ['piece', 'box', 'pack', 'kg', 'g', 'liter', 'meter'] as const
export type ProductUnit = (typeof PRODUCT_UNITS)[number]

export interface CategoryDto {
  id: number
  name: string
  parentId: number | null
  // Products directly in this category (not counting sub-categories).
  productCount: number
  // Ready-made line notes the cashier picks from when selling this category's products.
  noteOptions: string[]
}

export interface SaveCategoryRequest {
  // Omit to create.
  id?: number
  name: string
  parentId: number | null
  // Omit to leave the existing options as they are.
  noteOptions?: string[]
}

export const MAX_NOTE_OPTIONS = 20
export const MAX_NOTE_OPTION_LENGTH = 30
// Joins the options picked for one line into its note.
export const NOTE_SEPARATOR = '، '

// The options offered for a product: its own category's, or failing that the parent's.
export function noteOptionsFor(categories: CategoryDto[], categoryId: number | null): string[] {
  const category = categories.find((candidate) => candidate.id === categoryId)
  if (!category) return []
  if (category.noteOptions.length > 0) return category.noteOptions
  return categories.find((candidate) => candidate.id === category.parentId)?.noteOptions ?? []
}

export interface ProductDto {
  id: number
  name: string
  barcode: string | null
  categoryId: number | null
  categoryName: string | null
  unit: string
  // null when the signed-in user may not see cost prices.
  purchasePrice: number | null
  salePrice: number
  quantity: number
  minQuantity: number
  isLowStock: boolean
  // YYYY-MM-DD, or null when the product does not expire.
  expiryDate: string | null
  // 0 means no warranty.
  warrantyMonths: number
  // false for items sold without a stock quantity.
  trackStock: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export type ProductStatusFilter = 'active' | 'inactive' | 'all'

export interface ListProductsRequest {
  search?: string
  categoryId?: number | null
  status?: ProductStatusFilter
  lowStockOnly?: boolean
  // Active products already expired or expiring within EXPIRY_WARNING_DAYS.
  expiringOnly?: boolean
  // Leaves out items sold without stock (they cannot be purchased or counted).
  trackedOnly?: boolean
  page?: number
  pageSize?: number
}

export interface ListProductsResponse {
  items: ProductDto[]
  total: number
  page: number
  pageSize: number
  // Active products at or below their reorder threshold, regardless of the current filter.
  lowStockCount: number
  // Active products already expired or expiring soon, regardless of the current filter.
  expiringCount: number
}

export interface SaveProductRequest {
  // Omit to create.
  id?: number
  name: string
  barcode: string | null
  categoryId: number | null
  unit: ProductUnit
  purchasePrice: number
  salePrice: number
  minQuantity: number
  expiryDate: string | null
  warrantyMonths: number
  trackStock: boolean
  isActive: boolean
  // Opening stock; only read when creating. Later changes go through stock movements.
  quantity?: number
}

export interface DeleteProductResponse {
  // A product with sales or purchase history is archived instead of deleted.
  outcome: 'deleted' | 'archived'
}

export type StockMovementType = 'in' | 'out' | 'adjustment'

export interface AdjustStockRequest {
  productId: number
  type: StockMovementType
  // 'in' / 'out': the amount moved. 'adjustment': the counted quantity now on the shelf.
  quantity: number
  reason: string
}

export interface StockMovementDto {
  id: number
  type: StockMovementType
  // Positive for 'in' and 'out'; signed difference for 'adjustment'.
  quantity: number
  reason: string | null
  referenceType: string | null
  userName: string | null
  createdAt: string
}
