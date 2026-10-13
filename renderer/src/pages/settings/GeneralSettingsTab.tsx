import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import { MAX_LOGO_LENGTH, type AppSettings, type Language } from '../../../../shared/settings'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { SelectField, TextField } from '../../components/ui/Field'
import { switchLanguage, t } from '../../i18n'
import { api, errorText } from '../../lib/api'
import { parseNumber } from '../../lib/format'
import { useSettingsStore } from '../../store/settings'

const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp']

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function GeneralSettingsTab({ onNotice }: { onNotice: (message: string | null) => void }) {
  const stored = useSettingsStore((state) => state.settings)
  const setStored = useSettingsStore((state) => state.set)
  const loadStored = useSettingsStore((state) => state.load)

  const [form, setForm] = useState<AppSettings>(stored)
  const [taxRate, setTaxRate] = useState(String(stored.taxRate))
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

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

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && <Alert>{error}</Alert>}

      <Card className="space-y-4 p-6">
        <div>
          <h3 className="type-h4">{t.settings.storeSection}</h3>
          <p className="type-caption text-ink-muted">{t.settings.storeSectionHint}</p>
        </div>

        <TextField
          label={t.settings.storeName}
          value={form.storeName}
          onChange={(event) => update({ storeName: event.target.value })}
          maxLength={80}
          required
        />
        <TextField
          label={t.settings.storeType}
          hint={t.settings.storeTypeHint}
          value={t.storeTypes[stored.storeType]}
          readOnly
          disabled
        />
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label={t.settings.storeAddress}
            value={form.storeAddress}
            onChange={(event) => update({ storeAddress: event.target.value })}
            maxLength={200}
          />
          <TextField
            label={t.settings.storePhone}
            value={form.storePhone}
            onChange={(event) => update({ storePhone: event.target.value })}
            maxLength={40}
            type="tel"
            dir="ltr"
            className="text-start"
          />
        </div>

        <div className="space-y-2">
          <p className="type-label text-ink">{t.settings.logo}</p>
          <div className="flex items-center gap-4">
            <div className="flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border-strong bg-white">
              {form.storeLogo ? (
                <img src={form.storeLogo} alt={t.settings.logo} className="max-h-full max-w-full object-contain" />
              ) : (
                <ImagePlus aria-hidden className="size-8 text-neutral-400" />
              )}
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => fileInput.current?.click()}>
                  {t.settings.chooseLogo}
                </Button>
                {form.storeLogo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 aria-hidden className="size-4" />}
                    onClick={() => update({ storeLogo: null })}
                  >
                    {t.settings.removeLogo}
                  </Button>
                )}
              </div>
              <p className="type-caption text-ink-muted">{t.settings.logoHint}</p>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept={LOGO_TYPES.join(',')}
              onChange={chooseLogo}
              className="hidden"
              aria-label={t.settings.chooseLogo}
            />
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h3 className="type-h4">{t.settings.salesSection}</h3>
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label={t.settings.currency}
            hint={t.settings.currencyHint}
            value={form.currency}
            onChange={(event) => update({ currency: event.target.value })}
            maxLength={8}
            dir="ltr"
            className="text-start"
            required
          />
          <TextField
            label={t.settings.taxRate}
            hint={t.settings.taxRateHint}
            type="number"
            min={0}
            max={100}
            step="any"
            dir="ltr"
            className="text-start"
            value={taxRate}
            onChange={(event) => setTaxRate(event.target.value)}
            required
          />
        </div>
        <SelectField
          label={t.settings.language}
          hint={t.settings.languageHint}
          value={form.language}
          onChange={(event) => update({ language: event.target.value as Language })}
        >
          <option value="ar">{t.settings.languageAr}</option>
          <option value="en">{t.settings.languageEn}</option>
        </SelectField>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          {t.common.save}
        </Button>
      </div>
    </form>
  )
}
