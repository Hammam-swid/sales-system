import { randomUUID } from 'node:crypto'
import type { EntityManager } from 'typeorm'
import { can } from '../../shared/permissions'
import {
  computeTotals,
  lineGross,
  lineTotal,
  returnedValue,
  roundTo,
  type HeldSaleDto,
  type ListSalesResponse,
  type PaymentMethod,
  type PaymentStatus,
  type PosProduct,
  type ReturnSaleResponse,
  type SaleDto,
  type SaleSummaryDto
} from '../../shared/sales'
import type { SessionUser } from '../auth/session'
import { getDataSource } from '../database/data-source'
import {
  Customer,
  CustomerPayment,
  InventoryTransaction,
  Product,
  Sale,
  SaleItem,
  Setting
} from '../database/entities'
import { AppError } from '../errors'
import { recordAudit } from './audit.service'
import {
  asAmount,
  asId,
  asObject,
  asOneOf,
  asOptionalId,
  asOptionalText
} from './validation'

const MAX_LINES = 300
const MAX_PAGE_SIZE = 100
const INVOICE_COUNTER_KEY = 'next_invoice_number'

interface CartLine {
  productId: number
  quantity: number
  discount: number
}

function parseCart(input: Record<string, unknown>): {
  lines: CartLine[]
  discount: number
  customerId: number | null
} {
  if (!Array.isArray(input.items) || input.items.length === 0 || input.items.length > MAX_LINES) {
    throw new AppError('VALIDATION', 'items')
  }
  const lines = input.items.map((raw): CartLine => {
    const item = asObject(raw)
    const quantity = asAmount(item.quantity, 'quantity', 3)
    if (quantity <= 0) throw new AppError('VALIDATION', 'quantity')
    return {
      productId: asId(item.productId, 'productId'),
      quantity,
      discount: asAmount(item.discount ?? 0, 'discount')
    }
  })
  // One line per product keeps stock checks and returns unambiguous.
  if (new Set(lines.map((line) => line.productId)).size !== lines.length) {
    throw new AppError('VALIDATION', 'items')
  }
  return {
    lines,
    discount: asAmount(input.discount ?? 0, 'discount'),
    customerId: asOptionalId(input.customerId, 'customerId')
  }
}

interface PricedLine extends CartLine {
  product: Product
  unitPrice: number
}

// Prices always come from the database, never from the screen.
async function priceLines(manager: EntityManager, lines: CartLine[]): Promise<PricedLine[]> {
  const repository = manager.getRepository(Product)
  const priced: PricedLine[] = []
  for (const line of lines) {
    const product = await repository.findOneBy({ id: line.productId })
    if (!product || !product.isActive) {
      throw new AppError('PRODUCT_UNAVAILABLE', product?.name ?? `#${line.productId}`)
    }
    const pricedLine = { ...line, product, unitPrice: product.salePrice }
    if (line.discount > lineGross(pricedLine)) throw new AppError('VALIDATION', 'discount')
    priced.push(pricedLine)
  }
  return priced
}

async function readTaxRate(manager: EntityManager): Promise<number> {
  const row = await manager.getRepository(Setting).findOneBy({ key: 'tax_rate' })
  const rate = Number(row?.value)
  return Number.isFinite(rate) && rate > 0 ? rate : 0
}

// Gapless invoice numbers from a counter stored with the settings.
async function nextInvoiceNumber(manager: EntityManager): Promise<string> {
  const repository = manager.getRepository(Setting)
  const row = await repository.findOneBy({ key: INVOICE_COUNTER_KEY })
  const next = Math.max(1, Math.floor(Number(row?.value)) || 1)
  await repository.save(repository.create({ key: INVOICE_COUNTER_KEY, value: String(next + 1) }))
  return `INV-${String(next).padStart(6, '0')}`
}

function toPosProduct(product: Product): PosProduct {
  return {
    id: product.id,
    name: product.name,
    barcode: product.barcode,
    unit: product.unit,
    salePrice: product.salePrice,
    quantity: product.quantity,
    isActive: product.isActive
  }
}

const SALE_RELATIONS = { items: { product: true }, customer: true, user: true } as const

function toSaleDto(sale: Sale): SaleDto {
  const items = [...(sale.items ?? [])].sort((a, b) => a.id - b.id)
  return {
    id: sale.id,
    invoiceNumber: sale.invoiceNumber,
    status: sale.status,
    customerId: sale.customerId,
    customerName: sale.customer?.name ?? null,
    userName: sale.user?.fullName ?? null,
    subtotal: sale.subtotal,
    discount: sale.discount,
    tax: sale.tax,
    total: sale.total,
    paidAmount: sale.paidAmount,
    paymentStatus: sale.paymentStatus,
    paymentMethod: sale.paymentMethod,
    returnedValue: returnedValue(sale, items),
    createdAt: sale.createdAt.toISOString(),
    items: items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product?.name ?? `#${item.productId}`,
      unit: item.product?.unit ?? '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      discount: item.discount,
      total: item.total,
      returnedQuantity: item.returnedQuantity
    }))
  }
}

