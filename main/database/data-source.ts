import { join } from 'node:path'
import { app } from 'electron'
import { DataSource } from 'typeorm'
import { entities } from './entities'
import { migrations } from './migrations'

let dataSource: DataSource | null = null

export function getDatabasePath(): string {
  return join(app.getPath('userData'), 'pos.db')
}

export async function initDatabase(): Promise<DataSource> {
  if (dataSource?.isInitialized) return dataSource

  dataSource = new DataSource({
    type: 'better-sqlite3',
    database: getDatabasePath(),
    entities,
    migrations,
    // The schema is only ever changed through migrations.
    synchronize: false,
    migrationsRun: true,
    enableWAL: true
  })

  await dataSource.initialize()
  return dataSource
}

export function getDataSource(): DataSource {
  if (!dataSource?.isInitialized) throw new Error('Database is not initialized')
  return dataSource
}

export async function closeDatabase(): Promise<void> {
  if (dataSource?.isInitialized) await dataSource.destroy()
  dataSource = null
}
