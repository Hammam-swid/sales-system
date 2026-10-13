import type { EntityManager } from 'typeorm'
import { purchaseNumber, type PartyDto, type StatementDto } from '../../shared/parties'
import { roundTo } from '../../shared/sales'
import type { SessionUser } from '../auth/session'
import { getDataSource } from '../database/data-source'
import { Purchase, Supplier, SupplierPayment } from '../database/entities'
import { AppError } from '../errors'
import { recordAudit } from './audit.service'
import {
  buildStatement,
  likePattern,
  parsePartyInput,
  parsePayment,
  parseSearch,
  toPartyDto,
  type RawEntry
} from './party.helpers'
import { asId, asObject } from './validation'

export async function listSuppliers(payload: unknown): Promise<PartyDto[]> {
  const search = parseSearch(payload)
  const query = getDataSource().getRepository(Supplier).createQueryBuilder('supplier')
  if (search) {
    query.where(
      "(supplier.name LIKE :pattern ESCAPE '\\' OR supplier.phone LIKE :pattern ESCAPE '\\')",
      { pattern: likePattern(search) }
    )
  }
  const suppliers = await query.orderBy('supplier.name', 'ASC').limit(1000).getMany()
  return suppliers.map(toPartyDto)
}

export async function saveSupplier(payload: unknown): Promise<PartyDto> {
  const { id, ...fields } = parsePartyInput(payload)
  const repository = getDataSource().getRepository(Supplier)

  if (id === null) {
    const created = await repository.save(repository.create(fields))
    return toPartyDto(await repository.findOneByOrFail({ id: created.id }))
  }
  const supplier = await repository.findOneBy({ id })
  if (!supplier) throw new AppError('NOT_FOUND')
  return toPartyDto(await repository.save(Object.assign(supplier, fields)))
}

export async function deleteSupplier(payload: unknown): Promise<null> {
  const id = asId(asObject(payload).id)
  await getDataSource().transaction(async (manager) => {
    const repository = manager.getRepository(Supplier)
    const supplier = await repository.findOneBy({ id })
    if (!supplier) throw new AppError('NOT_FOUND')

    const inUse =
      supplier.balance !== 0 ||
      (await manager.getRepository(Purchase).existsBy({ supplierId: id })) ||
      (await manager.getRepository(SupplierPayment).existsBy({ supplierId: id }))
    if (inUse) throw new AppError('RECORD_IN_USE')

    await repository.delete({ id })
  })
  return null
}

async function supplierEntries(manager: EntityManager, supplierId: number): Promise<RawEntry[]> {
  const purchases = await manager.getRepository(Purchase).find({ where: { supplierId } })
  const payments = await manager.getRepository(SupplierPayment).find({ where: { supplierId } })

  return [
    ...purchases.map(
      (purchase): RawEntry => ({
        date: purchase.createdAt.toISOString(),
        kind: 'invoice',
        reference: purchaseNumber(purchase.id),
        note: null,
        total: purchase.total,
        // Only the unpaid part of a purchase is owed to the supplier.
        change: roundTo(purchase.total - purchase.paidAmount, 2),
        order: purchase.id
      })
    ),
    ...payments.map(
      (payment): RawEntry => ({
        date: payment.createdAt.toISOString(),
        kind: 'payment',
        reference: '',
        note: payment.note,
        total: null,
        change: -payment.amount,
        order: 1e9 + payment.id
      })
    )
  ]
}

export async function supplierStatement(payload: unknown): Promise<StatementDto> {
  const id = asId(asObject(payload).id)
  const manager = getDataSource().manager
  const supplier = await manager.getRepository(Supplier).findOneBy({ id })
  if (!supplier) throw new AppError('NOT_FOUND')
  return buildStatement(supplier, await supplierEntries(manager, id))
}

export async function recordSupplierPayment(
  payload: unknown,
  actor: SessionUser
): Promise<PartyDto> {
  return getDataSource().transaction(async (manager) => {
    const repository = manager.getRepository(Supplier)
    const { id, amount, note } = await parsePayment(payload, async (supplierId) => {
      const found = await repository.findOneBy({ id: supplierId })
      if (!found) throw new AppError('NOT_FOUND')
      return found.balance
    })

    const supplier = await repository.findOneByOrFail({ id })
    supplier.balance = roundTo(supplier.balance - amount, 2)
    await repository.save(supplier)
    await manager.getRepository(SupplierPayment).save(
      manager.getRepository(SupplierPayment).create({ supplierId: id, amount, note, userId: actor.id })
    )
    return toPartyDto(supplier)
  })
}

// Verification tool: sets the stored balance to the one rebuilt from history.
export async function recalculateSupplier(payload: unknown, actor: SessionUser): Promise<PartyDto> {
  const id = asId(asObject(payload).id)
  return getDataSource().transaction(async (manager) => {
    const repository = manager.getRepository(Supplier)
    const supplier = await repository.findOneBy({ id })
    if (!supplier) throw new AppError('NOT_FOUND')

    const { computedBalance } = buildStatement(supplier, await supplierEntries(manager, id))
    if (computedBalance !== supplier.balance) {
      await recordAudit(
        {
          userId: actor.id,
          action: 'recalculate_balance',
          entityType: 'supplier',
          entityId: id,
          details: { before: supplier.balance, after: computedBalance }
        },
        manager
      )
      supplier.balance = computedBalance
      await repository.save(supplier)
    }
    return toPartyDto(supplier)
  })
}
