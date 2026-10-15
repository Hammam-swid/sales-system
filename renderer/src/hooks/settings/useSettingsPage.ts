import { useState } from 'react'

export type SettingsTabId = 'general' | 'backup'

export function useSettingsPage() {
  const [tab, setTab] = useState<SettingsTabId>('general')
  const [notice, setNotice] = useState<string | null>(null)

  const changeTab = (id: SettingsTabId) => {
    setTab(id)
    setNotice(null)
  }

  return { tab, changeTab, notice, setNotice }
}
