// Contract between the renderer and the main process.
// Every IPC channel is declared here once, with its request and response types.
import type { UserRole } from './permissions'

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
  'users:resetPassword'
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