async function loadSale(manager: EntityManager, id: number): Promise<Sale> {
  const sale = await manager.getRepository(Sale).findOne({ where: { id }, relations: SALE_RELATIONS })
  if (!sale) throw new AppError('NOT_FOUND')
  return sale
}

// Completes a sale atomically: invoice, lines, stock, stock movements and customer debt
// either all happen or none do.
export async function checkout(payload: unknown, actor: SessionUser): Promise<SaleDto> {
  const input = asObject(payload)
  const cart = parseCart(input)
  const tendered = asAmount(input.paidAmount, 'paidAmount')

  return getDataSource().transaction(async (manager) => {
    const lines = await priceLines(manager, cart.lines)
    for (const line of lines) {
      if (line.quantity > line.product.quantity) {
        throw new AppError('INSUFFICIENT_STOCK', line.product.name)
      }
    }

    const totals = computeTotals(lines, cart.discount, await readTaxRate(manager))
    if (cart.discount > totals.subtotal) throw new AppError('VALIDATION', 'discount')

    const paidAmount = Math.min(tendered, totals.total)
    const remaining = roundTo(totals.total - paidAmount, 2)

    let customer: Customer | null = null
    if (cart.customerId !== null) {
      customer = await manager.getRepository(Customer).findOneBy({ id: cart.customerId })
      if (!customer) throw new AppError('NOT_FOUND', 'customer')
    }
    // Selling on credit needs someone to owe the money.
    if (remaining > 0 && !customer) throw new AppError('CUSTOMER_REQUIRED')

    const paymentStatus: PaymentStatus =
      remaining === 0 ? 'paid' : paidAmount === 0 ? 'unpaid' : 'partial'
    const paymentMethod: PaymentMethod =
      remaining === 0 ? 'cash' : paidAmount === 0 ? 'credit' : 'mixed'

    const sale = await manager.getRepository(Sale).save(
      manager.getRepository(Sale).create({
        invoiceNumber: await nextInvoiceNumber(manager),
        customerId: customer?.id ?? null,
        userId: actor.id,
        ...totals,
        paidAmount,
        paymentStatus,
        paymentMethod,
        status: 'completed'
      })
    )

    for (const line of lines) {
      await manager.getRepository(SaleItem).save(
        manager.getRepository(SaleItem).create({
          saleId: sale.id,
          productId: line.productId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          // Snapshot of the cost, so later price changes never alter past profit.
          costPrice: line.product.purchasePrice,
          discount: line.discount,
          total: lineTotal(line),
          returnedQuantity: 0
        })
      )
      line.product.quantity = roundTo(line.product.quantity - line.quantity, 3)
      await manager.getRepository(Product).save(line.product)
      await manager.getRepository(InventoryTransaction).save(
        manager.getRepository(InventoryTransaction).create({
          productId: line.productId,
          type: 'out',
          quantity: line.quantity,
          reason: `بيع — ${sale.invoiceNumber}`,
          referenceType: 'sale',
          referenceId: sale.id,
          userId: actor.id
        })
      )
    }

    if (customer && remaining > 0) {
      customer.balance = roundTo(customer.balance + remaining, 2)
      await manager.getRepository(Customer).save(customer)
    }

    return toSaleDto(await loadSale(manager, sale.id))
  })
}

// A held sale is a parked cart: it reserves nothing and changes no stock or balance.
export async function holdSale(payload: unknown, actor: SessionUser): Promise<{ id: number }> {
  const cart = parseCart(asObject(payload))

  return getDataSource().transaction(async (manager) => {
    const lines = await priceLines(manager, cart.lines)
    const totals = computeTotals(lines, cart.discount, await readTaxRate(manager))

    if (cart.customerId !== null) {
      const exists = await manager.getRepository(Customer).existsBy({ id: cart.customerId })
      if (!exists) throw new AppError('NOT_FOUND', 'customer')
    }

    const sale = await manager.getRepository(Sale).save(
      manager.getRepository(Sale).create({
        // Held carts are not invoices and do not consume an invoice number.
        invoiceNumber: `HOLD-${randomUUID()}`,
        customerId: cart.customerId,
        userId: actor.id,
        ...totals,
        paidAmount: 0,
        paymentStatus: 'unpaid',
        paymentMethod: 'cash',
        status: 'held'
      })
    )
    for (const line of lines) {
      await manager.getRepository(SaleItem).save(
        manager.getRepository(SaleItem).create({
          saleId: sale.id,
          productId: line.productId,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          costPrice: line.product.purchasePrice,
          discount: line.discount,
          total: lineTotal(line),
          returnedQuantity: 0
        })
      )
    }
    return { id: sale.id }
  })
}

