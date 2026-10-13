import type { SetupRequest, UserDto } from '../../shared/ipc'
import { LANGUAGES, type Language } from '../../shared/settings'
import { setSession } from '../auth/session'
import { getDataSource } from '../database/data-source'
import { ExpenseCategory, User } from '../database/entities'
import { AppError } from '../errors'
import { hashPassword } from '../utils/password'
import { recordAudit } from './audit.service'
import { readSettingValues, writeSettingValues } from './settings.service'
import { toUserDto } from './user.mapper'
import { asObject, asOneOf, asPassword, asText, asUsername } from './validation'

const DEFAULT_EXPENSE_CATEGORIES: Record<Language, string[]> = {
  ar: ['إيجار', 'كهرباء', 'رواتب', 'نقل ومواصلات', 'أخرى'],
  en: ['Rent', 'Electricity', 'Salaries', 'Transport', 'Other']
}

// A freshly installed app has no accounts, so nobody could sign in.
export async function setupStatus(): Promise<{ needsSetup: boolean }> {
  return { needsSetup: (await getDataSource().getRepository(User).count()) === 0 }
}

// Creates the first owner account. Refused as soon as any user exists, so it can
// never be used to take over an installation that is already set up.
export async function createFirstOwner(payload: unknown): Promise<UserDto> {
  const input = asObject(payload) as Partial<Record<keyof SetupRequest, unknown>>
  const fullName = asText(input.fullName, 'fullName')
  const username = asUsername(input.username)
  const password = asPassword(input.password)
  const storeName = asText(input.storeName, 'storeName', 80)
  const language = asOneOf(input.language, LANGUAGES, 'language')

  return getDataSource().transaction(async (manager) => {
    const users = manager.getRepository(User)
    if ((await users.count()) > 0) throw new AppError('FORBIDDEN')

    const created = await users.save(
      users.create({ fullName, username, role: 'owner', passwordHash: hashPassword(password) })
    )

    // Starting values only: anything already in the database is left as it is.
    const existing = await readSettingValues(manager)
    const defaults: Record<string, string> = {
      store_name: storeName,
      store_address: '',
      store_phone: '',
      currency: 'USD',
      tax_rate: '0',
      language
    }
    await writeSettingValues(
      manager,
      Object.fromEntries(Object.entries(defaults).filter(([key]) => !existing.has(key)))
    )

    const categories = manager.getRepository(ExpenseCategory)
    if ((await categories.count()) === 0) {
      await categories.save(
        DEFAULT_EXPENSE_CATEGORIES[language].map((name) => categories.create({ name }))
      )
    }

    await recordAudit(
      { userId: created.id, action: 'initial_setup', entityType: 'user', entityId: created.id },
      manager
    )

    const owner = await users.findOneByOrFail({ id: created.id })
    setSession({ id: owner.id, role: owner.role })
    return toUserDto(owner)
  })
}
