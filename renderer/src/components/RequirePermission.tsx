import type { ReactNode } from 'react'
import { ShieldAlert } from 'lucide-react'
import type { Permission } from '../../../shared/permissions'
import { t } from '../i18n/ar'
import { useCan } from '../store/auth'
import { Card } from './ui/Card'

// Route guard. Hiding a screen is a courtesy; the main process still rejects the calls behind it.
export function RequirePermission({
  permission,
  children
}: {
  permission: Permission
  children: ReactNode
}) {
  const allowed = useCan(permission)
  if (allowed) return <>{children}</>

  return (
    <Card className="mx-auto mt-12 flex max-w-lg flex-col items-center gap-3 p-8 text-center">
      <ShieldAlert aria-hidden className="size-10 text-danger" />
      <h2 className="type-h3">{t.forbidden.title}</h2>
      <p className="type-body text-ink-muted">{t.forbidden.body}</p>
    </Card>
  )
}
