import { useCallback, useEffect, useRef, useState } from 'react'
import { noteOptionsFor, type CategoryDto } from '../../../../shared/catalog'
import {
  computeTotals,
  lineTotal,
  roundTo,
  type CustomerDto,
  type HeldSaleDto,
  type HoldSaleRequest,
  type PosProduct
} from '../../../../shared/sales'
import { localDate } from '../../../../shared/store'
import { t } from '../../i18n'
import { api, errorText } from '../../lib/api'
import { formatMoney } from '../../lib/format'
import {
  maxQuantity,
  quantityInCart,
  quantityStep,
  useCartStore,
  type CartLine
} from '../../store/cart'
import { useFeature, useSettingsStore } from '../../store/settings'

const RESULT_LIMIT = 30
const SEARCH_DEBOUNCE_MS = 200

export type PosDialog = 'payment' | 'held' | null

// A cart line with what the screen shows next to it.
export interface CartLineView {
  line: CartLine
  // How much one press of + or − changes the quantity.
  step: number
  // The most this line may hold: stock is shared by every line of the same product.
  max: number
  atMax: boolean
  // Ready-made notes for the product's category; empty when notes are off.
  noteOptions: string[]
  total: number
}

export function usePosPage() {
  const { currency, taxRate } = useSettingsStore((state) => state.settings)
  const cart = useCartStore()
  const money = (value: number) => formatMoney(value, currency)

  const posCategories = useFeature('posCategories')
  const orderTypes = useFeature('orderTypes')
  const lineNotes = useFeature('lineNotes')

  const [query, setQuery] = useState('')
  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [noteLineId, setNoteLineId] = useState<number | null>(null)
  const [products, setProducts] = useState<PosProduct[] | null>(null)
  const [customers, setCustomers] = useState<CustomerDto[]>([])
  const [heldCount, setHeldCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [dialog, setDialog] = useState<PosDialog>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const requestId = useRef(0)

  const fetchProducts = useCallback(
    async (search: string): Promise<PosProduct[] | null> => {
      const current = ++requestId.current
      const result = await api('products:list', {
        search,
        // A typed search or scanned barcode looks in every category.
        categoryId: search === '' ? categoryId : null,
        status: 'active',
        pageSize: RESULT_LIMIT
      })
      if (current !== requestId.current) return null
      if (!result.ok) {
        setError(errorText(result))
        return null
      }
      setProducts(result.data.items)
      return result.data.items
    },
    [categoryId]
  )

  const refreshSideData = useCallback(async () => {
    const [customersResult, heldResult] = await Promise.all([
      api('customers:list', {}),
      api('sales:held')
    ])
    if (customersResult.ok) setCustomers(customersResult.data)
    if (heldResult.ok) setHeldCount(heldResult.data.length)
  }, [])

  useEffect(() => {
    void refreshSideData()
  }, [refreshSideData])

  useEffect(() => {
    if (!posCategories && !lineNotes) return
    void api('categories:list').then((result) => {
      if (result.ok) setCategories(result.data)
    })
  }, [posCategories, lineNotes])

  useEffect(() => {
    const timer = setTimeout(() => void fetchProducts(query.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query, fetchProducts])

  const focusSearch = () => searchRef.current?.focus()
  const topCategories = categories.filter((category) => category.parentId === null)
  const noteLine = cart.lines.find((line) => line.id === noteLineId) ?? null

  const addProduct = (product: PosProduct) => {
    setNotice(null)
    if (!cart.add(product)) setError(`${product.name}: ${t.errors.INSUFFICIENT_STOCK}`)
    // Still sellable, but the cashier should know before handing it over.
    else if (product.expiryDate !== null && product.expiryDate < localDate()) {
      setError(t.pos.expiredProduct(product.name))
    } else setError(null)
  }

  const pickProduct = (product: PosProduct) => {
    addProduct(product)
    focusSearch()
  }

  // A barcode scanner types the code and presses Enter: add the match straight to the cart.
  const submitSearch = async () => {
    const term = query.trim()
    if (term === '') return
    const items = await fetchProducts(term)
    if (!items) return
    const match = items.find((item) => item.barcode === term) ?? (items.length === 1 ? items[0] : null)
    if (match) {
      addProduct(match)
      setQuery('')
    }
  }

  const chooseCategory = (id: number | null) => {
    setCategoryId(id)
    setQuery('')
  }

  const amounts = cart.lines.map((line) => ({
    quantity: line.quantity,
    unitPrice: line.product.salePrice,
    discount: line.discount
  }))
  const subtotal = computeTotals(amounts, 0, 0).subtotal
  const discountAmount =
    cart.discountMode === 'percent'
      ? roundTo((subtotal * Math.min(cart.discountValue, 100)) / 100, 2)
      : cart.discountValue
  const totals = computeTotals(amounts, discountAmount, taxRate)
  const sellable = cart.lines.filter((line) => line.quantity > 0)
  const customer = customers.find((candidate) => candidate.id === cart.customerId) ?? null

  const lines: CartLineView[] = cart.lines.map((line) => {
    const max = roundTo(
      maxQuantity(line.product) - quantityInCart(cart.lines, line.product.id, line.id),
      3
    )
    return {
      line,
      step: quantityStep(line.product.unit),
      max,
      atMax: line.quantity >= max,
      noteOptions: lineNotes ? noteOptionsFor(categories, line.product.categoryId) : [],
      total: lineTotal({
        quantity: line.quantity,
        unitPrice: line.product.salePrice,
        discount: line.discount
      })
    }
  })

  const cartPayload = (): HoldSaleRequest => ({
    items: sellable.map((line) => ({
      productId: line.product.id,
      quantity: line.quantity,
      discount: line.discount,
      note: lineNotes && line.note.trim() !== '' ? line.note.trim() : null
    })),
    discount: totals.discount,
    customerId: cart.customerId,
    orderType: orderTypes ? cart.orderType : null
  })

  const hold = async () => {
    const result = await api('sales:hold', cartPayload())
    if (!result.ok) {
      setError(errorText(result))
      return
    }
    cart.clear()
    setError(null)
    setNotice(t.pos.held)
    setHeldCount((count) => count + 1)
    focusSearch()
  }

  const clearCart = () => {
    cart.clear()
    focusSearch()
  }

  const openPayment = () => {
    setError(null)
    setNotice(null)
    setDialog('payment')
  }

  const afterSale = () => {
    setDialog(null)
    void fetchProducts(query.trim())
    void refreshSideData()
    focusSearch()
  }

  const resumeHeld = (held: HeldSaleDto) => {
    cart.load(held)
    const dropped = held.items.length - useCartStore.getState().lines.length
    setNotice(dropped > 0 ? t.pos.unavailableDropped : null)
    setError(null)
  }

  return {
    cart,
    money,
    taxRate,
    posCategories,
    orderTypes,
    query,
    setQuery,
    searchRef,
    submitSearch,
    topCategories,
    categoryId,
    chooseCategory,
    products,
    pickProduct,
    customers,
    customer,
    heldCount,
    error,
    notice,
    lines,
    totals,
    canCheckout: sellable.length > 0,
    hold,
    clearCart,
    openPayment,
    dialog,
    openHeld: () => setDialog('held'),
    afterSale,
    resumeHeld,
    cartPayload,
    noteLine,
    noteLineOptions: noteLine ? noteOptionsFor(categories, noteLine.product.categoryId) : [],
    openNote: setNoteLineId,
    closeNote: () => setNoteLineId(null)
  }
}
