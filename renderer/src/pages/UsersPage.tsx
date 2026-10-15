import { KeyRound, Pencil, Plus } from 'lucide-react'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useUsersPage } from '../hooks/useUsersPage'
import { t } from '../i18n'
import { formatDate } from '../lib/format'
import { ResetPasswordModal } from './ResetPasswordModal'
import { UserFormModal } from './UserFormModal'

export function UsersPage() {
  const {
    me,
    users,
    error,
    notice,
    dialog,
    openDialog,
    closeDialog,
    canManage,
    assignableRoles,
    finish
  } = useUsersPage()

  if (!me) return null

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="type-h2">{t.users.title}</h2>
          <p className="type-body text-ink-muted">{t.users.subtitle}</p>
        </div>
        <Button icon={<Plus aria-hidden className="size-4" />} onClick={() => openDialog({ kind: 'create' })}>
          {t.users.add}
        </Button>
      </header>

      {notice && <Alert tone="success">{notice}</Alert>}
      {error && <Alert>{error}</Alert>}

      <Card className="overflow-hidden">
        <table className="type-body-sm w-full">
          <thead className="type-label border-b border-border text-ink-muted">
            <tr>
              <th className="px-6 py-3 text-start">{t.users.fullName}</th>
              <th className="px-6 py-3 text-start">{t.users.username}</th>
              <th className="px-6 py-3 text-start">{t.users.role}</th>
              <th className="px-6 py-3 text-start">{t.users.status}</th>
              <th className="px-6 py-3 text-start">{t.users.createdAt}</th>
              <th className="px-6 py-3 text-end">{t.common.actions}</th>
            </tr>
          </thead>
          <tbody>
            {users === null && !error && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-ink-muted">
                  {t.common.loading}
                </td>
              </tr>
            )}
            {users?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-ink-muted">
                  {t.users.empty}
                </td>
              </tr>
            )}
            {users?.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0">
                <td className="px-6 py-3">
                  <span className="type-label text-ink">{user.fullName}</span>
                  {user.id === me.id && (
                    <span className="type-caption ms-2 text-ink-muted">({t.users.you})</span>
                  )}
                </td>
                <td dir="ltr" className="px-6 py-3 text-end">
                  {user.username}
                </td>
                <td className="px-6 py-3">
                  <Badge tone="brand">{t.roles[user.role]}</Badge>
                </td>
                <td className="px-6 py-3">
                  <Badge tone={user.isActive ? 'success' : 'neutral'}>
                    {user.isActive ? t.common.active : t.common.inactive}
                  </Badge>
                </td>
                <td className="px-6 py-3 tabular-nums text-ink-muted">
                  {formatDate(user.createdAt)}
                </td>
                <td className="px-6 py-3">
                  {canManage(user) && (
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Pencil aria-hidden className="size-4" />}
                        onClick={() => openDialog({ kind: 'edit', user })}
                      >
                        {t.common.edit}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<KeyRound aria-hidden className="size-4" />}
                        aria-label={t.users.resetPasswordFor(user.fullName)}
                        title={t.users.resetPassword}
                        onClick={() => openDialog({ kind: 'reset', user })}
                      />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {dialog?.kind === 'create' && (
        <UserFormModal
          roles={assignableRoles}
          onClose={() => closeDialog()}
          onSaved={() => finish(t.users.created)}
        />
      )}
      {dialog?.kind === 'edit' && (
        <UserFormModal
          user={dialog.user}
          isSelf={dialog.user.id === me.id}
          roles={assignableRoles}
          onClose={() => closeDialog()}
          onSaved={(updated) => finish(t.users.saved, updated)}
        />
      )}
      {dialog?.kind === 'reset' && (
        <ResetPasswordModal
          user={dialog.user}
          onClose={() => closeDialog()}
          onSaved={() => finish(t.users.passwordChanged)}
        />
      )}
    </div>
  )
}
