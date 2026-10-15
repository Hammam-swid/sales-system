import 'reflect-metadata'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { vi } from 'vitest'

// Each test file gets its own folder in place of Electron's userData.
export const userData = mkdtempSync(join(tmpdir(), 'pos-test-'))

vi.mock('electron', () => ({
  app: {
    getPath: () => userData,
    getVersion: () => '0.0.0-test',
    isPackaged: false
  },
  dialog: {},
  BrowserWindow: { getAllWindows: () => [], getFocusedWindow: () => null }
}))
