import { create } from 'zustand'
import { roundTo, type HeldSaleDto, type PosProduct } from '../../../shared/sales'
import type { OrderType } from '../../../shared/store'

export interface CartLine {
  // Identifies the line on screen; a product can be on several lines with different notes.
  id: number
  product: PosProduct
  quantity: number
  // Absolute amount taken off this line.
  discount: number
  // What to tell whoever prepares the order, such as "no sugar"; empty for none.
  note: string
}

export type DiscountMode = 'amount' | 'percent'

interface CartState {
  lines: CartLine[]
  customerId: number | null
  orderType: OrderType
  discountMode: DiscountMode
  // An amount, or a percentage when discountMode is 'percent'.
  discountValue: number
  // Returns false when the product has no stock left to add.
  add: (product: PosProduct) => boolean
  setQuantity: (lineId: number, quantity: number) => void
  setLineDiscount: (lineId: number, discount: number) => void
  // Puts the note on `count` units of the line; the rest stay on a line of their own.
  setLineNote: (lineId: number, note: string, count: number) => void
  remove: (lineId: number) => void
  setCustomer: (customerId: number | null) => void
  setOrderType: (orderType: OrderType) => void
  setDiscount: (mode: DiscountMode, value: number) => void
  load: (held: HeldSaleDto) => void
  clear: () => void
}

const DEFAULT_ORDER_TYPE: OrderType = 'dine_in'

const EMPTY = {
  lines: [],
  customerId: null,
  orderType: DEFAULT_ORDER_TYPE,
  discountMode: 'amount' as DiscountMode,
  discountValue: 0
}

let lastLineId = 0
const nextLineId = (): number => ++lastLineId

// Whole units for countable goods; weights and lengths may be fractional.
export function quantityStep(unit: string): number {
  return ['kg', 'g', 'liter', 'meter'].includes(unit) ? 0.25 : 1
}

// The most of a product one sale can hold: its stock, or no limit when stock is not tracked.
export function maxQuantity(product: PosProduct): number {
  return product.trackStock ? product.quantity : Infinity
}

// How much of a product the cart holds across all its lines, optionally leaving one line out.
export function quantityInCart(lines: CartLine[], productId: number, exceptLineId?: number): number {
  return roundTo(
    lines
      .filter((line) => line.product.id === productId && line.id !== exceptLineId)
      .reduce((sum, line) => sum + line.quantity, 0),
    3
  )
}

function clampDiscount(line: CartLine): CartLine {
  const gross = roundTo(line.quantity * line.product.salePrice, 2)
  return { ...line, discount: Math.min(Math.max(line.discount, 0), gross) }
}

// Lines of the same product with the same note are one line.
function mergeLines(lines: CartLine[]): CartLine[] {
  const merged: CartLine[] = []
  for (const line of lines) {
    const index = merged.findIndex(
      (other) => other.product.id === line.product.id && other.note === line.note
    )
    if (index === -1) merged.push(line)
    else {
      const other = merged[index]
      merged[index] = clampDiscount({
        ...other,
        quantity: roundTo(other.quantity + line.quantity, 3),
        discount: roundTo(other.discount + line.discount, 2)
      })
    }
  }
  return merged
}

// The cart lives in memory for the whole session, so switching screens never loses a sale in progress.
export const useCartStore = create<CartState>((set, get) => ({
  ...EMPTY,

  add: (product) => {
    const { lines } = get()
    if (quantityInCart(lines, product.id) + 1 > maxQuantity(product)) return false
    // A new unit joins the plain line; lines carrying a note are left alone.
    const plain = lines.find((line) => line.product.id === product.id && line.note === '')
    set({
      lines: plain
        ? lines.map((line) =>
            line.id === plain.id ? { ...line, product, quantity: roundTo(line.quantity + 1, 3) } : line
          )
        : [...lines, { id: nextLineId(), product, quantity: 1, discount: 0, note: '' }]
    })
    return true
  },

  setQuantity: (lineId, quantity) =>
    set((state) => ({
      lines: state.lines.map((line) => {
        if (line.id !== lineId) return line
        const available =
          maxQuantity(line.product) - quantityInCart(state.lines, line.product.id, lineId)
        return clampDiscount({
          ...line,
          quantity: roundTo(Math.min(Math.max(quantity, 0), Math.max(available, 0)), 3)
        })
      })
    })),

  setLineDiscount: (lineId, discount) =>
    set((state) => ({
      lines: state.lines.map((line) =>
        line.id === lineId ? clampDiscount({ ...line, discount: roundTo(discount, 2) }) : line
      )
    })),

  setLineNote: (lineId, note, count) =>
    set((state) => {
      const lines = state.lines.flatMap((line): CartLine[] => {
        if (line.id !== lineId) return [line]
        if (count >= line.quantity) return [{ ...line, note }]
        const rest = clampDiscount({ ...line, quantity: roundTo(line.quantity - count, 3) })
        const noted: CartLine = {
          id: nextLineId(),
          product: line.product,
          quantity: count,
          discount: roundTo(line.discount - rest.discount, 2),
          note
        }
        return [rest, noted]
      })
      return { lines: mergeLines(lines) }
    }),

  remove: (lineId) => set((state) => ({ lines: state.lines.filter((line) => line.id !== lineId) })),

  setCustomer: (customerId) => set({ customerId }),

  setOrderType: (orderType) => set({ orderType }),

  setDiscount: (discountMode, discountValue) =>
    set({ discountMode, discountValue: Math.max(discountValue, 0) }),

  load: (held) => {
    const lines: CartLine[] = []
    for (const item of held.items) {
      if (!item.product.isActive) continue
      // Stock may have dropped while the cart was parked.
      const available = maxQuantity(item.product) - quantityInCart(lines, item.product.id)
      const quantity = roundTo(Math.min(item.quantity, available), 3)
      if (quantity <= 0) continue
      lines.push(
        clampDiscount({
          id: nextLineId(),
          product: item.product,
          quantity,
          discount: item.discount,
          note: item.note ?? ''
        })
      )
    }
    set({
      lines: mergeLines(lines),
      customerId: held.customerId,
      orderType: held.orderType ?? DEFAULT_ORDER_TYPE,
      discountMode: 'amount',
      discountValue: held.discount
    })
  },

  clear: () => set(EMPTY)
}))
