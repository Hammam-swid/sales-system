import { create } from 'zustand'
import type { SaleDto } from '../../../shared/sales'

interface PrintState {
  // The invoice currently being printed, if any.
  sale: SaleDto | null
  print: (sale: SaleDto) => void
  done: () => void
}

export const usePrintStore = create<PrintState>((set) => ({
  sale: null,
  print: (sale) => set({ sale }),
  done: () => set({ sale: null })
}))
