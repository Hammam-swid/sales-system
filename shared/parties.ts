// Types for customers, suppliers, their account statements and purchase invoices.

// A customer or a supplier: both are a named contact with a running balance.
export interface PartyDto {
  id: number
  name: string
  phone: string | null
  address: string | null
  // Customer: debt owed to the shop. Supplier: amount the shop owes them.
  balance: number
}

export interface SavePartyRequest {
  // Omit to create.
  id?: number
  name: string
  phone: string | null
  address: string | null
}

export type StatementEntryKind = 'invoice' | 'payment' | 'return_credit'

export interface StatementEntry {
  date: string
  kind: StatementEntryKind
  // Invoice number, or empty for a plain payment.
  reference: string
  note: string | null
  // Invoice total, when the entry is an invoice.
  total: number | null
  // Effect on the balance: positive adds debt, negative settles it.
  change: number
  balanceAfter: number
}

export interface StatementDto {
  party: PartyDto
  // Oldest first.
  entries: StatementEntry[]
  // Balance rebuilt from the entries; should equal party.balance.
  computedBalance: number
}

export interface PartyPaymentRequest {
  id: number
  amount: number
  note: string | null
}

export type PurchasePaymentStatus = 'paid' | 'partial' | 'unpaid'

export interface PurchaseLineInput {
  productId: number
  quantity: number
  unitCost: number
}

export interface CreatePurchaseRequest {
  supplierId: number
  items: PurchaseLineInput[]
  // What is paid to the supplier now; the rest is owed to them.
  paidAmount: number
}

export interface PurchaseItemDto {
  id: number
  productId: number
  productName: string
  unit: string
  quantity: number
  unitCost: number
  total: number
}

export interface PurchaseSummaryDto {
  id: number
  number: string
  supplierName: string | null
  userName: string | null
  total: number
  paidAmount: number
  paymentStatus: PurchasePaymentStatus
  createdAt: string
}

export interface PurchaseDto extends PurchaseSummaryDto {
  items: PurchaseItemDto[]
}

export interface ListPurchasesRequest {
  // Matches the supplier name.
  search?: string
  page?: number
  pageSize?: number
}

export interface ListPurchasesResponse {
  items: PurchaseSummaryDto[]
  total: number
  page: number
  pageSize: number
}

export function purchaseNumber(id: number): string {
  return `PUR-${String(id).padStart(6, '0')}`
}
