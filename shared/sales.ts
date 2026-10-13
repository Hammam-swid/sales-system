// Types and money math for the checkout, invoices and returns module.
// The math lives here so the screen and the main process always agree to the cent.

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}

const money = (value: number): number => roundTo(value, 2)

export interface LineAmounts {
  quantity: number
  unitPrice: number
  // Absolute amount taken off this line.
  discount: number
}

export function lineGross(line: LineAmounts): number {
  return money(line.quantity * line.unitPrice)
}

export function lineTotal(line: LineAmounts): number {
  return money(lineGross(line) - line.discount)
}

export interface SaleTotals {
  subtotal: number
  discount: number
  tax: number
  total: number
}

// subtotal = sum of line totals; tax applies after the invoice discount.
export function computeTotals(lines: LineAmounts[], discount: number, taxRate: number): SaleTotals {
  const subtotal = money(lines.reduce((sum, line) => sum + lineTotal(line), 0))
  const appliedDiscount = money(Math.min(Math.max(discount, 0), subtotal))
  const taxable = subtotal - appliedDiscount
  const tax = money((taxable * taxRate) / 100)
  return { subtotal, discount: appliedDiscount, tax, total: money(taxable + tax) }
}

export interface ReturnableLine {
  total: number
  quantity: number
  returnedQuantity: number
}

// Value of everything returned so far on an invoice, including each line's
// share of the invoice discount and tax.
export function returnedValue(
  sale: { subtotal: number; total: number },
  lines: ReturnableLine[]
): number {
  if (lines.length > 0 && lines.every((line) => line.returnedQuantity >= line.quantity)) {
    // Fully returned: exactly the invoice total, with no rounding drift.
    return sale.total
  }
  if (sale.subtotal <= 0) return 0
  const returnedLines = lines.reduce(
    (sum, line) => sum + (line.quantity > 0 ? (line.total * line.returnedQuantity) / line.quantity : 0),
    0
  )
  return money((returnedLines * sale.total) / sale.subtotal)
}

export type PaymentStatus = 'paid' | 'partial' | 'unpaid'
export type PaymentMethod = 'cash' | 'credit' | 'mixed'
export type SaleStatus = 'completed' | 'held' | 'returned' | 'partially_returned'

export interface CustomerDto {
  id: number
  name: string
  phone: string | null
  // Debt the customer owes the shop.
  balance: number
}

// What the checkout screen needs to know about a product.
export interface PosProduct {
  id: number
  name: string
  barcode: string | null
  unit: string
  salePrice: number
  // Stock on hand.
  quantity: number
  isActive: boolean
}

export interface CartLineInput {
  productId: number
  quantity: number
  discount: number
}

export interface CheckoutRequest {
  items: CartLineInput[]
  // Absolute amount taken off the invoice.
  discount: number
  customerId: number | null
  // What the customer pays now; the rest becomes their debt.
  paidAmount: number
}

export interface HoldSaleRequest {
  items: CartLineInput[]
  discount: number
  customerId: number | null
}

export interface HeldSaleDto {
  id: number
  customerId: number | null
  customerName: string | null
  discount: number
  total: number
  createdAt: string
  items: { product: PosProduct; quantity: number; discount: number }[]
}

export interface SaleItemDto {
  id: number
  productId: number
  productName: string
  unit: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
  returnedQuantity: number
}

export interface SaleDto {
  id: number
  invoiceNumber: string
  status: SaleStatus
  customerId: number | null
  customerName: string | null
  userName: string | null
  subtotal: number
  discount: number
  tax: number
  total: number
  paidAmount: number
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  returnedValue: number
  createdAt: string
  items: SaleItemDto[]
}

export interface SaleSummaryDto {
  id: number
  invoiceNumber: string
  status: SaleStatus
  customerName: string | null
  userName: string | null
  total: number
  paidAmount: number
  paymentStatus: PaymentStatus
  createdAt: string
}

export type SaleStatusFilter = 'all' | 'completed' | 'returned'

export interface ListSalesRequest {
  // Matches the invoice number or the customer name.
  search?: string
  status?: SaleStatusFilter
  page?: number
  pageSize?: number
}

export interface ListSalesResponse {
  items: SaleSummaryDto[]
  total: number
  page: number
  pageSize: number
}

export interface ReturnSaleRequest {
  saleId: number
  items: { saleItemId: number; quantity: number }[]
}

export interface ReturnSaleResponse {
  sale: SaleDto
  // Value of the goods returned in this operation.
  returnValue: number
  // Part that cancels the customer's unpaid debt on this invoice.
  debtReduction: number
  // Part to hand back in cash.
  cashRefund: number
}
