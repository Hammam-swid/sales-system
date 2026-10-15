import { useState, type FormEvent } from 'react'
import { api, errorText } from '../../lib/api'

// Lets the signed-in user change their own password.
export function useChangePasswordModal() {
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

  return {
    currentPassword,
    setCurrentPassword,
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    mismatch,
    error,
    saving,
    done,
    submit
  }
}
