import { useState } from 'react'
import { Alert } from '../../components/ui/Alert'
import { Tabs } from '../../components/ui/Tabs'
import { t } from '../../i18n'
import { BackupTab } from './BackupTab'
import { GeneralSettingsTab } from './GeneralSettingsTab'

type TabId = 'general' | 'backup'

const TABS = [
  { id: 'general' as const, label: t.settings.tabGeneral },
  { id: 'backup' as const, label: t.settings.tabBackup }
]

export function SettingsPage() {
  const [tab, setTab] = useState<TabId>('general')
  const [notice, setNotice] = useState<string | null>(null)

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-1">
        <h2 className="type-h2">{t.settings.title}</h2>
        <p className="type-body text-ink-muted">{t.settings.subtitle}</p>
      </header>

      <Tabs
        tabs={TABS}
        active={tab}
        onChange={(id) => {
          setTab(id)
          setNotice(null)
        }}
      />

      {notice && <Alert tone="success">{notice}</Alert>}

      {tab === 'general' ? (
        <GeneralSettingsTab onNotice={setNotice} />
      ) : (
        <BackupTab onNotice={setNotice} />
      )}
    </div>
  )
}
