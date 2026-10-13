import { changeOwnPassword, currentUser, login, logout } from '../services/auth.service'
import { createFirstOwner, setupStatus } from '../services/setup.service'
import { handle } from './handle'

export function registerAuthIpc(): void {
  handle('auth:login', { public: true }, (payload) => login(payload))
  handle('auth:logout', { public: true }, () => logout())
  handle('auth:me', { public: true }, () => currentUser())
  handle('auth:changePassword', {}, (payload, user) => changeOwnPassword(payload, user))

  // First run only; createFirstOwner refuses once any account exists.
  handle('setup:status', { public: true }, () => setupStatus())
  handle('setup:createOwner', { public: true }, (payload) => createFirstOwner(payload))
}
