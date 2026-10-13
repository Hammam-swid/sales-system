import { create } from 'zustand'
import type { UserDto } from '../../../shared/ipc'
import { can, type Permission } from '../../../shared/permissions'

interface AuthState {
  // 'loading' until the main process has been asked who is signed in.
  status: 'loading' | 'ready'
  user: UserDto | null
  init: () => Promise<void>
  setUser: (user: UserDto) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  init: async () => {
    const result = await window.api.invoke('auth:me')
    set({ status: 'ready', user: result.ok ? result.data : null })
  },
  setUser: (user) => set({ user }),
  clear: () => set({ user: null })
}))

// UI-only check; the main process enforces the same rule on every call.
export function useCan(permission: Permission): boolean {
  const role = useAuthStore((state) => state.user?.role)
  return role ? can(role, permission) : false
}
