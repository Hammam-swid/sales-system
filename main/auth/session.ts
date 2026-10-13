import type { UserRole } from '../../shared/permissions'

export interface SessionUser {
  id: number
  role: UserRole
}

// The app is single-window and single-user, so one in-memory session is enough.
// It lives in the main process only: the renderer can never claim to be someone else.
let current: SessionUser | null = null

export function getSession(): SessionUser | null {
  return current
}

export function setSession(user: SessionUser): void {
  current = user
}

export function clearSession(): void {
  current = null
}
