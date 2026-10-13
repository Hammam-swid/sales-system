import type { EntityManager } from 'typeorm'
import { getDataSource } from '../database/data-source'
import { AuditLog } from '../database/entities'

export interface AuditEntry {
  userId: number | null
  action: string
  entityType?: string
  entityId?: number
  details?: Record<string, unknown>
}

// Pass the transaction's manager to make the log entry part of the same atomic operation.
export async function recordAudit(entry: AuditEntry, manager?: EntityManager): Promise<void> {
  const repository = (manager ?? getDataSource().manager).getRepository(AuditLog)
  await repository.save(
    repository.create({
      userId: entry.userId,
      action: entry.action,
      entityType: entry.entityType ?? null,
      entityId: entry.entityId ?? null,
      details: entry.details ? JSON.stringify(entry.details) : null
    })
  )
}
