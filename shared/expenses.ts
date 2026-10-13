// Types for the expenses module.

export interface ExpenseCategoryDto {
  id: number
  name: string
  expenseCount: number
}

export interface SaveExpenseCategoryRequest {
  // Omit to create.
  id?: number
  name: string
}

export interface ExpenseDto {
  id: number
  categoryId: number | null
  categoryName: string | null
  amount: number
  // The day the expense belongs to, as YYYY-MM-DD.
  expenseDate: string
  note: string | null
  userName: string | null
  createdAt: string
}

export interface SaveExpenseRequest {
  // Omit to create.
  id?: number
  categoryId: number
  amount: number
  expenseDate: string
  note: string | null
}

export interface ListExpensesRequest {
  // Inclusive bounds, YYYY-MM-DD. Omit either for an open range.
  from?: string | null
  to?: string | null
  categoryId?: number | null
  // Matches the note.
  search?: string
  page?: number
  pageSize?: number
}

export interface ListExpensesResponse {
  items: ExpenseDto[]
  total: number
  page: number
  pageSize: number
  // Sum of every expense matching the filter, not just this page.
  totalAmount: number
}
