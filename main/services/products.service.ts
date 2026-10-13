import type { EntityManager } from 'typeorm'
import {
  PRODUCT_UNITS,
  type DeleteProductResponse,
  type ListProductsResponse,
  type ProductDto,
  type StockMovementDto
} from '../../shared/catalog'
import { can } from '../../shared/permissions'
import type { SessionUser } from '../auth/session'
import { getDataSource } from '../database/data-source'
import {
  Category,
  InventoryTransaction,
  Product,
  PurchaseItem,
  SaleItem
} from '../database/entities'
import { AppError } from '../errors'
import { recordAudit } from './audit.service'
import {
  asAmount,
  asBoolean,
  asId,
  asObject,
  asOneOf,
  asOptionalId,
  asOptionalText,
  asText,
  roundTo
} from './validation'

const PRICE_DECIMALS = 2
const QUANTITY_DECIMALS = 3
const MAX_PAGE_SIZE = 100
const OPENING_BALANCE_REASON = 'رصيد افتتاحي'

function isLowStock(product: Product): boolean {
  return product.isActive && product.quantity <= product.minQuantity
}

// Cost prices are hidden from users who cannot manage products (cashiers).
function toProductDto(product: Product, actor: SessionUser): ProductDto {
  return {
    id: product.id,
    name: product.name,
    barcode: product.barcode,
    categoryId: product.categoryId,
    categoryName: product.category?.name ?? null,
    unit: product.unit,
    purchasePrice: can(actor.role, 'products.manage') ? product.purchasePrice : null,
    salePrice: product.salePrice,
    quantity: product.quantity,
    minQuantity: product.minQuantity,
    isLowStock: isLowStock(product),
    isActive: product.isActive,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString()
  }
}

async function loadProduct(manager: EntityManager, id: number): Promise<Product> {
  const product = await manager
    .getRepository(Product)
    .findOne({ where: { id }, relations: { category: true } })
  if (!product) throw new AppError('NOT_FOUND')
  return product
}

