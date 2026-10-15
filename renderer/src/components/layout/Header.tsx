import { ChevronDown, KeyRound, LogOut, Moon, Sun } from 'lucide-react'
import { useHeader } from '../../hooks/components/useHeader'
import { t } from '../../i18n'
import { ChangePasswordModal } from '../ChangePasswordModal'
import { Badge } from '../ui/Badge'

const MENU_ITEM =
  'type-label flex h-10 w-full items-center gap-2 rounded-sm px-3 text-ink transition-colors duration-[120ms] hover:bg-surface'

export function Header() {
  const {
    user,
    theme,
    toggleTheme,
    title,
    menuRef,
    menuOpen,
    toggleMenu,
    changingPassword,
    openChangePassword,
    closeChangePassword,
    logout
  } = useHeader()

  if (!user) return null

  const ThemeIcon = theme === 'dark' ? Sun : Moon

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-bg px-8">
      <h1 className="type-h4 text-ink">{title}</h1>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? t.header.lightTheme : t.header.darkTheme}
          title={theme === 'dark' ? t.header.lightTheme : t.header.darkTheme}
          className="flex size-10 items-center justify-center rounded-md text-ink-muted transition-colors duration-[120ms] hover:bg-surface hover:text-ink"
        >
          <ThemeIcon aria-hidden className="size-5" />
        </button>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={toggleMenu}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label={t.header.userMenu}
            className="flex h-11 items-center gap-3 rounded-md px-3 transition-colors duration-[120ms] hover:bg-surface"
          >
            <span className="type-label text-ink">{user.fullName}</span>
            <Badge tone="brand">{t.roles[user.role]}</Badge>
            <ChevronDown aria-hidden className="size-4 text-ink-muted" />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute end-0 top-full z-20 mt-2 w-60 rounded-md border border-border bg-bg p-2 shadow-md"
            >
              <button
                type="button"
                role="menuitem"
                className={MENU_ITEM}
                onClick={openChangePassword}
              >
                <KeyRound aria-hidden className="size-4 text-ink-muted" />
                {t.header.changePassword}
              </button>
              <button type="button" role="menuitem" className={MENU_ITEM} onClick={logout}>
                <LogOut aria-hidden className="size-4 text-ink-muted rtl:-scale-x-100" />
                {t.header.logout}
              </button>
            </div>
          )}
        </div>
      </div>

      {changingPassword && <ChangePasswordModal onClose={closeChangePassword} />}
    </header>
  )
}
