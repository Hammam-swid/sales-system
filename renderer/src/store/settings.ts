import { create } from 'zustand'
import type { AppSettings } from '../../../shared/catalog'
import { api } from '../lib/api'

const DEFAULTS: AppSettings = {
  storeName: '',
  storeAddress: '',
  storePhone: '',
  currency: 'USD',
  taxRate: 0,
  language: 'ar'
}

interface SettingsState {
  settings: AppSettings
  load: () => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: DEFAULTS,
  load: async () => {
    const result = await api('settings:get')
    if (result.ok) set({ settings: result.data })
  }
}))

export function useCurrency(): string {
  return useSettingsStore((state) => state.settings.currency)
}
