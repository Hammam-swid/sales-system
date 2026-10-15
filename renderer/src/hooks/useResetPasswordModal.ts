import { useState, type FormEvent } from 'react'
import type { UserDto } from '../../../shared/ipc'
import { api, errorText } from '../lib/api'

interface Options {
  user: UserDto
  onSaved: () => void
}

export function useResetPasswordModal({ user, onSaved }: Options) {
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

  return { newPassword, setNewPassword, error, saving, submit }
}
