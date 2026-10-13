import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { AppInfo } from '../../../shared/ipc'
import { can } from '../../../shared/permissions'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { t } from '../i18n/ar'
import { api } from '../lib/api'
import { BUILT_PATHS, NAV_ITEMS } from '../navigation'
import { useAuthStore, useCan } from '../store/auth'

export function HomePage() {
  const user = useAuthStore((state) => state.user)
  const canSeeSystemInfo = useCan('settings.manage')
  const [info, setInfo] = useState<AppInfo | null>(null)

  useEffect(() => {
    if (!canSeeSystemInfo) return
    void api('app:info').then((result) => {
      if (result.ok) setInfo(result.data)
    })
  }, [canSeeSystemInfo])

  if (!user) return null

  const shortcuts = NAV_ITEMS.filter(
    (item) => item.path !== '/' && (!item.permission || can(user.role, item.permission))
  )

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <header className="space-y-1">
        <h2 className="type-h1">{t.home.welcome(user.fullName)}</h2>
        <p className="type-body-lg text-ink-muted">{t.home.subtitle}</p>
      </header>

      <section className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        {shortcuts.map(({ path, label, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-6 transition-shadow duration-200 ease-brand hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <span className="flex size-12 items-center justify-center rounded-md bg-primary text-on-primary">
                <Icon aria-hidden className="size-6" />
              </span>
              {!BUILT_PATHS.includes(path) && <Badge>{t.common.comingSoon}</Badge>}
            </div>
            <span className="type-h4 text-ink">{label}</span>
          </Link>
        ))}
      </section>

      {info && (
        <Card className="p-6">
          <h3 className="type-h4 mb-4">{t.home.systemInfo}</h3>
          <dl className="type-body-sm grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2">
            <dt className="text-ink-muted">{t.home.version}</dt>
            <dd dir="ltr" className="text-end">
              {info.appVersion}
            </dd>
            <dt className="text-ink-muted">{t.home.dbPath}</dt>
            <dd dir="ltr" className="text-end break-all">
              {info.dbPath}
            </dd>
            <dt className="text-ink-muted">{t.home.migrations}</dt>
            <dd dir="ltr" className="text-end break-all">
              {info.migrations.join(', ') || '—'}
            </dd>
            <dt className="text-ink-muted">{t.home.records}</dt>
            <dd className="tabular-nums">
              {info.tables.reduce((total, table) => total + table.rows, 0)}
            </dd>
          </dl>
        </Card>
      )}
    </div>
  )
}
