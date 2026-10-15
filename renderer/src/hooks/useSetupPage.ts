import { useState, type FormEvent } from 'react'
import type { Language } from '../../../shared/settings'
import type { StoreType } from '../../../shared/store'
import { language, switchLanguage } from '../i18n'
import { api, errorText } from '../lib/api'
import { useAuthStore } from '../store/auth'

// Shown once, on an installation that has no accounts yet.
export function useSetupPage() {
  const setUser = useAuthStore((state) => state.setUser)
  const [storeName, setStoreName] = useState('')
  const [storeType, setStoreType] = useState<StoreType | ''>('')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const mismatch = confirmPassword.length > 0 && confirmPassword !== password

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (password !== confirmPassword || storeType === '') return
    setSubmitting(true)
    setError(null)
    const result = await api('setup:createOwner', {
      storeName,
      storeType,
      fullName,
      username,
      password,
      language
    })
    setSubmitting(false)
    if (result.ok) {
      window.location.hash = '#/'
      setUser(result.data)
    } else {
      setError(errorText(result))
    }
  }

  return {
    language,
    // Reloads this screen in the new language; nothing has been typed yet.
    changeLanguage: (next: Language) => switchLanguage(next),
    storeName,
    setStoreName,
    storeType,
    setStoreType,
    fullName,
    setFullName,
    username,
    setUsername,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    mismatch,
    error,
    submitting,
    submit
  }
}