function toHeldSaleDto(sale: Sale): HeldSaleDto {
  return {
    id: sale.id,
    customerId: sale.customerId,
    customerName: sale.customer?.name ?? null,
    discount: sale.discount,
    total: sale.total,
    createdAt: sale.createdAt.toISOString(),
    items: [...(sale.items ?? [])]
      .sort((a, b) => a.id - b.id)
      .filter((item) => item.product)
      .map((item) => ({
        product: toPosProduct(item.product as Product),
        quantity: item.quantity,
        discount: item.discount
      }))
  }
}

// Cashiers see only the carts they parked; managers see all.
function heldScope(actor: SessionUser): { status: 'held'; userId?: number } {
  return can(actor.role, 'sales.return') ? { status: 'held' } : { status: 'held', userId: actor.id }
}

export async function listHeldSales(actor: SessionUser): Promise<HeldSaleDto[]> {
  const sales = await getDataSource()
    .getRepository(Sale)
    .find({ where: heldScope(actor), relations: SALE_RELATIONS, order: { id: 'DESC' } })
  return sales.map(toHeldSaleDto)
}

async function removeHeldSale(
  manager: EntityManager,
  id: number,
  actor: SessionUser
): Promise<Sale> {
  const sale = await manager
    .getRepository(Sale)
    .findOne({ where: { id, ...heldScope(actor) }, relations: SALE_RELATIONS })
  if (!sale) throw new AppError('NOT_FOUND')
  await manager.getRepository(SaleItem).delete({ saleId: id })
  await manager.getRepository(Sale).delete({ id })
  return sale
}

// Hands the parked cart back to the screen (with current prices and stock) and removes it.
export async function resumeHeldSale(payload: unknown, actor: SessionUser): Promise<HeldSaleDto> {
  const id = asId(asObject(payload).id)
  return getDataSource().transaction(async (manager) =>
    toHeldSaleDto(await removeHeldSale(manager, id, actor))
  )
}

export async function discardHeldSale(payload: unknown, actor: SessionUser): Promise<null> {
  const id = asId(asObject(payload).id)
  await getDataSource().transaction((manager) => removeHeldSale(manager, id, actor))
  return null
}

export async function listSales(payload: unknown, actor: SessionUser): Promise<ListSalesResponse> {
  const input = payload === undefined || payload === null ? {} : asObject(payload)
  const search = asOptionalText(input.search, 'search', 100)
  const status = asOneOf(input.status ?? 'all', ['all', 'completed', 'returned'] as const, 'status')
  const page = Math.max(1, Math.floor(Number(input.page) || 1))
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(Number(input.pageSize) || 25)))

  const query = getDataSource()
    .getRepository(Sale)
    .createQueryBuilder('sale')
    .leftJoinAndSelect('sale.customer', 'customer')
    .leftJoinAndSelect('sale.user', 'user')
    .where('sale.status != :held', { held: 'held' })

  // Limited view: a cashier only sees invoices they issued.
  if (!can(actor.role, 'sales.return')) query.andWhere('sale.userId = :userId', { userId: actor.id })

  if (status === 'completed') query.andWhere('sale.status = :status', { status: 'completed' })
  if (status === 'returned') {
    query.andWhere('sale.status IN (:...statuses)', { statuses: ['returned', 'partially_returned'] })
  }
  if (search) {
    const pattern = `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`
    query.andWhere(
      "(sale.invoiceNumber LIKE :pattern ESCAPE '\\' OR customer.name LIKE :pattern ESCAPE '\\')",
      { pattern }
    )
  }

  const [sales, total] = await query
    .orderBy('sale.id', 'DESC')
    .offset((page - 1) * pageSize)
    .limit(pageSize)
    .getManyAndCount()

  const items: SaleSummaryDto[] = sales.map((sale) => ({
    id: sale.id,
    invoiceNumber: sale.invoiceNumber,
    status: sale.status,
    customerName: sale.customer?.name ?? null,
    userName: sale.user?.fullName ?? null,
    total: sale.total,
    paidAmount: sale.paidAmount,
    paymentStatus: sale.paymentStatus,
    createdAt: sale.createdAt.toISOString()
  }))
  return { items, total, page, pageSize }
}

