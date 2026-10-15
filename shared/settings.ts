// Types for shop settings and database backups.
import type { StoreType } from './store'

export const LANGUAGES = ['ar', 'en'] as const
export type Language = (typeof LANGUAGES)[number]

export interface AppSettings {
  storeName: string
  storeAddress: string
  storePhone: string
  // A data: URL (PNG, JPEG or WebP), or null when no logo is set.
  storeLogo: string | null
  currency: string
  // Percentage, e.g. 15 for 15%.
  taxRate: number
  language: Language
  // Chosen at first-run setup and fixed from then on.
  storeType: StoreType
}

export type SaveSettingsRequest = Omit<AppSettings, 'storeType'>

// Largest logo accepted, as the length of its data: URL.
export const MAX_LOGO_LENGTH = 400_000

export const BACKUP_INTERVALS = ['daily', 'weekly'] as const
export type BackupInterval = (typeof BACKUP_INTERVALS)[number]

export interface BackupConfig {
  // Whether automatic backups run.
  enabled: boolean
  interval: BackupInterval
  // Folder that receives backups.
  directory: string
  // How many automatic backups to keep; older ones are removed.
  keep: number
}

export interface BackupFile {
  name: string
  size: number
  createdAt: string
  // Made by the schedule (and therefore subject to pruning).
  automatic: boolean
}

export interface BackupStatus {
  config: BackupConfig
  lastBackupAt: string | null
  // Newest first.
  backups: BackupFile[]
}

export interface CreateBackupRequest {
  // 'folder': into the configured backup folder. 'saveAs': ask where to save.
  target: 'folder' | 'saveAs'
}

export interface RestoreBackupRequest {
  // A backup from the configured folder; omit to pick a file.
  name?: string
}
