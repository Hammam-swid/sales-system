import { create } from 'zustand'
import { roundTo, type HeldSaleDto, type PosProduct } from '../../../shared/sales'

export interface CartLine {
  product: PosProduct
  quantity: number
  // Absolute amount taken off this line.
  discount: number
}

export type DiscountMode = 'amount' | 'percent'

interface CartState {
  lines: CartLine[]
  customerId: number | null
  discountMode: DiscountMode
  // An amount, or a percentage when discountMode is 'percent'.
  discountValue: number
  // Returns false when the product has no stock left to add.
  add: (product: PosProduct) => boolean
  setQuantity: (productId: number, quantity: number) => void
  setLineDiscount: (productId: number, discount: number) => void
  remove: (productId: number) => void
  setCustomer: (customerId: number | null) => void
  setDiscount: (mode: DiscountMode, value: number) => void
  load: (held: HeldSaleDto) => void
  clear: () => void
}

const EMPTY = { lines: [], customerId: null, discountMode: 'amount' as DiscountMode, discountValue: 0 }

// Whole units for countable goods; weights and lengths may be fractional.
export function quantityStep(unit: string): number {
  return ['kg', 'g', 'liter', 'meter'].includes(unit) ? 0.25 : 1
}

function clampDiscount(line: CartLine): CartLine {
  const gross = roundTo(line.quantity * line.product.salePrice, 2)
  return { ...line, discount: Math.min(Math.max(line.discount, 0), gross) }
}

// The cart lives in memory for the whole session, so switching screens never loses a sale in progress.
export const useCartStore = create<CartState>((set, get) => ({
  ...EMPTY,

  add: (product) => {
    const existing = get().lines.find((line) => line.product.id === product.id)
    const wanted = (existing?.quantity ?? 0) + 1
    if (wanted > product.quantity) return false
    set((state) => ({
      lines: existing
        ? state.lines.map((line) =>
            line.product.id === product.id ? { ...line, product, quantity: wanted } : line
          )
        : [...state.lines, { product, quantity: 1, discount: 0 }]
    }))
    return true
  },

  setQuantity: (productId, quantity) =>
    set((state) => ({
      lines: state.lines.map((line) =>
        line.product.id === productId
          ? clampDiscount({
              ...line,
              quantity: roundTo(Math.min(Math.max(quantity, 0), line.product.quantity), 3)
            })
          : line
      )
    })),

  setLineDiscount: (productId, discount) =>
    set((state) => ({
      lines: state.lines.map((line) =>
        line.product.id === productId ? clampDiscount({ ...line, discount: roundTo(discount, 2) }) : line
      )
    })),

  remove: (productId) =>
    set((state) => ({ lines: state.lines.filter((line) => line.product.id !== productId) })),

  setCustomer: (customerId) => set({ customerId }),

  setDiscount: (discountMode, discountValue) =>
    set({ discountMode, discountValue: Math.max(discountValue, 0) }),

  load: (held) =>
    set({
      lines: held.items
        .filter((item) => item.product.isActive && item.product.quantity > 0)
        .map((item) =>
          clampDiscount({
            product: item.product,
            quantity: Math.min(item.quantity, item.product.quantity),
            discount: item.discount
          })
        ),
      customerId: held.customerId,
      discountMode: 'amount',
      discountValue: held.discount
    }),

  clear: () => set(EMPTY)
}))
