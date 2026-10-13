import type { EntityManager } from 'typeorm'
import {
  LANGUAGES,
  MAX_LOGO_LENGTH,
  type AppSettings,
  type Language
} from '../../shared/settings'
import { toStoreType, type StoreType } from '../../shared/store'
import type { SessionUser } from '../auth/session'
import { getDataSource } from '../database/data-source'
import { Setting } from '../database/entities'
import { AppError } from '../errors'
import { recordAudit } from './audit.service'
import { asAmount, asObject, asOneOf, asOptionalText, asText } from './validation'

// Only raster images: an SVG can carry script, and the logo is shown inside the app.
const LOGO_PATTERN = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/

export async function readSettingValues(manager: EntityManager): Promise<Map<string, string>> {
  const rows = await manager.getRepository(Setting).find()
  return new Map(rows.map((row) => [row.key, row.value ?? '']))
}

export async function writeSettingValues(
  manager: EntityManager,
  values: Record<string, string>
): Promise<void> {
  const repository = manager.getRepository(Setting)
  await repository.save(
    Object.entries(values).map(([key, value]) => repository.create({ key, value }))
  )
}

function toLanguage(value: string | undefined): Language {
  return LANGUAGES.includes(value as Language) ? (value as Language) : 'ar'
}

function toAppSettings(values: Map<string, string>): AppSettings {
  const taxRate = Number(values.get('tax_rate'))
  return {
    storeName: values.get('store_name') ?? '',
    storeAddress: values.get('store_address') ?? '',
    storePhone: values.get('store_phone') ?? '',
    storeLogo: values.get('store_logo') || null,
    currency: values.get('currency') || 'USD',
    taxRate: Number.isFinite(taxRate) ? taxRate : 0,
    language: toLanguage(values.get('language')),
    storeType: toStoreType(values.get('store_type'))
  }
}

// The store type is written once by first-run setup; saveSettings never touches it.
export async function readStoreType(manager: EntityManager): Promise<StoreType> {
  const row = await manager.getRepository(Setting).findOneBy({ key: 'store_type' })
  return toStoreType(row?.value ?? undefined)
}

export async function getSettings(): Promise<AppSettings> {
  return toAppSettings(await readSettingValues(getDataSource().manager))
}

export async function getLocale(): Promise<{ language: Language }> {
  const row = await getDataSource().getRepository(Setting).findOneBy({ key: 'language' })
  return { language: toLanguage(row?.value ?? undefined) }
}

export async function saveSettings(payload: unknown, actor: SessionUser): Promise<AppSettings> {
  const input = asObject(payload)

  let storeLogo = ''
  if (input.storeLogo !== null && input.storeLogo !== undefined && input.storeLogo !== '') {
    if (
      typeof input.storeLogo !== 'string' ||
      input.storeLogo.length > MAX_LOGO_LENGTH ||
      !LOGO_PATTERN.test(input.storeLogo)
    ) {
      throw new AppError('VALIDATION', 'storeLogo')
    }
    storeLogo = input.storeLogo
  }

  const taxRate = asAmount(input.taxRate, 'taxRate', 2, 100)
  const values = {
    store_name: asText(input.storeName, 'storeName', 80),
    store_address: asOptionalText(input.storeAddress, 'storeAddress', 200) ?? '',
    store_phone: asOptionalText(input.storePhone, 'storePhone', 40) ?? '',
    store_logo: storeLogo,
    // An ISO code such as USD, or the shop's own short label.
    currency: asText(input.currency, 'currency', 8),
    tax_rate: String(taxRate),
    language: asOneOf(input.language, LANGUAGES, 'language')
  }

  return getDataSource().transaction(async (manager) => {
    const before = await readSettingValues(manager)
    await writeSettingValues(manager, values)

    // The tax rate and currency change what customers are charged and shown.
    const changed = (['currency', 'tax_rate'] as const).filter(
      (key) => (before.get(key) ?? '') !== values[key]
    )
    if (changed.length > 0) {
      await recordAudit(
        {
          userId: actor.id,
          action: 'edit_settings',
          entityType: 'settings',
          details: Object.fromEntries(
            changed.map((key) => [key, { before: before.get(key) ?? '', after: values[key] }])
          )
        },
        manager
      )
    }
    return toAppSettings(await readSettingValues(manager))
  })
}
