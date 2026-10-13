import type { IpcResult } from '../../../../shared/ipc'
import type {
  PartyDto,
  PartyPaymentRequest,
  SavePartyRequest,
  StatementDto
} from '../../../../shared/parties'
import { t } from '../../i18n/ar'
import { api } from '../../lib/api'

// Customers and suppliers share one screen; this is everything that differs between them.
export interface PartyKind {
  labels: typeof t.customers
  // Badge color for a non-zero balance.
  balanceTone: 'warning' | 'danger'
  list: (search: string) => Promise<IpcResult<PartyDto[]>>
  save: (request: SavePartyRequest) => Promise<IpcResult<PartyDto>>
  remove: (id: number) => Promise<IpcResult<null>>
  statement: (id: number) => Promise<IpcResult<StatementDto>>
  pay: (request: PartyPaymentRequest) => Promise<IpcResult<PartyDto>>
  recalculate: (id: number) => Promise<IpcResult<PartyDto>>
}

export const CUSTOMER_KIND: PartyKind = {
  labels: t.customers,
  balanceTone: 'warning',
  list: (search) => api('customers:list', { search }),
  save: (request) => api('customers:save', request),
  remove: (id) => api('customers:delete', { id }),
  statement: (id) => api('customers:statement', { id }),
  pay: (request) => api('customers:pay', request),
  recalculate: (id) => api('customers:recalculate', { id })
}

export const SUPPLIER_KIND: PartyKind = {
  labels: t.suppliers,
  balanceTone: 'danger',
  list: (search) => api('suppliers:list', { search }),
  save: (request) => api('suppliers:save', request),
  remove: (id) => api('suppliers:delete', { id }),
  statement: (id) => api('suppliers:statement', { id }),
  pay: (request) => api('suppliers:pay', request),
  recalculate: (id) => api('suppliers:recalculate', { id })
}
