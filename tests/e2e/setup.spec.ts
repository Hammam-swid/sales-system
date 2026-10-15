import { expect, goTo, launchApp, setUpShop, STORE_TYPE_LABELS, test } from './app'

for (const storeType of ['general', 'grocery', 'cafe_fast_food'] as const) {
  test(`first-run setup as ${storeType}`, async () => {
    const { app, page } = await launchApp()
    try {
      await setUpShop(page, storeType)
      await goTo(page, 'Settings')
      const typeField = page.getByLabel('Business type')
      await expect(typeField).toHaveValue(STORE_TYPE_LABELS[storeType])
      await expect(typeField).toBeDisabled()
    } finally {
      await app.close()
    }
  })
}
