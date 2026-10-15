import { PASSWORD_MIN_LENGTH, type UserDto } from '../../../shared/ipc'
import type { UserRole } from '../../../shared/permissions'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { CheckboxField, SelectField, TextField } from '../components/ui/Field'
import { Modal } from '../components/ui/Modal'
import { PasswordField } from '../components/ui/PasswordField'
import { useUserFormModal } from '../hooks/useUserFormModal'
import { t } from '../i18n'

interface UserFormModalProps {
  // Omit to create a new user.
  user?: UserDto
  isSelf?: boolean
  roles: readonly UserRole[]
  onClose: () => void
  onSaved: (user: UserDto) => void
}

export function UserFormModal({ user, isSelf = false, roles, onClose, onSaved }: UserFormModalProps) {
  const {
    fullName,
    setFullName,
    username,
    setUsername,
    password,
    setPassword,
    role,
    setRole,
    isActive,
    setIsActive,
    error,
    saving,
    submit
  } = useUserFormModal({ user, onSaved })

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
