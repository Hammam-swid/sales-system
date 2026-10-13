// Contract between the renderer and the main process.
// Every IPC channel is declared here once, with its request and response types.
import type {
  AdjustStockRequest,
  CategoryDto,
  DeleteProductResponse,
  ListProductsRequest,
  ListProductsResponse,
  ProductDto,
  SaveCategoryRequest,
  SaveProductRequest,
  StockMovementDto
} from './catalog'
import type {
  ExpenseCategoryDto,
  ExpenseDto,
  ListExpensesRequest,
  ListExpensesResponse,
  SaveExpenseCategoryRequest,
  SaveExpenseRequest
} from './expenses'
import type {
  CreatePurchaseRequest,
  ListPurchasesRequest,
  ListPurchasesResponse,
  PartyDto,
  PartyPaymentRequest,
  PurchaseDto,
  SavePartyRequest,
  StatementDto
} from './parties'
import type { UserRole } from './permissions'
import type {
  AppSettings,
  BackupConfig,
  BackupFile,
  BackupStatus,
  CreateBackupRequest,
  Language,
  RestoreBackupRequest,
  SaveSettingsRequest
} from './settings'
import type {
  BalancesReport,
  DateRangeRequest,
  ExportExcelRequest,
  ExportResult,
  ProductsReport,
  ProfitReport,
  SalesReport,
  SalesReportRequest
} from './reports'
import type {
  CheckoutRequest,
  CustomerDto,
  HeldSaleDto,
  HoldSaleRequest,
  ListSalesRequest,
  ListSalesResponse,
  ReturnSaleRequest,
  ReturnSaleResponse,
  SaleDto
} from './sales'

export interface TableInfo {
  name: string
  rows: number
}

export interface AppInfo {
  appVersion: string
  dbPath: string
  migrations: string[]
  tables: TableInfo[]
}

