import type { EntityManager } from 'typeorm'
import {
  purchaseNumber,
  type ListPurchasesResponse,
  type PurchaseDto,
  type PurchasePaymentStatus,
  type PurchaseSummaryDto
} from '../../shared/parties'
import { roundTo } from '../../shared/sales'
import type { SessionUser } from '../auth/session'
import { getDataSource } from '../database/data-source'
import {
  InventoryTransaction,
  Product,
  Purchase,
  PurchaseItem,
  Supplier
} from '../database/entities'
import { AppError } from '../errors'
import { likePattern } from './party.helpers'
import { asAmount, asId, asObject, asOptionalText } from './validation'

const MAX_LINES = 300
const MAX_PAGE_SIZE = 100

function toSummary(purchase: Purchase): PurchaseSummaryDto {
  return {
    id: purchase.id,
    number: purchaseNumber(purchase.id),
    supplierName: purchase.supplier?.name ?? null,
    userName: purchase.user?.fullName ?? null,
    total: purchase.total,
    paidAmount: purchase.paidAmount,
    paymentStatus: purchase.paymentStatus,
    createdAt: purchase.createdAt.toISOString()
  }
}

async function loadPurchase(manager: EntityManager, id: number): Promise<PurchaseDto> {
  const purchase = await manager.getRepository(Purchase).findOne({
    where: { id },
    relations: { items: { product: true }, supplier: true, user: true }
  })
  if (!purchase) throw new AppError('NOT_FOUND')

  return {
    ...toSummary(purchase),
    items: [...(purchase.items ?? [])]
      .sort((a, b) => a.id - b.id)
      .map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product?.name ?? `#${item.productId}`,
        unit: item.product?.unit ?? '',
        quantity: item.quantity,
        unitCost: item.unitCost,
        total: item.total
      }))
  }
}

export async function listPurchases(payload: unknown): Promise<ListPurchasesResponse> {
  const input = payload === undefined || payload === null ? {} : asObject(payload)
  const search = asOptionalText(input.search, 'search', 100)
  const page = Math.max(1, Math.floor(Number(input.page) || 1))
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(Number(input.pageSize) || 25)))

  const query = getDataSource()
    .getRepository(Purchase)
    .createQueryBuilder('purchase')
    .leftJoinAndSelect('purchase.supplier', 'supplier')
    .leftJoinAndSelect('purchase.user', 'user')
  if (search) {
    query.where("supplier.name LIKE :pattern ESCAPE '\\'", { pattern: likePattern(search) })
  }

  const [purchases, total] = await query
    .orderBy('purchase.id', 'DESC')
    .offset((page - 1) * pageSize)
    .limit(pageSize)
    .getManyAndCount()
  return { items: purchases.map(toSummary), total, page, pageSize }
}

export async function getPurchase(payload: unknown): Promise<PurchaseDto> {
  return loadPurchase(getDataSource().manager, asId(asObject(payload).id))
}

// Records a purchase invoice atomically: invoice, lines, stock, stock movements,
// product cost and the amount owed to the supplier.
export async function createPurchase(payload: unknown, actor: SessionUser): Promise<PurchaseDto> {
  const input = asObject(payload)
  const supplierId = asId(input.supplierId, 'supplierId')
  const tendered = asAmount(input.paidAmount, 'paidAmount')
  if (!Array.isArray(input.items) || input.items.length === 0 || input.items.length > MAX_LINES) {
    throw new AppError('VALIDATION', 'items')
  }
  const lines = input.items.map((raw) => {
    const item = asObject(raw)
    const quantity = asAmount(item.quantity, 'quantity', 3)
    if (quantity <= 0) throw new AppError('VALIDATION', 'quantity')
    const unitCost = asAmount(item.unitCost, 'unitCost')
    return {
      productId: asId(item.productId, 'productId'),
      quantity,
      unitCost,
      total: roundTo(quantity * unitCost, 2)
    }
  })
  if (new Set(lines.map((line) => line.productId)).size !== lines.length) {
    throw new AppError('VALIDATION', 'items')
  }

  return getDataSource().transaction(async (manager) => {
    const supplier = await manager.getRepository(Supplier).findOneBy({ id: supplierId })
    if (!supplier) throw new AppError('NOT_FOUND', 'supplier')

    const total = roundTo(lines.reduce((sum, line) => sum + line.total, 0), 2)
    const paidAmount = Math.min(tendered, total)
    const remaining = roundTo(total - paidAmount, 2)
    const paymentStatus: PurchasePaymentStatus =
      remaining === 0 ? 'paid' : paidAmount === 0 ? 'unpaid' : 'partial'

    const purchase = await manager.getRepository(Purchase).save(
      manager
        .getRepository(Purchase)
        .create({ supplierId, userId: actor.id, total, paidAmount, paymentStatus })
    )

    for (const line of lines) {
      const product = await manager.getRepository(Product).findOneBy({ id: line.productId })
      if (!product) throw new AppError('NOT_FOUND', 'product')
      // Items sold without stock have no quantity to receive.
      if (!product.trackStock) throw new AppError('VALIDATION', 'items')

      await manager.getRepository(PurchaseItem).save(
        manager.getRepository(PurchaseItem).create({ purchaseId: purchase.id, ...line })
      )

      // Weighted-average cost: stock already on the shelf keeps its old cost,
      // so profit on later sales reflects what the goods really cost.
      const onHand = Math.max(product.quantity, 0)
      product.purchasePrice = roundTo(
        (onHand * product.purchasePrice + line.quantity * line.unitCost) / (onHand + line.quantity),
        2
      )
      product.quantity = roundTo(product.quantity + line.quantity, 3)
      await manager.getRepository(Product).save(product)

      await manager.getRepository(InventoryTransaction).save(
        manager.getRepository(InventoryTransaction).create({
          productId: line.productId,
          type: 'in',
          quantity: line.quantity,
          reason: `شراء — ${purchaseNumber(purchase.id)}`,
          referenceType: 'purchase',
          referenceId: purchase.id,
          userId: actor.id
        })
      )
    }

    if (remaining > 0) {
      supplier.balance = roundTo(supplier.balance + remaining, 2)
      await manager.getRepository(Supplier).save(supplier)
    }

    return loadPurchase(manager, purchase.id)
  })
}
