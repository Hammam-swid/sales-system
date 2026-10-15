import { useCallback, useEffect, useState, type FormEvent } from 'react'
import type { BackupConfig, BackupStatus } from '../../../../shared/settings'
import { t } from '../../i18n'
import { api, errorText } from '../../lib/api'
import { useAuthStore } from '../../store/auth'

// null = no restore pending; 'file' = restore from a file the user picks.
export type RestoreTarget = { name: string } | 'file' | null

export function useBackupTab(onNotice: (message: string | null) => void) {
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

  const updateConfig = (patch: Partial<BackupConfig>) =>
    setConfig((current) => (current ? { ...current, ...patch } : current))

  return {
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
    askRestore: setRestoreTarget,
    cancelRestore: () => setRestoreTarget(null),
    restore
  }
}
