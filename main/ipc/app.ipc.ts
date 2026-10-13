import { app } from 'electron'
import type { TableInfo } from '../../shared/ipc'
import { getDatabasePath, getDataSource } from '../database/data-source'
import { handle } from './index'

export function registerAppIpc(): void {
  handle('app:info', async () => {
    const dataSource = getDataSource()

    const tables: TableInfo[] = []
    for (const metadata of dataSource.entityMetadatas) {
      tables.push({
        name: metadata.tableName,
        rows: await dataSource.getRepository(metadata.target).count()
      })
    }

    const executed: { name: string }[] = await dataSource.query(
      'SELECT name FROM migrations ORDER BY id'
    )

    return {
      appVersion: app.getVersion(),
      dbPath: getDatabasePath(),
      migrations: executed.map((migration) => migration.name),
      tables
    }
  })
}
