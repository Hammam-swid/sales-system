import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { t } from '../../i18n'
import { api } from '../../lib/api'
import { NAV_ITEMS } from '../../navigation'
import { useAuthStore } from '../../store/auth'
import { useThemeStore } from '../../store/theme'

export function useHeader() {
  const user = useAuthStore((state) => state.user)
  const clear = useAuthStore((state) => state.clear)
  const { theme, toggle } = useThemeStore()
  const { pathname } = useLocation()

  const [menuOpen, setMenuOpen] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close the menu on outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const title = NAV_ITEMS.find((item) => item.path === pathname)?.label ?? t.appName

  const logout = async () => {
    await api('auth:logout')
    clear()
  }

  const openChangePassword = () => {
    setMenuOpen(false)
    setChangingPassword(true)
  }

  return {
    user,
    theme,
    toggleTheme: toggle,
    title,
    menuRef,
    menuOpen,
    toggleMenu: () => setMenuOpen((open) => !open),
    changingPassword,
    openChangePassword,
    closeChangePassword: () => setChangingPassword(false),
    logout
  }
}
