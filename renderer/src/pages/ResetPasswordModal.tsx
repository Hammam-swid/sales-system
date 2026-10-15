import { PASSWORD_MIN_LENGTH, type UserDto } from '../../../shared/ipc'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { PasswordField } from '../components/ui/PasswordField'
import { useResetPasswordModal } from '../hooks/useResetPasswordModal'
import { t } from '../i18n'

interface ResetPasswordModalProps {
  user: UserDto
  onClose: () => void
  onSaved: () => void
}

export function ResetPasswordModal({ user, onClose, onSaved }: ResetPasswordModalProps) {
  const { newPassword, setNewPassword, error, saving, submit } = useResetPasswordModal({
    user,
    onSaved
  })

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
