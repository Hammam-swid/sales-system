import { deleteCategory, listCategories, saveCategory } from '../services/categories.service'
import {
  adjustStock,
  deleteProduct,
  listMovements,
  listProducts,
  saveProduct
} from '../services/products.service'
import { handle } from './handle'

export function registerProductsIpc(): void {
  handle('categories:list', { permission: 'products.view' }, () => listCategories())
  handle('categories:save', { permission: 'products.manage' }, (payload) => saveCategory(payload))
  handle('categories:delete', { permission: 'products.manage' }, (payload) =>
    deleteCategory(payload)
  )

  handle('products:list', { permission: 'products.view' }, (payload, user) =>
    listProducts(payload, user)
  )
  handle('products:save', { permission: 'products.manage' }, (payload, user) =>
    saveProduct(payload, user)
  )
  handle('products:delete', { permission: 'products.manage' }, (payload, user) =>
    deleteProduct(payload, user)
  )
  handle('products:adjustStock', { permission: 'inventory.adjust' }, (payload, user) =>
    adjustStock(payload, user)
  )
  handle('products:movements', { permission: 'inventory.adjust' }, (payload) =>
    listMovements(payload)
  )
}