// A user as the renderer sees it: never includes the password hash.
export interface UserDto {
  id: number
  fullName: string
  username: string
  role: UserRole
  isActive: boolean
  createdAt: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface CreateUserRequest {
  fullName: string
  username: string
  password: string
  role: UserRole
}

export interface UpdateUserRequest {
  id: number
  fullName: string
  role: UserRole
  isActive: boolean
}

export interface ResetPasswordRequest {
  id: number
  newPassword: string
}

export interface IpcChannels {
  'app:info': { request: void; response: AppInfo }
  'auth:login': { request: LoginRequest; response: UserDto }
  'auth:logout': { request: void; response: null }
  'auth:me': { request: void; response: UserDto | null }
  'auth:changePassword': { request: ChangePasswordRequest; response: null }
  'users:list': { request: void; response: UserDto[] }
  'users:create': { request: CreateUserRequest; response: UserDto }
  'users:update': { request: UpdateUserRequest; response: UserDto }
  'users:resetPassword': { request: ResetPasswordRequest; response: null }
  'settings:get': { request: void; response: AppSettings }
  'settings:save': { request: SaveSettingsRequest; response: AppSettings }
  // Readable before sign-in, so the login screen appears in the shop's language.
  'app:locale': { request: void; response: { language: Language } }
  'backup:status': { request: void; response: BackupStatus }
  'backup:saveConfig': { request: BackupConfig; response: BackupStatus }
  'backup:chooseFolder': { request: void; response: { path: string | null } }
  // null when the user cancelled the save dialog.
  'backup:create': { request: CreateBackupRequest; response: BackupFile | null }
  'backup:restore': { request: RestoreBackupRequest; response: { restored: boolean } }
  'categories:list': { request: void; response: CategoryDto[] }
  'categories:save': { request: SaveCategoryRequest; response: CategoryDto }
  'categories:delete': { request: { id: number }; response: null }
  'products:list': { request: ListProductsRequest; response: ListProductsResponse }
  'products:save': { request: SaveProductRequest; response: ProductDto }
  'products:delete': { request: { id: number }; response: DeleteProductResponse }
  'products:adjustStock': { request: AdjustStockRequest; response: ProductDto }
  'products:movements': { request: { productId: number }; response: StockMovementDto[] }
  'customers:list': { request: { search?: string }; response: CustomerDto[] }
  'customers:save': { request: SavePartyRequest; response: PartyDto }
  'customers:delete': { request: { id: number }; response: null }
  'customers:statement': { request: { id: number }; response: StatementDto }
  'customers:pay': { request: PartyPaymentRequest; response: PartyDto }
  'customers:recalculate': { request: { id: number }; response: PartyDto }
  'suppliers:list': { request: { search?: string }; response: PartyDto[] }
  'suppliers:save': { request: SavePartyRequest; response: PartyDto }
  'suppliers:delete': { request: { id: number }; response: null }
  'suppliers:statement': { request: { id: number }; response: StatementDto }
  'suppliers:pay': { request: PartyPaymentRequest; response: PartyDto }
  'suppliers:recalculate': { request: { id: number }; response: PartyDto }
  'purchases:list': { request: ListPurchasesRequest; response: ListPurchasesResponse }
  'purchases:get': { request: { id: number }; response: PurchaseDto }
  'purchases:create': { request: CreatePurchaseRequest; response: PurchaseDto }
  'expenseCategories:list': { request: void; response: ExpenseCategoryDto[] }
  'expenseCategories:save': { request: SaveExpenseCategoryRequest; response: ExpenseCategoryDto }
  'expenseCategories:delete': { request: { id: number }; response: null }
  'expenses:list': { request: ListExpensesRequest; response: ListExpensesResponse }
  'expenses:save': { request: SaveExpenseRequest; response: ExpenseDto }
  'expenses:delete': { request: { id: number }; response: null }
  'reports:sales': { request: SalesReportRequest; response: SalesReport }
  'reports:profit': { request: DateRangeRequest; response: ProfitReport }
  'reports:products': { request: DateRangeRequest; response: ProductsReport }
  'reports:balances': { request: void; response: BalancesReport }
  'export:excel': { request: ExportExcelRequest; response: ExportResult }
  'export:pdf': { request: { fileName: string }; response: ExportResult }
  'sales:checkout': { request: CheckoutRequest; response: SaleDto }
  'sales:hold': { request: HoldSaleRequest; response: { id: number } }
  'sales:held': { request: void; response: HeldSaleDto[] }
  'sales:resumeHeld': { request: { id: number }; response: HeldSaleDto }
  'sales:discardHeld': { request: { id: number }; response: null }
  'sales:list': { request: ListSalesRequest; response: ListSalesResponse }
  'sales:get': { request: { id: number }; response: SaleDto }
  'sales:return': { request: ReturnSaleRequest; response: ReturnSaleResponse }
}

export type IpcChannel = keyof IpcChannels

// Runtime allowlist used by the preload script.
export const IPC_CHANNELS: readonly IpcChannel[] = [
  'app:info',
  'auth:login',
  'auth:logout',
  'auth:me',
  'auth:changePassword',
  'users:list',
  'users:create',
  'users:update',
  'users:resetPassword',
  'settings:get',
  'settings:save',
  'app:locale',
  'backup:status',
  'backup:saveConfig',
  'backup:chooseFolder',
  'backup:create',
  'backup:restore',
  'categories:list',
  'categories:save',
  'categories:delete',
  'products:list',
  'products:save',
  'products:delete',
  'products:adjustStock',
  'products:movements',
  'customers:list',
  'customers:save',
  'customers:delete',
  'customers:statement',
  'customers:pay',
  'customers:recalculate',
  'suppliers:list',
  'suppliers:save',
  'suppliers:delete',
  'suppliers:statement',
  'suppliers:pay',
  'suppliers:recalculate',
  'purchases:list',
  'purchases:get',
  'purchases:create',
  'expenseCategories:list',
  'expenseCategories:save',
  'expenseCategories:delete',
  'expenses:list',
  'expenses:save',
  'expenses:delete',
  'reports:sales',
  'reports:profit',
  'reports:products',
  'reports:balances',
  'export:excel',
  'export:pdf',
  'sales:checkout',
  'sales:hold',
  'sales:held',
  'sales:resumeHeld',
  'sales:discardHeld',
  'sales:list',
  'sales:get',
  'sales:return'
]

// Stable, language-neutral error codes; the renderer translates them for display.
export type ErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_DISABLED'
  | 'VALIDATION'
  | 'USERNAME_TAKEN'
  | 'WRONG_PASSWORD'
  | 'NOT_FOUND'
  | 'LAST_OWNER'
  | 'SELF_LOCKOUT'
  | 'BARCODE_TAKEN'
  | 'CATEGORY_IN_USE'
  | 'CATEGORY_NESTING'
  | 'INSUFFICIENT_STOCK'
  | 'PRODUCT_UNAVAILABLE'
  | 'CUSTOMER_REQUIRED'
  | 'RETURN_EXCEEDS'
  | 'RECORD_IN_USE'
  | 'PAYMENT_EXCEEDS'
  | 'INVALID_BACKUP'
  | 'BACKUP_FAILED'
  | 'INTERNAL'

export type IpcResult<T> = { ok: true; data: T } | { ok: false; error: string; code: ErrorCode }

type IpcArgs<C extends IpcChannel> = IpcChannels[C]['request'] extends void
  ? []
  : [payload: IpcChannels[C]['request']]

export interface Api {
  invoke<C extends IpcChannel>(
    channel: C,
    ...args: IpcArgs<C>
  ): Promise<IpcResult<IpcChannels[C]['response']>>
}

export const PASSWORD_MIN_LENGTH = 6
