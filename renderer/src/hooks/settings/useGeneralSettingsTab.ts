import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { MAX_LOGO_LENGTH, type AppSettings } from '../../../../shared/settings'
import { switchLanguage, t } from '../../i18n'
import { api, errorText } from '../../lib/api'
import { readAsDataUrl } from '../../lib/files'
import { parseNumber } from '../../lib/format'
import { useSettingsStore } from '../../store/settings'

export const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp']

export function useGeneralSettingsTab(onNotice: (message: string | null) => void) {
  const stored = useSettingsStore((state) => state.settings)
  const setStored = useSettingsStore((state) => state.set)
  const loadStored = useSettingsStore((state) => state.load)

  const [form, setForm] = useState<AppSettings>(stored)
  const [taxRate, setTaxRate] = useState(String(stored.taxRate))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Start from what is in the database, not from whatever was cached at sign-in.
  useEffect(() => {
    void loadStored()
  }, [loadStored])
  useEffect(() => {
    setForm(stored)
    setTaxRate(String(stored.taxRate))
  }, [stored])

  const update = (patch: Partial<AppSettings>) => setForm((current) => ({ ...current, ...patch }))

  const chooseLogo = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Allow picking the same file again later.
    event.target.value = ''
    if (!file) return
    if (!LOGO_TYPES.includes(file.type)) {
      setError(t.settings.logoWrongType)
      return
    }
    const dataUrl = await readAsDataUrl(file)
    if (dataUrl.length > MAX_LOGO_LENGTH) {
      setError(t.settings.logoTooLarge)
      return
    }
    setError(null)
    update({ storeLogo: dataUrl })
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    const rate = parseNumber(taxRate)
    if (rate === null || rate < 0 || rate > 100) {
      setError(t.errors.VALIDATION)
      return
    }
    setSaving(true)
    setError(null)
    onNotice(null)
    // The store type is fixed at setup and is not part of what gets saved.
    const { storeType: _storeType, ...editable } = form
    const result = await api('settings:save', { ...editable, taxRate: rate })
    setSaving(false)
    if (!result.ok) {
      setError(errorText(result))
      return
    }
    setStored(result.data)
    onNotice(t.settings.saved)
    // Reloads the window when the language changed.
    switchLanguage(result.data.language)
  }

  return { stored, form, update, taxRate, setTaxRate, error, saving, chooseLogo, submit }
}