export async function getSale(payload: unknown, actor: SessionUser): Promise<SaleDto> {
  const id = asId(asObject(payload).id)
  const sale = await loadSale(getDataSource().manager, id)
  const ownOnly = !can(actor.role, 'sales.return')
  if (sale.status === 'held' || (ownOnly && sale.userId !== actor.id)) {
    throw new AppError('NOT_FOUND')
  }
  return toSaleDto(sale)
}

// Returns goods from an invoice: restores stock, then settles the money by first
// cancelling whatever the customer still owes on this invoice and refunding the rest in cash.
export async function returnSale(payload: unknown, actor: SessionUser): Promise<ReturnSaleResponse> {
  const input = asObject(payload)
  const saleId = asId(input.saleId, 'saleId')
  if (!Array.isArray(input.items) || input.items.length === 0 || input.items.length > MAX_LINES) {
    throw new AppError('VALIDATION', 'items')
  }
  const requested = new Map<number, number>()
  for (const raw of input.items) {
    const item = asObject(raw)
    const saleItemId = asId(item.saleItemId, 'saleItemId')
    const quantity = asAmount(item.quantity, 'quantity', 3)
    if (quantity <= 0 || requested.has(saleItemId)) throw new AppError('VALIDATION', 'items')
    requested.set(saleItemId, quantity)
  }

  return getDataSource().transaction(async (manager) => {
    const sale = await loadSale(manager, saleId)
    if (sale.status === 'held') throw new AppError('NOT_FOUND')
    const items = sale.items ?? []
    const valueBefore = returnedValue(sale, items)

    const returnedLines: { name: string; quantity: number }[] = []
    for (const [saleItemId, quantity] of requested) {
      const item = items.find((candidate) => candidate.id === saleItemId)
      if (!item) throw new AppError('NOT_FOUND', 'saleItem')
      if (quantity > roundTo(item.quantity - item.returnedQuantity, 3)) {
        throw new AppError('RETURN_EXCEEDS', item.product?.name)
      }

      item.returnedQuantity = roundTo(item.returnedQuantity + quantity, 3)
      await manager.getRepository(SaleItem).update({ id: item.id }, {
        returnedQuantity: item.returnedQuantity
      })

      // Stock comes back even if the product has since been archived.
      const product = await manager.getRepository(Product).findOneBy({ id: item.productId })
      if (product) {
        product.quantity = roundTo(product.quantity + quantity, 3)
        await manager.getRepository(Product).save(product)
      }
      await manager.getRepository(InventoryTransaction).save(
        manager.getRepository(InventoryTransaction).create({
          productId: item.productId,
          type: 'in',
          quantity,
          reason: `مرتجع — ${sale.invoiceNumber}`,
          referenceType: 'sale',
          referenceId: sale.id,
          userId: actor.id
        })
      )
      returnedLines.push({ name: item.product?.name ?? `#${item.productId}`, quantity })
    }

    const returnValue = roundTo(returnedValue(sale, items) - valueBefore, 2)

    // Debt still open on this invoice, after what earlier returns already cancelled.
    const unpaidLeft = Math.max(0, roundTo(sale.total - sale.paidAmount - valueBefore, 2))
    let debtReduction = 0
    if (sale.customerId !== null && unpaidLeft > 0) {
      const customer = await manager.getRepository(Customer).findOneBy({ id: sale.customerId })
      if (customer) {
        // Never push the balance below zero if the customer has paid debts since.
        debtReduction = roundTo(Math.min(returnValue, unpaidLeft, Math.max(customer.balance, 0)), 2)
        customer.balance = roundTo(customer.balance - debtReduction, 2)
        await manager.getRepository(Customer).save(customer)
        if (debtReduction > 0) {
          // Ledger row, so the customer's balance can be rebuilt from history.
          await manager.getRepository(CustomerPayment).save(
            manager.getRepository(CustomerPayment).create({
              customerId: customer.id,
              kind: 'return_credit',
              amount: debtReduction,
              saleId: sale.id,
              userId: actor.id
            })
          )
        }
      }
    }
    const cashRefund = roundTo(returnValue - debtReduction, 2)

    const fullyReturned = items.every((item) => item.returnedQuantity >= item.quantity)
    await manager.getRepository(Sale).update({ id: sale.id }, {
      status: fullyReturned ? 'returned' : 'partially_returned'
    })

    await recordAudit(
      {
        userId: actor.id,
        action: 'return_sale',
        entityType: 'sale',
        entityId: sale.id,
        details: {
          invoiceNumber: sale.invoiceNumber,
          items: returnedLines,
          returnValue,
          debtReduction,
          cashRefund
        }
      },
      manager
    )

    return {
      sale: toSaleDto(await loadSale(manager, sale.id)),
      returnValue,
      debtReduction,
      cashRefund
    }
  })
}