// Makes user input safe inside a LIKE pattern.
function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`)
}

export async function listProducts(
  payload: unknown,
  actor: SessionUser
): Promise<ListProductsResponse> {
  const input = payload === undefined || payload === null ? {} : asObject(payload)
  const search = asOptionalText(input.search, 'search', 100)
  const categoryId = asOptionalId(input.categoryId, 'categoryId')
  const status = asOneOf(input.status ?? 'active', ['active', 'inactive', 'all'] as const, 'status')
  const lowStockOnly = input.lowStockOnly === true
  const page = Math.max(1, Math.floor(Number(input.page) || 1))
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(Number(input.pageSize) || 25)))

  const repository = getDataSource().getRepository(Product)
  const query = repository
    .createQueryBuilder('product')
    .leftJoinAndSelect('product.category', 'category')

  if (search) {
    // Matches part of the name, or the start of the barcode (what a scanner types).
    query.andWhere(
      "(product.name LIKE :name ESCAPE '\\' OR product.barcode LIKE :barcode ESCAPE '\\')",
      { name: `%${escapeLike(search)}%`, barcode: `${escapeLike(search)}%` }
    )
  }
  if (categoryId !== null) {
    // Choosing a top-level category also shows its sub-categories' products.
    query.andWhere('(product.categoryId = :categoryId OR category.parentId = :categoryId)', {
      categoryId
    })
  }
  if (status !== 'all') {
    query.andWhere('product.isActive = :isActive', { isActive: status === 'active' })
  }
  if (lowStockOnly) {
    query.andWhere('product.isActive = :active AND product.quantity <= product.minQuantity', {
      active: true
    })
  }

  const [products, total] = await query
    .orderBy('product.name', 'ASC')
    .addOrderBy('product.id', 'ASC')
    .offset((page - 1) * pageSize)
    .limit(pageSize)
    .getManyAndCount()

  const lowStockCount = await repository
    .createQueryBuilder('product')
    .where('product.isActive = :active AND product.quantity <= product.minQuantity', {
      active: true
    })
    .getCount()

  return {
    items: products.map((product) => toProductDto(product, actor)),
    total,
    page,
    pageSize,
    lowStockCount
  }
}

export async function saveProduct(payload: unknown, actor: SessionUser): Promise<ProductDto> {
  const input = asObject(payload)
  const id = asOptionalId(input.id, 'id')
  const fields = {
    name: asText(input.name, 'name', 120),
    barcode: asOptionalText(input.barcode, 'barcode', 64),
    categoryId: asOptionalId(input.categoryId, 'categoryId'),
    unit: asOneOf(input.unit, PRODUCT_UNITS, 'unit'),
    purchasePrice: asAmount(input.purchasePrice, 'purchasePrice', PRICE_DECIMALS),
    salePrice: asAmount(input.salePrice, 'salePrice', PRICE_DECIMALS),
    minQuantity: asAmount(input.minQuantity, 'minQuantity', QUANTITY_DECIMALS),
    isActive: asBoolean(input.isActive, 'isActive')
  }

  return getDataSource().transaction(async (manager) => {
    const repository = manager.getRepository(Product)

    if (fields.categoryId !== null) {
      const categoryExists = await manager
        .getRepository(Category)
        .existsBy({ id: fields.categoryId })
      if (!categoryExists) throw new AppError('NOT_FOUND', 'category')
    }
    if (fields.barcode !== null) {
      const owner = await repository.findOneBy({ barcode: fields.barcode })
      if (owner && owner.id !== id) throw new AppError('BARCODE_TAKEN')
    }

    if (id === null) {
      const quantity = asAmount(input.quantity ?? 0, 'quantity', QUANTITY_DECIMALS)
      const product = await repository.save(repository.create({ ...fields, quantity }))
      if (quantity > 0) {
        await manager.getRepository(InventoryTransaction).save(
          manager.getRepository(InventoryTransaction).create({
            productId: product.id,
            type: 'in',
            quantity,
            reason: OPENING_BALANCE_REASON,
            referenceType: 'manual',
            userId: actor.id
          })
        )
      }
      return toProductDto(await loadProduct(manager, product.id), actor)
    }

    const product = await repository.findOneBy({ id })
    if (!product) throw new AppError('NOT_FOUND')

    const priceChanged =
      product.purchasePrice !== fields.purchasePrice || product.salePrice !== fields.salePrice
    if (priceChanged) {
      await recordAudit(
        {
          userId: actor.id,
          action: 'edit_price',
          entityType: 'product',
          entityId: product.id,
          details: {
            name: product.name,
            before: { purchasePrice: product.purchasePrice, salePrice: product.salePrice },
            after: { purchasePrice: fields.purchasePrice, salePrice: fields.salePrice }
          }
        },
        manager
      )
    }

    // Stock is never edited here: it only changes through recorded movements.
    await repository.save(Object.assign(product, fields))
    return toProductDto(await loadProduct(manager, product.id), actor)
  })
}

// Deletes a product that was never sold or purchased; otherwise archives it,
// because invoices must keep pointing at the product they were issued for.
export async function deleteProduct(
  payload: unknown,
  actor: SessionUser
): Promise<DeleteProductResponse> {
  const id = asId(asObject(payload).id)

  return getDataSource().transaction(async (manager) => {
    const repository = manager.getRepository(Product)
    const product = await repository.findOneBy({ id })
    if (!product) throw new AppError('NOT_FOUND')

    const hasHistory =
      (await manager.getRepository(SaleItem).existsBy({ productId: id })) ||
      (await manager.getRepository(PurchaseItem).existsBy({ productId: id }))

    if (hasHistory) {
      product.isActive = false
      await repository.save(product)
    } else {
      await manager.getRepository(InventoryTransaction).delete({ productId: id })
      await repository.delete({ id })
    }

    const outcome = hasHistory ? 'archived' : 'deleted'
    await recordAudit(
      {
        userId: actor.id,
        action: hasHistory ? 'archive_product' : 'delete_product',
        entityType: 'product',
        entityId: id,
        details: { name: product.name, barcode: product.barcode, quantity: product.quantity }
      },
      manager
    )
    return { outcome }
  })
}

export async function adjustStock(payload: unknown, actor: SessionUser): Promise<ProductDto> {
  const input = asObject(payload)
  const productId = asId(input.productId, 'productId')
  const type = asOneOf(input.type, ['in', 'out', 'adjustment'] as const, 'type')
  const quantity = asAmount(input.quantity, 'quantity', QUANTITY_DECIMALS)
  const reason = asText(input.reason, 'reason', 200)
  if (type !== 'adjustment' && quantity === 0) throw new AppError('VALIDATION', 'quantity')

  return getDataSource().transaction(async (manager) => {
    const repository = manager.getRepository(Product)
    const product = await repository.findOneBy({ id: productId })
    if (!product) throw new AppError('NOT_FOUND')

    let newQuantity: number
    let recorded: number
    if (type === 'in') {
      newQuantity = product.quantity + quantity
      recorded = quantity
    } else if (type === 'out') {
      if (quantity > product.quantity) throw new AppError('INSUFFICIENT_STOCK')
      newQuantity = product.quantity - quantity
      recorded = quantity
    } else {
      // The user entered the counted quantity; the movement stores the difference.
      newQuantity = quantity
      recorded = roundTo(quantity - product.quantity, QUANTITY_DECIMALS)
    }

    product.quantity = roundTo(newQuantity, QUANTITY_DECIMALS)
    await repository.save(product)
    await manager.getRepository(InventoryTransaction).save(
      manager.getRepository(InventoryTransaction).create({
        productId,
        type,
        quantity: recorded,
        reason,
        referenceType: 'manual',
        userId: actor.id
      })
    )
    return toProductDto(await loadProduct(manager, productId), actor)
  })
}

export async function listMovements(payload: unknown): Promise<StockMovementDto[]> {
  const productId = asId(asObject(payload).productId, 'productId')

  const movements = await getDataSource()
    .getRepository(InventoryTransaction)
    .find({
      where: { productId },
      relations: { user: true },
      order: { id: 'DESC' },
      take: 200
    })

  return movements.map((movement) => ({
    id: movement.id,
    type: movement.type,
    quantity: movement.quantity,
    reason: movement.reason,
    referenceType: movement.referenceType,
    userName: movement.user?.fullName ?? null,
    createdAt: movement.createdAt.toISOString()
  }))
}
