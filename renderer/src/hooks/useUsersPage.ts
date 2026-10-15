import { useCallback, useEffect, useState } from 'react'
import type { UserDto } from '../../../shared/ipc'
import { USER_ROLES } from '../../../shared/permissions'
import { api, errorText } from '../lib/api'
import { useAuthStore } from '../store/auth'

export type UsersDialog =
  | { kind: 'create' }
  | { kind: 'edit'; user: UserDto }
  | { kind: 'reset'; user: UserDto }
  | null

export function useUsersPage() {
  const me = useAuthStore((state) => state.user)
  const setMe = useAuthStore((state) => state.setUser)
  const [users, setUsers] = useState<UserDto[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [dialog, setDialog] = useState<UsersDialog>(null)

  const load = useCallback(async () => {
    const result = await api('users:list')
    if (result.ok) {
      setUsers(result.data)
      setError(null)
    } else {
      setError(errorText(result))
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  // Managers can see owners but only an owner may change them.
  const canManage = (user: UserDto) => user.role !== 'owner' || me?.role === 'owner'
  const assignableRoles = USER_ROLES.filter((role) => role !== 'owner' || me?.role === 'owner')

  const finish = (message: string, updated?: UserDto) => {
    setDialog(null)
    setNotice(message)
    if (updated && updated.id === me?.id) setMe(updated)
    void load()
  }

  return {
    me,
    users,
    error,
    notice,
    dialog,
    openDialog: setDialog,
    closeDialog: () => setDialog(null),
    canManage,
    assignableRoles,
    finish
  }
}
