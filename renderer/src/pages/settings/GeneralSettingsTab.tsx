import { useRef } from 'react'
import { ImagePlus, Trash2 } from 'lucide-react'
import type { Language } from '../../../../shared/settings'
import { Alert } from '../../components/ui/Alert'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { SelectField, TextField } from '../../components/ui/Field'
import { LOGO_TYPES, useGeneralSettingsTab } from '../../hooks/settings/useGeneralSettingsTab'
import { t } from '../../i18n'

export function GeneralSettingsTab({ onNotice }: { onNotice: (message: string | null) => void }) {
  const { stored, form, update, taxRate, setTaxRate, error, saving, chooseLogo, submit } =
    useGeneralSettingsTab(onNotice)
  // Only opens the hidden file picker.
  const fileInput = useRef<HTMLInputElement>(null)

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
