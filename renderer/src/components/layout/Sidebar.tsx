import { NavLink } from 'react-router-dom'
import { can } from '../../../../shared/permissions'
import { t } from '../../i18n'
import { cn } from '../../lib/cn'
import { NAV_ITEMS } from '../../navigation'
import { useAuthStore } from '../../store/auth'
import { Logo } from '../Logo'

export function Sidebar() {
  const role = useAuthStore((state) => state.user?.role)
  if (!role) return null

  const items = NAV_ITEMS.filter((item) => !item.permission || can(role, item.permission))

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-surface-inverse text-white">
      <div className="flex flex-col items-center gap-2 px-6 pt-8 pb-6">
        <Logo variant="white" width={96} />
        <p className="type-label text-navy-100">{t.appName}</p>
      </div>

      <nav aria-label={t.appName} className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {items.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              cn(
                'type-label flex h-11 items-center gap-3 rounded-md px-4 transition-colors duration-[120ms] ease-brand',
                'focus-visible:outline-white',
                isActive
                  ? 'bg-navy-600 font-bold text-white'
                  : 'text-navy-100 hover:bg-navy-800 hover:text-white'
              )
            }
          >
            <Icon aria-hidden className="size-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
