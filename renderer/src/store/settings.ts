import { create } from 'zustand'
import type { AppSettings } from '../../../shared/settings'
import { language } from '../i18n'
import { api } from '../lib/api'

const DEFAULTS: AppSettings = {
  storeName: '',
  storeAddress: '',
  storePhone: '',
  storeLogo: null,
  currency: 'USD',
  taxRate: 0,
  language
}

interface SettingsState {
  settings: AppSettings
  load: () => Promise<void>
  set: (settings: AppSettings) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: DEFAULTS,
  load: async () => {
    const result = await api('settings:get')
    if (result.ok) set({ settings: result.data })
  },
  set: (settings) => set({ settings })
}))

export function useCurrency(): string {
  return useSettingsStore((state) => state.settings.currency)
}
