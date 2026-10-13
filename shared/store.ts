// The kind of shop, chosen once at first-run setup, and what it switches on.

export const STORE_TYPES = [
  'general',
  'grocery',
  'cleaning',
  'electronics',
  'cafe',
  'cafe_fast_food'
] as const
export type StoreType = (typeof STORE_TYPES)[number]

export const STORE_FEATURES = [
  // An expiry date on each product, with an "expiring soon" warning.
  'expiryDates',
  // A warranty period on each product, printed on the receipt.
  'warranty',
  // Products sold without keeping a stock quantity (drinks, meals).
  'untrackedItems',
  // Category buttons above the products on the checkout screen.
  'posCategories',
  // Dine-in / takeaway / delivery on each sale.
  'orderTypes',
  // A note on each sold line, such as "no sugar".
  'lineNotes',
  // A short daily order number called out to the customer.
  'orderNumbers'
] as const
export type StoreFeature = (typeof STORE_FEATURES)[number]

const CAFE_FEATURES: StoreFeature[] = [
  'untrackedItems',
  'posCategories',
  'orderTypes',
  'lineNotes',
  'orderNumbers'
]

export const STORE_TYPE_PRESETS: Record<StoreType, readonly StoreFeature[]> = {
  general: [],
  grocery: ['expiryDates'],
  cleaning: ['expiryDates'],
  electronics: ['warranty'],
  cafe: CAFE_FEATURES,
  cafe_fast_food: CAFE_FEATURES
}

export function toStoreType(value: string | undefined): StoreType {
  return STORE_TYPES.includes(value as StoreType) ? (value as StoreType) : 'general'
}

export function hasFeature(storeType: StoreType, feature: StoreFeature): boolean {
  return STORE_TYPE_PRESETS[storeType].includes(feature)
}

export const ORDER_TYPES = ['dine_in', 'takeaway', 'delivery'] as const
export type OrderType = (typeof ORDER_TYPES)[number]

// Order numbers run 001..500, then start again.
export const ORDER_NUMBER_MAX = 500

export function formatOrderNumber(orderNumber: number): string {
  return String(orderNumber).padStart(3, '0')
}

// Products expiring within this many days are flagged.
export const EXPIRY_WARNING_DAYS = 30

export const MAX_WARRANTY_MONTHS = 120
// Room for every ready-made option of a category picked at once.
export const MAX_LINE_NOTE_LENGTH = 700

// Today's date on this computer as YYYY-MM-DD, optionally shifted by whole days.
export function localDate(offsetDays = 0, now = new Date()): string {
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offsetDays)
  const month = String(day.getMonth() + 1).padStart(2, '0')
  return `${day.getFullYear()}-${month}-${String(day.getDate()).padStart(2, '0')}`
}

// The last day of a warranty that started on `soldAt`, as YYYY-MM-DD.
export function warrantyEnd(soldAt: string, months: number): string {
  const start = new Date(soldAt)
  const end = new Date(start.getFullYear(), start.getMonth() + months, start.getDate())
  return localDate(0, end)
}
