import { useState, type FormEvent } from 'react'
import { PASSWORD_MIN_LENGTH } from '../../../shared/ipc'
import { t } from '../i18n/ar'
import { api, errorText } from '../lib/api'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { Modal } from './ui/Modal'
import { PasswordField } from './ui/PasswordField'

// Lets the signed-in user change their own password.
export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const mismatch = confirmPassword.length > 0 && confirmPassword !== newPassword

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (newPassword !== confirmPassword) return
    setSaving(true)
    setError(null)
    const result = await api('auth:changePassword', { currentPassword, newPassword })
    setSaving(false)
    if (result.ok) setDone(true)
    else setError(errorText(result))
  }

  return (
    <Modal title={t.header.changePassword} onClose={onClose}>
      {done ? (
        <div className="space-y-6">
          <Alert tone="success">{t.users.passwordChanged}</Alert>
          <div className="flex justify-end">
            <Button onClick={onClose}>{t.common.close}</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          {error && <Alert>{error}</Alert>}
          <PasswordField
            label={t.users.currentPassword}
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            autoFocus
            required
          />
          <PasswordField
            label={t.users.newPassword}
            hint={t.users.passwordHint(PASSWORD_MIN_LENGTH)}
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            minLength={PASSWORD_MIN_LENGTH}
            required
          />
          <PasswordField
            label={t.users.confirmPassword}
            error={mismatch ? t.users.passwordMismatch : undefined}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={onClose}>
              {t.common.cancel}
            </Button>
            <Button type="submit" loading={saving} disabled={mismatch}>
              {t.common.save}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
