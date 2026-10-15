import { useState, type FormEvent } from 'react'
import { api, errorText } from '../lib/api'
import { useAuthStore } from '../store/auth'

export function useLoginPage() {
  const setUser = useAuthStore((state) => state.setUser)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    const result = await api('auth:login', { username, password })
    setSubmitting(false)
    if (result.ok) {
      // Always land on the home screen, whatever page the previous user left open.
      window.location.hash = '#/'
      setUser(result.data)
    } else {
      setError(errorText(result))
      setPassword('')
    }
  }

  return { username, setUsername, password, setPassword, error, submitting, submit }
}
