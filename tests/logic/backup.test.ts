import { copyFileSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import Database from 'better-sqlite3'
import { afterEach, describe, expect, it } from 'vitest'
import { backupStatus, createBackup, restoreBackup } from '../../main/services/backup.service'
import { listProducts } from '../../main/services/products.service'
import { expectError, freshShop, makeProduct } from './helpers'

afterEach(() => {
  delete process.env.POS_OPEN_FILE
})

describe('backups', () => {
  it('copy the database into the backup folder and restore it', async () => {
    const { owner } = await freshShop()
    await makeProduct(owner, { name: 'Before backup' })
    const file = await createBackup({ target: 'folder' })
    expect(file?.name).toMatch(/^pos-backup-\d{8}-\d{6}\.db$/)
    expect((await backupStatus()).backups.map((b) => b.name)).toContain(file!.name)

    await makeProduct(owner, { name: 'After backup' })
    expect(await restoreBackup({ name: file!.name }, owner)).toEqual({ restored: true })
    const names = (await listProducts({}, owner)).items.map((p) => p.name)
    expect(names).toEqual(['Before backup'])

    // A safety copy of the replaced data is kept.
    const kinds = (await backupStatus()).backups.map((b) => b.name)
    expect(kinds.some((name) => name.includes('-before-restore'))).toBe(true)
  })

  it('reject a file that is not a database of this app', async () => {
    const { owner } = await freshShop()
    const folder = mkdtempSync(join(tmpdir(), 'pos-bad-'))
    const junk = join(folder, 'junk.db')
    writeFileSync(junk, 'not a database')
    process.env.POS_OPEN_FILE = junk
    await expectError(restoreBackup({}, owner), 'INVALID_BACKUP')
  })

  it('reject a backup made by a newer version', async () => {
    const { owner } = await freshShop()
    const file = await createBackup({ target: 'folder' })
    const status = await backupStatus()
    const newer = join(mkdtempSync(join(tmpdir(), 'pos-newer-')), 'newer.db')
    copyFileSync(join(status.config.directory, file!.name), newer)
    const db = new Database(newer)
    db.prepare('INSERT INTO migrations (timestamp, name) VALUES (?, ?)').run(9999999999999, 'Future9999999999999')
    db.close()
    process.env.POS_OPEN_FILE = newer
    await expectError(restoreBackup({}, owner), 'INVALID_BACKUP')
  })

  it('may only be restored by the owner, and only by file name from the folder', async () => {
    const { owner, cashier } = await freshShop()
    await expectError(restoreBackup({ name: 'pos-backup-20260101-000000.db' }, cashier), 'FORBIDDEN')
    await expectError(restoreBackup({ name: '../../etc/passwd' }, owner), 'VALIDATION')
  })
})
