import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { KeyRound, Pencil, Plus } from 'lucide-react'
import { PASSWORD_MIN_LENGTH, type UserDto } from '../../../shared/ipc'
import { USER_ROLES, type UserRole } from '../../../shared/permissions'
import { Alert } from '../components/ui/Alert'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { CheckboxField, SelectField, TextField } from '../components/ui/Field'
import { Modal } from '../components/ui/Modal'
import { PasswordField } from '../components/ui/PasswordField'
import { t } from '../i18n/ar'
import { api, errorText } from '../lib/api'
import { useAuthStore } from '../store/auth'

// Western digits throughout the product, as chosen for this app.
const dateFormat = new Intl.DateTimeFormat('ar-u-nu-latn', { dateStyle: 'medium' })

type Dialog =
  | { kind: 'create' }
  | { kind: 'edit'; user: UserDto }
  | { kind: 'reset'; user: UserDto }
  | null

export function UsersPage() {
  const me = useAuthStore((state) => state.user)
  const setMe = useAuthStore((state) => state.setUser)
  const [users, setUsers] = useState<UserDto[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [dialog, setDialog] = useState<Dialog>(null)

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

  if (!me) return null

  // Managers can see owners but only an owner may change them.
  const canManage = (user: UserDto) => user.role !== 'owner' || me.role === 'owner'
  const assignableRoles = USER_ROLES.filter((role) => role !== 'owner' || me.role === 'owner')

  const finish = (message: string, updated?: UserDto) => {
    setDialog(null)
    setNotice(message)
    if (updated && updated.id === me.id) setMe(updated)
    void load()
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="type-h2">{t.users.title}</h2>
          <p className="type-body text-ink-muted">{t.users.subtitle}</p>
        </div>
        <Button icon={<Plus aria-hidden className="size-4" />} onClick={() => setDialog({ kind: 'create' })}>
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
                  {dateFormat.format(new Date(user.createdAt))}
                </td>
                <td className="px-6 py-3">
                  {canManage(user) && (
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Pencil aria-hidden className="size-4" />}
                        onClick={() => setDialog({ kind: 'edit', user })}
                      >
                        {t.common.edit}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<KeyRound aria-hidden className="size-4" />}
                        aria-label={t.users.resetPasswordFor(user.fullName)}
                        title={t.users.resetPassword}
                        onClick={() => setDialog({ kind: 'reset', user })}
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
          onClose={() => setDialog(null)}
          onSaved={() => finish(t.users.created)}
        />
      )}
      {dialog?.kind === 'edit' && (
        <UserFormModal
          user={dialog.user}
          isSelf={dialog.user.id === me.id}
          roles={assignableRoles}
          onClose={() => setDialog(null)}
          onSaved={(updated) => finish(t.users.saved, updated)}
        />
      )}
      {dialog?.kind === 'reset' && (
        <ResetPasswordModal
          user={dialog.user}
          onClose={() => setDialog(null)}
          onSaved={() => finish(t.users.passwordChanged)}
        />
      )}
    </div>
  )
}

interface UserFormModalProps {
  // Omit to create a new user.
  user?: UserDto
  isSelf?: boolean
  roles: readonly UserRole[]
  onClose: () => void
  onSaved: (user: UserDto) => void
}

function UserFormModal({ user, isSelf = false, roles, onClose, onSaved }: UserFormModalProps) {
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [username, setUsername] = useState(user?.username ?? '')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>(user?.role ?? 'cashier')
  const [isActive, setIsActive] = useState(user?.isActive ?? true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const result = user
      ? await api('users:update', { id: user.id, fullName, role, isActive })
      : await api('users:create', { fullName, username, password, role })
    setSaving(false)
    if (result.ok) onSaved(result.data)
    else setError(errorText(result))
  }

  return (
    <Modal title={user ? t.users.edit : t.users.add} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <TextField
          label={t.users.fullName}
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          maxLength={100}
          autoFocus
          required
        />
        <TextField
          label={t.users.username}
          hint={user ? undefined : t.users.usernameHint}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          dir="ltr"
          className="text-start"
          pattern="[A-Za-z0-9._\-]{3,32}"
          autoCapitalize="none"
          spellCheck={false}
          disabled={Boolean(user)}
          required
        />
        {!user && (
          <PasswordField
            label={t.users.password}
            hint={t.users.passwordHint(PASSWORD_MIN_LENGTH)}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={PASSWORD_MIN_LENGTH}
            autoComplete="new-password"
            required
          />
        )}
        <SelectField
          label={t.users.role}
          value={role}
          onChange={(event) => setRole(event.target.value as UserRole)}
          disabled={isSelf}
        >
          {roles.map((option) => (
            <option key={option} value={option}>
              {t.roles[option]}
            </option>
          ))}
        </SelectField>
        {user && (
          <CheckboxField
            label={t.users.accountActive}
            checked={isActive}
            onChange={(event) => setIsActive(event.target.checked)}
            disabled={isSelf}
          />
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" loading={saving}>
            {user ? t.common.save : t.common.add}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

interface ResetPasswordModalProps {
  user: UserDto
  onClose: () => void
  onSaved: () => void
}

function ResetPasswordModal({ user, onClose, onSaved }: ResetPasswordModalProps) {
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    const result = await api('users:resetPassword', { id: user.id, newPassword })
    setSaving(false)
    if (result.ok) onSaved()
    else setError(errorText(result))
  }

  return (
    <Modal title={t.users.resetPasswordFor(user.fullName)} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <Alert>{error}</Alert>}
        <PasswordField
          label={t.users.newPassword}
          hint={t.users.passwordHint(PASSWORD_MIN_LENGTH)}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          minLength={PASSWORD_MIN_LENGTH}
          autoComplete="new-password"
          autoFocus
          required
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button type="submit" loading={saving}>
            {t.common.save}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
