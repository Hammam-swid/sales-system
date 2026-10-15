import { DatabaseBackup, FolderOpen, RotateCcw } from 'lucide-react'
import type { BackupFile, BackupInterval } from '../../../../shared/settings'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { CheckboxField, SelectField, TextField } from '../../components/ui/Field'
import { useBackupTab } from '../../hooks/settings/useBackupTab'
import { t } from '../../i18n'
import { formatDateTime } from '../../lib/format'

function kindLabel(file: BackupFile): string {
  if (file.automatic) return t.settings.kindAuto
  return file.name.includes('-before-restore') ? t.settings.kindBeforeRestore : t.settings.kindManual
}

function megabytes(bytes: number): string {
  return t.settings.megabytes((bytes / (1024 * 1024)).toFixed(2))
}

export function BackupTab({ onNotice }: { onNotice: (message: string | null) => void }) {
  const {
    isOwner,
    status,
    config,
    updateConfig,
    keep,
    setKeep,
    error,
    busy,
    saveConfig,
    chooseFolder,
    backup,
    restoreTarget,
    askRestore,
    cancelRestore,
    restore
  } = useBackupTab(onNotice)

  if (!status || !config) {
    return error ? (
      <Alert>{error}</Alert>
    ) : (
      <p className="type-body-sm py-10 text-center text-ink-muted">{t.common.loading}</p>
    )
  }

  return (
    <div className="space-y-6">
      {error && <Alert>{error}</Alert>}

      <Card className="p-6">
        <form onSubmit={saveConfig} className="space-y-4">
          <h3 className="type-h4">{t.settings.autoSection}</h3>
          <CheckboxField
            label={t.settings.autoEnabled}
            checked={config.enabled}
            onChange={(event) => updateConfig({ enabled: event.target.checked })}
          />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label={t.settings.interval}
              value={config.interval}
              onChange={(event) =>
                updateConfig({ interval: event.target.value as BackupInterval })
              }
              disabled={!config.enabled}
            >
              <option value="daily">{t.settings.intervalDaily}</option>
              <option value="weekly">{t.settings.intervalWeekly}</option>
            </SelectField>
            <TextField
              label={t.settings.keep}
              hint={t.settings.keepHint}
              type="number"
              min={1}
              max={365}
              step={1}
              dir="ltr"
              className="text-start"
              value={keep}
              onChange={(event) => setKeep(event.target.value)}
              required
            />
          </div>
          <div className="flex items-end gap-2">
            <div className="min-w-0 flex-1">
              <TextField
                label={t.settings.directory}
                hint={t.settings.directoryHint}
                value={config.directory}
                onChange={(event) => updateConfig({ directory: event.target.value })}
                dir="ltr"
                className="text-start"
                spellCheck={false}
                required
              />
            </div>
          </div>
          <div className="flex justify-between gap-2">
            <Button
              variant="secondary"
              icon={<FolderOpen aria-hidden className="size-4" />}
              onClick={chooseFolder}
            >
              {t.settings.chooseFolder}
            </Button>
            <Button type="submit" loading={busy === 'config'}>
              {t.common.save}
            </Button>
          </div>
        </form>
      </Card>

      <Card className="space-y-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="type-h4">{t.settings.manualSection}</h3>
            <p className="type-body-sm text-ink-muted">
              {t.settings.lastBackup}:{' '}
              {status.lastBackupAt ? formatDateTime(status.lastBackupAt) : t.settings.never}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              loading={busy === 'saveAs'}
              disabled={busy !== null}
              onClick={() => backup('saveAs')}
            >
              {t.settings.backupSaveAs}
            </Button>
            <Button
              icon={<DatabaseBackup aria-hidden className="size-4" />}
              loading={busy === 'folder'}
              disabled={busy !== null}
              onClick={() => backup('folder')}
            >
              {t.settings.backupNow}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-x-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 pt-5 pb-3">
          <h3 className="type-h4">{t.settings.backupsList}</h3>
          {isOwner ? (
            <Button
              variant="secondary"
              size="sm"
              icon={<RotateCcw aria-hidden className="size-4" />}
              onClick={() => askRestore('file')}
            >
              {t.settings.restoreFromFile}
            </Button>
          ) : (
            <p className="type-caption text-ink-muted">{t.settings.restoreOwnerOnly}</p>
          )}
        </div>
        {status.backups.length === 0 ? (
          <p className="type-body-sm px-6 pb-8 text-center text-ink-muted">
            {t.settings.noBackups}
          </p>
        ) : (
          <table className="type-body-sm w-full">
            <thead className="type-label border-y border-border text-ink-muted">
              <tr>
                <th className="px-6 py-3 text-start">{t.settings.created}</th>
                <th className="px-6 py-3 text-start">{t.settings.kind}</th>
                <th className="px-6 py-3 text-start">{t.settings.fileName}</th>
                <th className="px-6 py-3 text-end">{t.settings.size}</th>
                {isOwner && <th className="px-6 py-3 text-end">{t.common.actions}</th>}
              </tr>
            </thead>
            <tbody>
              {status.backups.map((file) => (
                <tr key={file.name} className="border-b border-border last:border-0">
                  <td className="px-6 py-2 whitespace-nowrap tabular-nums">
                    {formatDateTime(file.createdAt)}
                  </td>
                  <td className="px-6 py-2">
                    <Badge tone={file.automatic ? 'neutral' : 'brand'}>{kindLabel(file)}</Badge>
                  </td>
                  <td dir="ltr" className="type-caption px-6 py-2 text-ink-muted">
                    {file.name}
                  </td>
                  <td className="px-6 py-2 text-end tabular-nums">{megabytes(file.size)}</td>
                  {isOwner && (
                    <td className="px-6 py-2">
                      <div className="flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => askRestore({ name: file.name })}
                        >
                          {t.settings.restore}
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {restoreTarget && (
        <ConfirmDialog
          title={t.settings.restoreTitle}
          body={
            restoreTarget === 'file'
              ? t.settings.restoreFileBody
              : t.settings.restoreBody(restoreTarget.name)
          }
          confirmLabel={t.settings.restoreConfirm}
          onConfirm={() => restore(restoreTarget)}
          onClose={() => cancelRestore()}
        />
      )}
    </div>
  )
}
