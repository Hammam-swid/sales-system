import { existsSync } from 'node:fs'
import { copyFile, mkdir, readdir, rm, stat } from 'node:fs/promises'
import { basename, join, resolve } from 'node:path'
import Database from 'better-sqlite3'
import { app } from 'electron'
import {
  BACKUP_INTERVALS,
  type BackupConfig,
  type BackupFile,
  type BackupStatus
} from '../../shared/settings'
import { clearSession, type SessionUser } from '../auth/session'
import {
  closeDatabase,
  getDatabasePath,
  getDataSource,
  initDatabase
} from '../database/data-source'
import { migrations } from '../database/migrations'
import { AppError } from '../errors'
import { chooseFolder, chooseOpenPath, chooseSavePath } from '../utils/dialogs'
import { recordAudit } from './audit.service'
import { readSettingValues, writeSettingValues } from './settings.service'
import { asBoolean, asObject, asOneOf, asText } from './validation'

const FILE_PATTERN = /^pos-backup-\d{8}-\d{6}(-auto|-before-restore)?\.db$/
const BACKUP_FILTER = { name: 'Database backup', extensions: ['db'] }
const HOUR = 60 * 60 * 1000
const INTERVAL_MS = { daily: 24 * HOUR, weekly: 7 * 24 * HOUR }
const REQUIRED_TABLES = ['users', 'products', 'sales', 'settings', 'migrations']

type BackupKind = 'manual' | 'auto' | 'before-restore'

// True while the database file is being swapped; the scheduler stays out of the way.
let restoring = false

function defaultDirectory(): string {
  return join(app.getPath('userData'), 'backups')
}

async function readConfig(): Promise<{ config: BackupConfig; lastBackupAt: string | null }> {
  const values = await readSettingValues(getDataSource().manager)
  const keep = Math.floor(Number(values.get('backup_keep')))
  const interval = values.get('backup_interval')
  return {
    config: {
      // On unless explicitly switched off: a shop should not lose its data by default.
      enabled: values.get('backup_enabled') !== '0',
      interval: interval === 'weekly' ? 'weekly' : 'daily',
      directory: values.get('backup_directory') || defaultDirectory(),
      keep: Number.isFinite(keep) && keep >= 1 ? Math.min(keep, 365) : 14
    },
    lastBackupAt: values.get('backup_last_at') || null
  }
}

function fileName(kind: BackupKind, at: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  const stamp =
    `${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}-` +
    `${pad(at.getHours())}${pad(at.getMinutes())}${pad(at.getSeconds())}`
  return `pos-backup-${stamp}${kind === 'manual' ? '' : `-${kind}`}.db`
}

async function describe(path: string): Promise<BackupFile> {
  const info = await stat(path)
  const name = basename(path)
  return {
    name,
    size: info.size,
    createdAt: info.mtime.toISOString(),
    automatic: name.endsWith('-auto.db')
  }
}

