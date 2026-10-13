import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { DatabaseBackup, FolderOpen, RotateCcw } from 'lucide-react'
import type {
  BackupConfig,
  BackupFile,
  BackupInterval,
  BackupStatus
} from '../../../../shared/settings'
import { Alert } from '../../components/ui/Alert'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { CheckboxField, SelectField, TextField } from '../../components/ui/Field'
import { t } from '../../i18n'
import { api, errorText } from '../../lib/api'
import { formatDateTime } from '../../lib/format'
import { useAuthStore } from '../../store/auth'

function kindLabel(file: BackupFile): string {
  if (file.automatic) return t.settings.kindAuto
  return file.name.includes('-before-restore') ? t.settings.kindBeforeRestore : t.settings.kindManual
}

function megabytes(bytes: number): string {
  return t.settings.megabytes((bytes / (1024 * 1024)).toFixed(2))
}

// null = restore from a file the user picks.
type RestoreTarget = { name: string } | 'file' | null

export function BackupTab({ onNotice }: { onNotice: (message: string | null) => void }) {
  const isOwner = useAuthStore((state) => state.user?.role === 'owner')
  const [status, setStatus] = useState<BackupStatus | null>(null)
  const [config, setConfig] = useState<BackupConfig | null>(null)
  const [keep, setKeep] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<'config' | 'folder' | 'saveAs' | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<RestoreTarget>(null)

  const apply = (next: BackupStatus) => {
    setStatus(next)
    setConfig(next.config)
    setKeep(String(next.config.keep))
  }

  const load = useCallback(async () => {
    const result = await api('backup:status')
    if (result.ok) apply(result.data)
    else setError(errorText(result))
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const saveConfig = async (event: FormEvent) => {
    event.preventDefault()
    if (!config) return
    const keepCount = Number(keep)
    if (!Number.isInteger(keepCount) || keepCount < 1 || keepCount > 365) {
      setError(t.errors.VALIDATION)
      return
    }
    setBusy('config')
    setError(null)
    onNotice(null)
    const result = await api('backup:saveConfig', { ...config, keep: keepCount })
    setBusy(null)
    if (result.ok) {
      apply(result.data)
      onNotice(t.settings.configSaved)
    } else {
      setError(errorText(result))
    }
  }

  const chooseFolder = async () => {
    const result = await api('backup:chooseFolder')
    if (!result.ok) setError(errorText(result))
    else if (result.data.path && config) setConfig({ ...config, directory: result.data.path })
  }

  const backup = async (target: 'folder' | 'saveAs') => {
    setBusy(target)
    setError(null)
    onNotice(null)
    const result = await api('backup:create', { target })
    setBusy(null)
    if (!result.ok) {
      setError(errorText(result))
      return
    }
    if (result.data) onNotice(t.settings.backupCreated(result.data.name))
    void load()
  }

  const restore = async (target: Exclude<RestoreTarget, null>) => {
    const result = await api('backup:restore', target === 'file' ? {} : { name: target.name })
    if (!result.ok) return errorText(result)
    if (!result.data.restored) {
      // The file picker was cancelled.
      setRestoreTarget(null)
      return
    }
    // The data underneath every screen has changed and everyone is signed out: start clean.
    window.location.hash = '#/'
    window.location.reload()
  }

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
            onChange={(event) => setConfig({ ...config, enabled: event.target.checked })}
          />
          <div className="grid grid-cols-2 gap-4">
            <SelectField
              label={t.settings.interval}
              value={config.interval}
              onChange={(event) =>
                setConfig({ ...config, interval: event.target.value as BackupInterval })
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
                onChange={(event) => setConfig({ ...config, directory: event.target.value })}
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
              onClick={() => setRestoreTarget('file')}
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
                          onClick={() => setRestoreTarget({ name: file.name })}
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
          onClose={() => setRestoreTarget(null)}
        />
      )}
    </div>
  )
}
