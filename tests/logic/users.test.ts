import { describe, expect, it } from 'vitest'
import { getSession } from '../../main/auth/session'
import { changeOwnPassword, login } from '../../main/services/auth.service'
import { createUser, listUsers, resetPassword, updateUser } from '../../main/services/users.service'
import { can } from '../../shared/permissions'
import { expectError, freshShop } from './helpers'

describe('users and sign-in', () => {
  it('signs in with the right password only, case-insensitive username', async () => {
    await freshShop()
    const user = await login({ username: ' OWNER ', password: 'owner123' })
    expect(user.username).toBe('owner')
    expect(getSession()).toMatchObject({ id: user.id, role: 'owner' })
    await expectError(login({ username: 'owner', password: 'wrong' }), 'INVALID_CREDENTIALS')
  })

  it('refuses disabled accounts and duplicate usernames', async () => {
    const { owner, cashier } = await freshShop()
    await expectError(
      createUser({ fullName: 'Again', username: 'cashier', password: 'secret12', role: 'cashier' }, owner),
      'USERNAME_TAKEN'
    )
    await updateUser({ id: cashier.id, fullName: 'Cashier', role: 'cashier', isActive: false }, owner)
    await expectError(login({ username: 'cashier', password: 'cashier123' }), 'ACCOUNT_DISABLED')
  })

  it('protects the last owner and stops users locking themselves out', async () => {
    const { owner } = await freshShop()
    await expectError(
      updateUser({ id: owner.id, fullName: 'Owner', role: 'manager', isActive: true }, owner),
      'SELF_LOCKOUT'
    )
    const manager = await createUser(
      { fullName: 'Manager', username: 'manager', password: 'secret12', role: 'manager' },
      owner
    )
    await expectError(
      createUser({ fullName: 'Boss', username: 'boss', password: 'secret12', role: 'owner' }, {
        id: manager.id,
        role: 'manager'
      }),
      'FORBIDDEN'
    )
    expect((await listUsers()).map((u) => u.role).sort()).toEqual(['cashier', 'manager', 'owner'])
  })

  it('changes and resets passwords with the length rule', async () => {
    const { owner, cashier } = await freshShop()
    await login({ username: 'cashier', password: 'cashier123' })
    await expectError(changeOwnPassword({ currentPassword: 'nope', newPassword: 'newpass1' }, cashier), 'WRONG_PASSWORD')
    await expectError(changeOwnPassword({ currentPassword: 'cashier123', newPassword: '123' }, cashier), 'VALIDATION')
    await changeOwnPassword({ currentPassword: 'cashier123', newPassword: 'newpass1' }, cashier)
    await login({ username: 'cashier', password: 'newpass1' })

    await resetPassword({ id: cashier.id, newPassword: 'reset123' }, owner)
    await login({ username: 'cashier', password: 'reset123' })
  })

  it('limits cashiers to selling and browsing', () => {
    expect(can('cashier', 'pos.sell')).toBe(true)
    expect(can('cashier', 'products.view')).toBe(true)
    for (const permission of ['products.manage', 'settings.manage', 'sales.return', 'inventory.adjust'] as const) {
      expect(can('cashier', permission)).toBe(false)
    }
    expect(can('manager', 'settings.manage')).toBe(true)
  })
})