async function listBackups(directory: string): Promise<BackupFile[]> {
  if (!existsSync(directory)) return []
  const names = (await readdir(directory)).filter((name) => FILE_PATTERN.test(name))
  const files = await Promise.all(names.map((name) => describe(join(directory, name))))
  return files.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

// Copies the live database with SQLite's online backup, which is safe while the app
// is running and includes changes still sitting in the write-ahead log.
async function writeBackup(target: string): Promise<void> {
  const connection = (getDataSource().driver as unknown as { databaseConnection: Database.Database })
    .databaseConnection
  try {
    await connection.backup(target)
  } catch (error) {
    console.error('Backup failed:', error)
    throw new AppError('BACKUP_FAILED')
  }
}

async function backupToFolder(kind: BackupKind): Promise<BackupFile> {
  const { config } = await readConfig()
  try {
    await mkdir(config.directory, { recursive: true })
  } catch {
    throw new AppError('BACKUP_FAILED')
  }
  const target = join(config.directory, fileName(kind, new Date()))
  await writeBackup(target)
  await writeSettingValues(getDataSource().manager, { backup_last_at: new Date().toISOString() })

  if (kind === 'auto') {
    // Only automatic backups are pruned; ones a person made are theirs to remove.
    const automatic = (await listBackups(config.directory)).filter((file) => file.automatic)
    for (const old of automatic.slice(config.keep)) {
      await rm(join(config.directory, old.name), { force: true })
    }
  }
  return describe(target)
}

export async function backupStatus(): Promise<BackupStatus> {
  const { config, lastBackupAt } = await readConfig()
  return { config, lastBackupAt, backups: await listBackups(config.directory) }
}

export async function saveBackupConfig(payload: unknown): Promise<BackupStatus> {
  const input = asObject(payload)
  const keep = Number(input.keep)
  if (!Number.isInteger(keep) || keep < 1 || keep > 365) throw new AppError('VALIDATION', 'keep')
  const directory = resolve(asText(input.directory, 'directory', 500))

  try {
    await mkdir(directory, { recursive: true })
  } catch {
    throw new AppError('VALIDATION', 'directory')
  }

  await writeSettingValues(getDataSource().manager, {
    backup_enabled: asBoolean(input.enabled, 'enabled') ? '1' : '0',
    backup_interval: asOneOf(input.interval, BACKUP_INTERVALS, 'interval'),
    backup_directory: directory,
    backup_keep: String(keep)
  })
  return backupStatus()
}

export async function chooseBackupFolder(): Promise<{ path: string | null }> {
  return { path: await chooseFolder() }
}

export async function createBackup(payload: unknown): Promise<BackupFile | null> {
  const target = asOneOf(asObject(payload).target, ['folder', 'saveAs'] as const, 'target')
  if (target === 'folder') return backupToFolder('manual')

  const path = await chooseSavePath(fileName('manual', new Date()), BACKUP_FILTER)
  if (!path) return null
  // SQLite will not back up onto the database it is reading.
  if (resolve(path) === resolve(getDatabasePath())) throw new AppError('VALIDATION', 'path')
  await writeBackup(path)
  return describe(path)
}

// A backup is accepted only if it is a healthy database from this application
// that this version knows how to open.
function validateBackup(path: string): void {
  let candidate: Database.Database | null = null
  try {
    candidate = new Database(path, { readonly: true, fileMustExist: true })
    const tables = new Set(
      (candidate.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all() as {
        name: string
      }[]).map((row) => row.name)
    )
    if (!REQUIRED_TABLES.every((table) => tables.has(table))) throw new Error('not a POS database')

    const check = candidate.pragma('quick_check', { simple: true })
    if (check !== 'ok') throw new Error(`integrity: ${String(check)}`)

    // A backup from a newer version has migrations this build cannot understand.
    const known = new Set(migrations.map((migration) => migration.name))
    const applied = candidate.prepare('SELECT name FROM migrations').all() as { name: string }[]
    if (applied.some((row) => !known.has(row.name))) throw new Error('made by a newer version')
  } catch (error) {
    console.error('Rejected backup file:', error)
    throw new AppError('INVALID_BACKUP')
  } finally {
    candidate?.close()
  }
}

async function removeIfPresent(path: string): Promise<void> {
  await rm(path, { force: true })
}

// Replaces the live database with a backup. The current data is saved first, and put
// back if the backup cannot be opened. Everyone is signed out afterwards.
export async function restoreBackup(
  payload: unknown,
  actor: SessionUser
): Promise<{ restored: boolean }> {
  // Restoring discards everything since the backup: owner only.
  if (actor.role !== 'owner') throw new AppError('FORBIDDEN')
  const input = asObject(payload ?? {})
  const { config } = await readConfig()

  let source: string | null
  if (input.name === undefined || input.name === null) {
    source = await chooseOpenPath(BACKUP_FILTER)
    if (!source) return { restored: false }
  } else {
    // Only a file name from the backup folder is accepted, never a path.
    const name = asText(input.name, 'name', 100)
    if (!FILE_PATTERN.test(name)) throw new AppError('VALIDATION', 'name')
    source = join(config.directory, name)
  }

  const databasePath = getDatabasePath()
  if (!existsSync(source) || resolve(source) === resolve(databasePath)) {
    throw new AppError('INVALID_BACKUP')
  }
  validateBackup(source)

  const actorName = (await getDataSource().query('SELECT username FROM users WHERE id = ?', [
    actor.id
  ])) as { username: string }[]

  restoring = true
  try {
    const safety = await backupToFolder('before-restore')
    const safetyPath = join(config.directory, safety.name)

    const swapIn = async (file: string) => {
      await closeDatabase()
      await copyFile(file, databasePath)
      // Leftover journal files belong to the old database and would corrupt the new one.
      await removeIfPresent(`${databasePath}-wal`)
      await removeIfPresent(`${databasePath}-shm`)
      // Opening also runs any migrations an older backup is missing.
      await initDatabase()
    }

    try {
      await swapIn(source)
    } catch (error) {
      console.error('Restore failed, putting the previous data back:', error)
      await swapIn(safetyPath)
      throw new AppError('INVALID_BACKUP')
    }

    // Where and how often to back up describes this computer, not the restored data:
    // keep the current arrangement instead of whatever the backup happened to contain.
    await writeSettingValues(getDataSource().manager, {
      backup_enabled: config.enabled ? '1' : '0',
      backup_interval: config.interval,
      backup_directory: config.directory,
      backup_keep: String(config.keep),
      backup_last_at: new Date().toISOString()
    })

    // The signed-in user may not exist in the restored data.
    clearSession()
    await recordAudit({
      userId: null,
      action: 'restore_backup',
      entityType: 'database',
      details: { file: basename(source), by: actorName[0]?.username ?? null, safety: safety.name }
    })
    return { restored: true }
  } finally {
    restoring = false
  }
}

async function runScheduledBackup(): Promise<void> {
  if (restoring) return
  try {
    const { config, lastBackupAt } = await readConfig()
    if (!config.enabled) return
    const last = lastBackupAt ? Date.parse(lastBackupAt) : 0
    if (Number.isFinite(last) && Date.now() - last < INTERVAL_MS[config.interval]) return
    await backupToFolder('auto')
  } catch (error) {
    // A failed automatic backup must never interrupt selling.
    console.error('Scheduled backup failed:', error)
  }
}

// Checks shortly after start-up and then hourly whether a backup is due.
export function startBackupScheduler(): void {
  setTimeout(() => void runScheduledBackup(), 30_000)
  setInterval(() => void runScheduledBackup(), HOUR)
}
