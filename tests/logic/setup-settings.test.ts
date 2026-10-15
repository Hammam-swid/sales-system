import { describe, expect, it } from 'vitest'
import { STORE_TYPES } from '../../shared/store'
import { listCategories } from '../../main/services/categories.service'
import { listExpenseCategories } from '../../main/services/expenses.service'
import { getSettings, saveSettings } from '../../main/services/settings.service'
import { createFirstOwner, setupStatus } from '../../main/services/setup.service'
import { STARTER_CATEGORIES } from '../../main/services/starter-categories'
import { expectError, freshShop } from './helpers'

describe('first-run setup', () => {
  it('is needed only until the owner exists, and can never run twice', async () => {
    await freshShop()
    expect(await setupStatus()).toEqual({ needsSetup: false })
    await expectError(
      createFirstOwner({
        fullName: 'Intruder',
        username: 'intruder',
        password: 'secret12',
        storeName: 'x',
        language: 'en',
        storeType: 'general'
      }),
      'FORBIDDEN'
    )
  })

  it.each(STORE_TYPES)('saves the %s type and its starter categories', async (storeType) => {
    await freshShop(storeType)
    const settings = await getSettings()
    expect(settings.storeType).toBe(storeType)
    expect(settings.storeName).toBe('Test shop')

    const categories = await listCategories()
    expect(categories.map((c) => c.name).sort()).toEqual([...STARTER_CATEGORIES[storeType].en].sort())
    const withNotes = categories.filter((c) => c.noteOptions.length > 0)
    if (storeType === 'cafe' || storeType === 'cafe_fast_food') {
      expect(withNotes.length).toBeGreaterThan(0)
    } else {
      expect(withNotes).toEqual([])
    }
    expect((await listExpenseCategories()).length).toBe(5)
  })
})

describe('settings', () => {
  const valid = {
    storeName: 'Renamed',
    storeAddress: 'Main street',
    storePhone: '0911',
    storeLogo: null,
    currency: 'SAR',
    taxRate: 15,
    language: 'en'
  }

  it('saves editable settings but never the store type', async () => {
    const { owner } = await freshShop('grocery')
    const saved = await saveSettings({ ...valid, storeType: 'cafe' }, owner)
    expect(saved).toMatchObject({ storeName: 'Renamed', currency: 'SAR', taxRate: 15 })
    expect(saved.storeType).toBe('grocery')
  })

  it('rejects a bad tax rate, an empty name and a non-image logo', async () => {
    const { owner } = await freshShop()
    await expectError(saveSettings({ ...valid, taxRate: 150 }, owner), 'VALIDATION')
    await expectError(saveSettings({ ...valid, storeName: '  ' }, owner), 'VALIDATION')
    await expectError(
      saveSettings({ ...valid, storeLogo: 'data:image/svg+xml;base64,PHN2Zz4=' }, owner),
      'VALIDATION'
    )
  })
})
