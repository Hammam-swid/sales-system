import { useState, type FormEvent } from 'react'
import { PASSWORD_MIN_LENGTH } from '../../../shared/ipc'
import type { Language } from '../../../shared/settings'
import { STORE_TYPES, type StoreType } from '../../../shared/store'
import { Logo } from '../components/Logo'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { SelectField, TextField } from '../components/ui/Field'
import { PasswordField } from '../components/ui/PasswordField'
import { language, switchLanguage, t } from '../i18n'
import { api, errorText } from '../lib/api'
import { hasArabicLetters } from '../lib/text'
import { useAuthStore } from '../store/auth'

// Shown once, on an installation that has no accounts yet.
export function SetupPage() {
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

  return (
    <div className="flex h-full bg-bg text-ink">
      <main className="flex flex-1 items-center justify-center overflow-y-auto p-8">
        <form onSubmit={submit} className="w-full max-w-md space-y-6">
          <header className="space-y-1">
            <h1 className="type-h2">{t.setup.title}</h1>
            <p className="type-body text-ink-muted">{t.setup.subtitle}</p>
          </header>

          {error && <Alert>{error}</Alert>}

          <div className="space-y-4">
            {/* Changing the language reloads this screen in it; nothing has been typed yet. */}
            <SelectField
              label={t.setup.language}
              value={language}
              onChange={(event) => switchLanguage(event.target.value as Language)}
            >
              <option value="ar">{t.settings.languageAr}</option>
              <option value="en">{t.settings.languageEn}</option>
            </SelectField>
            <TextField
              label={t.setup.storeName}
              name="storeName"
              value={storeName}
              onChange={(event) => setStoreName(event.target.value)}
              maxLength={80}
              autoFocus
              required
            />
            <SelectField
              label={t.setup.storeType}
              hint={t.setup.storeTypeHint}
              value={storeType}
              onChange={(event) => setStoreType(event.target.value as StoreType)}
              required
            >
              <option value="" disabled>
                {t.setup.chooseStoreType}
              </option>
              {STORE_TYPES.map((option) => (
                <option key={option} value={option}>
                  {t.storeTypes[option]}
                </option>
              ))}
            </SelectField>
            <TextField
              label={t.setup.fullName}
              name="fullName"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              maxLength={100}
              required
            />
            <TextField
              label={t.users.username}
              hint={t.users.usernameHint}
              name="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              warning={hasArabicLetters(username) ? t.keyboard.usernameLatinOnly : undefined}
              dir="ltr"
              className="text-start"
              pattern="[A-Za-z0-9._\-]{3,32}"
              autoCapitalize="none"
              spellCheck={false}
              required
            />
            <PasswordField
              label={t.users.password}
              hint={t.users.passwordHint(PASSWORD_MIN_LENGTH)}
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={PASSWORD_MIN_LENGTH}
              autoComplete="new-password"
              required
            />
            <PasswordField
              label={t.users.confirmPassword}
              error={mismatch ? t.users.passwordMismatch : undefined}
              name="confirmPassword"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              required
            />
          </div>

          <Button type="submit" loading={submitting} disabled={mismatch} className="w-full">
            {t.setup.submit}
          </Button>
        </form>
      </main>

      <aside className="bg-brand-gradient hidden w-[40%] flex-col items-center justify-center gap-8 p-12 text-white lg:flex">
        <Logo variant="white" width={176} />
        <div className="space-y-2 text-center">
          <p className="type-h2">{t.appName}</p>
          <p className="type-body-lg text-navy-50">{t.tagline}</p>
        </div>
      </aside>
    </div>
  )
}
