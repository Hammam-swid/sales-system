import { create } from 'zustand'
import type { UserDto } from '../../../shared/ipc'
import { can, type Permission } from '../../../shared/permissions'
import { switchLanguage } from '../i18n'

interface AuthState {
  // 'loading' until the main process has been asked who is signed in;
  // 'setup' when the installation has no accounts yet.
  status: 'loading' | 'setup' | 'ready'
  user: UserDto | null
  init: () => Promise<void>
  setUser: (user: UserDto) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  init: async () => {
    // A fresh installation has no accounts yet: show first-run setup instead of sign-in.
    // No language has been chosen at that point, so the setup screen picks its own.
    const setup = await window.api.invoke('setup:status')
    if (setup.ok && setup.data.needsSetup) {
      set({ status: 'setup', user: null })
      return
    }

    // The shop's language is stored in the database. If this window came up in another
    // one (a new computer, or a restored backup), switch now; that reloads the window.
    const locale = await window.api.invoke('app:locale')
    if (locale.ok) switchLanguage(locale.data.language)

    const result = await window.api.invoke('auth:me')
    set({ status: 'ready', user: result.ok ? result.data : null })
  },
  setUser: (user) => set({ status: 'ready', user }),
  clear: () => set({ user: null })
}))

// UI-only check; the main process enforces the same rule on every call.
export function useCan(permission: Permission): boolean {
  const role = useAuthStore((state) => state.user?.role)
  return role ? can(role, permission) : false
}
