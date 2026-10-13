import { Not, type EntityManager } from 'typeorm'
import type { PartyDto, StatementDto } from '../../shared/parties'
import { roundTo } from '../../shared/sales'
import type { SessionUser } from '../auth/session'
import { getDataSource } from '../database/data-source'
import { Customer, CustomerPayment, Sale } from '../database/entities'
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

export async function listCustomers(payload: unknown): Promise<PartyDto[]> {
  const search = parseSearch(payload)
  const query = getDataSource().getRepository(Customer).createQueryBuilder('customer')
  if (search) {
    query.where(
      "(customer.name LIKE :pattern ESCAPE '\\' OR customer.phone LIKE :pattern ESCAPE '\\')",
      { pattern: likePattern(search) }
    )
  }
  const customers = await query.orderBy('customer.name', 'ASC').limit(1000).getMany()
  return customers.map(toPartyDto)
}

export async function saveCustomer(payload: unknown): Promise<PartyDto> {
  const { id, ...fields } = parsePartyInput(payload)
  const repository = getDataSource().getRepository(Customer)

  if (id === null) {
    const created = await repository.save(repository.create(fields))
    return toPartyDto(await repository.findOneByOrFail({ id: created.id }))
  }
  const customer = await repository.findOneBy({ id })
  if (!customer) throw new AppError('NOT_FOUND')
  return toPartyDto(await repository.save(Object.assign(customer, fields)))
}

// A customer with any history stays, so invoices never lose who they were issued to.
export async function deleteCustomer(payload: unknown): Promise<null> {
  const id = asId(asObject(payload).id)
  await getDataSource().transaction(async (manager) => {
    const repository = manager.getRepository(Customer)
    const customer = await repository.findOneBy({ id })
    if (!customer) throw new AppError('NOT_FOUND')

    const inUse =
      customer.balance !== 0 ||
      (await manager.getRepository(Sale).existsBy({ customerId: id })) ||
      (await manager.getRepository(CustomerPayment).existsBy({ customerId: id }))
    if (inUse) throw new AppError('RECORD_IN_USE')

    await repository.delete({ id })
  })
  return null
}

// Every invoice and every payment or return credit, in time order.
async function customerEntries(manager: EntityManager, customerId: number): Promise<RawEntry[]> {
  const sales = await manager
    .getRepository(Sale)
    .find({ where: { customerId, status: Not('held') } })
  const payments = await manager
    .getRepository(CustomerPayment)
    .find({ where: { customerId }, relations: { sale: true } })

  return [
    ...sales.map(
      (sale): RawEntry => ({
        date: sale.createdAt.toISOString(),
        kind: 'invoice',
        reference: sale.invoiceNumber,
        note: null,
        total: sale.total,
        // Only the unpaid part of an invoice becomes debt.
        change: roundTo(sale.total - sale.paidAmount, 2),
        order: sale.id
      })
    ),
    ...payments.map(
      (payment): RawEntry => ({
        date: payment.createdAt.toISOString(),
        kind: payment.kind,
        reference: payment.sale?.invoiceNumber ?? '',
        note: payment.note,
        total: null,
        change: -payment.amount,
        // After any invoice created in the same second.
        order: 1e9 + payment.id
      })
    )
  ]
}

export async function customerStatement(payload: unknown): Promise<StatementDto> {
  const id = asId(asObject(payload).id)
  const manager = getDataSource().manager
  const customer = await manager.getRepository(Customer).findOneBy({ id })
  if (!customer) throw new AppError('NOT_FOUND')
  return buildStatement(customer, await customerEntries(manager, id))
}

export async function recordCustomerPayment(
  payload: unknown,
  actor: SessionUser
): Promise<PartyDto> {
  return getDataSource().transaction(async (manager) => {
    const repository = manager.getRepository(Customer)
    const { id, amount, note } = await parsePayment(payload, async (customerId) => {
      const found = await repository.findOneBy({ id: customerId })
      if (!found) throw new AppError('NOT_FOUND')
      return found.balance
    })

    const customer = await repository.findOneByOrFail({ id })
    customer.balance = roundTo(customer.balance - amount, 2)
    await repository.save(customer)
    await manager.getRepository(CustomerPayment).save(
      manager
        .getRepository(CustomerPayment)
        .create({ customerId: id, kind: 'payment', amount, note, userId: actor.id })
    )
    return toPartyDto(customer)
  })
}

// Verification tool: sets the stored balance to the one rebuilt from history.
export async function recalculateCustomer(payload: unknown, actor: SessionUser): Promise<PartyDto> {
  const id = asId(asObject(payload).id)
  return getDataSource().transaction(async (manager) => {
    const repository = manager.getRepository(Customer)
    const customer = await repository.findOneBy({ id })
    if (!customer) throw new AppError('NOT_FOUND')

    const { computedBalance } = buildStatement(customer, await customerEntries(manager, id))
    if (computedBalance !== customer.balance) {
      await recordAudit(
        {
          userId: actor.id,
          action: 'recalculate_balance',
          entityType: 'customer',
          entityId: id,
          details: { before: customer.balance, after: computedBalance }
        },
        manager
      )
      customer.balance = computedBalance
      await repository.save(customer)
    }
    return toPartyDto(customer)
  })
}
