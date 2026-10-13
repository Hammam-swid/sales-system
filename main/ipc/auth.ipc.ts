import { changeOwnPassword, currentUser, login, logout } from '../services/auth.service'
import { handle } from './handle'

export function registerAuthIpc(): void {
  handle('auth:login', { public: true }, (payload) => login(payload))
  handle('auth:logout', { public: true }, () => logout())
  handle('auth:me', { public: true }, () => currentUser())
  handle('auth:changePassword', {}, (payload, user) => changeOwnPassword(payload, user))
}
