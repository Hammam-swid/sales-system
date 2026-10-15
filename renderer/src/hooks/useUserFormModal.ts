import { useState, type FormEvent } from 'react'
import type { UserDto } from '../../../shared/ipc'
import type { UserRole } from '../../../shared/permissions'
import { api, errorText } from '../lib/api'

interface Options {
  // Omit to create.
  user?: UserDto
  onSaved: (user: UserDto) => void
}

export function useUserFormModal({ user, onSaved }: Options) {
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

  return {
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
  }
}
