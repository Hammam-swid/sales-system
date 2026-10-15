import { useEffect, useState } from 'react'
import type { AppInfo } from '../../../shared/ipc'
import { can } from '../../../shared/permissions'
import { api } from '../lib/api'
import { NAV_ITEMS } from '../navigation'
import { useAuthStore, useCan } from '../store/auth'

export function useHomePage() {
  const user = useAuthStore((state) => state.user)
  const canSeeSystemInfo = useCan('settings.manage')
  const [info, setInfo] = useState<AppInfo | null>(null)

  useEffect(() => {
    if (!canSeeSystemInfo) return
    void api('app:info').then((result) => {
      if (result.ok) setInfo(result.data)
    })
  }, [canSeeSystemInfo])

  const shortcuts = user
    ? NAV_ITEMS.filter(
        (item) => item.path !== '/' && (!item.permission || can(user.role, item.permission))
      )
    : []

  return { user, info, shortcuts }
}
