import { Alert } from '../../components/ui/Alert'
import { Tabs } from '../../components/ui/Tabs'
import { useSettingsPage } from '../../hooks/settings/useSettingsPage'
import { t } from '../../i18n'
import { BackupTab } from './BackupTab'
import { GeneralSettingsTab } from './GeneralSettingsTab'

const TABS = [
  { id: 'general' as const, label: t.settings.tabGeneral },
  { id: 'backup' as const, label: t.settings.tabBackup }
]

export function SettingsPage() {
  const { tab, changeTab, notice, setNotice } = useSettingsPage()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header className="space-y-1">
        <h2 className="type-h2">{t.settings.title}</h2>
        <p className="type-body text-ink-muted">{t.settings.subtitle}</p>
      </header>

      <Tabs
        tabs={TABS}
        active={tab}
        onChange={changeTab}
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
