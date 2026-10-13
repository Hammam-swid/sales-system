import { PASSWORD_MIN_LENGTH } from '../../shared/ipc'
import { USER_ROLES, type UserRole } from '../../shared/permissions'
import { AppError } from '../errors'

// IPC payloads come from the renderer and are untyped at runtime, so every field is checked.

export function asObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null) throw new AppError('VALIDATION', 'payload')
  return value as Record<string, unknown>
}

export function asText(value: unknown, field: string, maxLength = 100): string {
  if (typeof value !== 'string') throw new AppError('VALIDATION', field)
  const text = value.trim()
  if (text.length === 0 || text.length > maxLength) throw new AppError('VALIDATION', field)
  return text
}

export function asId(value: unknown, field = 'id'): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new AppError('VALIDATION', field)
  }
  return value
}

export function asOptionalId(value: unknown, field: string): number | null {
  return value === null || value === undefined ? null : asId(value, field)
}

// Empty or missing text becomes null.
export function asOptionalText(value: unknown, field: string, maxLength = 100): string | null {
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') throw new AppError('VALIDATION', field)
  const text = value.trim()
  if (text.length > maxLength) throw new AppError('VALIDATION', field)
  return text.length === 0 ? null : text
}

// A finite, non-negative number rounded to `decimals` places.
export function asAmount(value: unknown, field: string, decimals = 2, max = 1e9): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) {
    throw new AppError('VALIDATION', field)
  }
  return roundTo(value, decimals)
}

export function asOneOf<T extends string>(value: unknown, options: readonly T[], field: string): T {
  if (!options.includes(value as T)) throw new AppError('VALIDATION', field)
  return value as T
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}

export function asBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') throw new AppError('VALIDATION', field)
  return value
}

export function asRole(value: unknown): UserRole {
  if (!USER_ROLES.includes(value as UserRole)) throw new AppError('VALIDATION', 'role')
  return value as UserRole
}

// Passwords are not trimmed: spaces are legitimate characters.
export function asPassword(value: unknown, field = 'password'): string {
  if (typeof value !== 'string' || value.length < PASSWORD_MIN_LENGTH || value.length > 200) {
    throw new AppError('VALIDATION', field)
  }
  return value
}

export function asUsername(value: unknown): string {
  const username = asText(value, 'username', 32).toLowerCase()
  if (!/^[a-z0-9._-]{3,32}$/.test(username)) throw new AppError('VALIDATION', 'username')
  return username
}
