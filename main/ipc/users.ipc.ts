import { createUser, listUsers, resetPassword, updateUser } from '../services/users.service'
import { handle } from './handle'

export function registerUsersIpc(): void {
  handle('users:list', { permission: 'users.manage' }, () => listUsers())
  handle('users:create', { permission: 'users.manage' }, (payload, user) => createUser(payload, user))
  handle('users:update', { permission: 'users.manage' }, (payload, user) => updateUser(payload, user))
  handle('users:resetPassword', { permission: 'users.manage' }, (payload, user) =>
    resetPassword(payload, user)
  )
}
