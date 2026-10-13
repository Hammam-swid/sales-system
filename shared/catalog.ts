// Types for the products, categories and inventory module.

export const PRODUCT_UNITS = ['piece', 'box', 'pack', 'kg', 'g', 'liter', 'meter'] as const
export type ProductUnit = (typeof PRODUCT_UNITS)[number]

export interface CategoryDto {
  id: number
  name: string
  parentId: number | null
  // Products directly in this category (not counting sub-categories).
  productCount: number
}

export interface SaveCategoryRequest {
  // Omit to create.
  id?: number
  name: string
  parentId: number | null
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

export interface AppSettings {
  storeName: string
  currency: string
  // Percentage, e.g. 15 for 15%.
  taxRate: number
  language: string
}
