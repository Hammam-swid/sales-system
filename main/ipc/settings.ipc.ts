import {
  backupStatus,
  chooseBackupFolder,
  createBackup,
  restoreBackup,
  saveBackupConfig
} from '../services/backup.service'
import { getLocale, getSettings, saveSettings } from '../services/settings.service'
import { handle } from './handle'

export function registerSettingsIpc(): void {
  // Any signed-in user needs the currency and tax rate to display prices.
  handle('settings:get', {}, () => getSettings())
  handle('settings:save', { permission: 'settings.manage' }, (payload, user) =>
    saveSettings(payload, user)
  )
  handle('app:locale', { public: true }, () => getLocale())

  const permission = 'settings.manage'
  handle('backup:status', { permission }, () => backupStatus())
  handle('backup:saveConfig', { permission }, (payload) => saveBackupConfig(payload))
  handle('backup:chooseFolder', { permission }, () => chooseBackupFolder())
  handle('backup:create', { permission }, (payload) => createBackup(payload))
  handle('backup:restore', { permission }, (payload, user) => restoreBackup(payload, user))
}
