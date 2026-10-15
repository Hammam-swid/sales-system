// Time budgets, in milliseconds, for the slowest acceptable run (p95).
// An operation over its budget is reported as "over", not as a test failure.
export const BUDGETS: Record<string, number> = {
  'Open database (migrations already applied)': 1_000,
  'Product search by name': 100,
  'Product search by barcode': 100,
  'Products: low-stock filter': 100,
  'Products: expiring filter': 100,
  'Checkout (5 lines)': 100,
  'Invoices: first page': 100,
  'Invoices: search by number': 100,
  'Open one invoice': 100,
  'Customer statement (busiest customer)': 500,
  'Sales report: one month by day': 1_500,
  'Sales report: one year by month': 1_500,
  'Profit report: one year': 1_500,
  'Products report: one year': 1_500,
  'Balances report': 1_500,
  'Backup to folder': 5_000,
  'App start to sign-in screen': 4_000,
  'Sign-in to home screen': 2_000,
  'POS: typing to products shown': 500
}
