import 'reflect-metadata'
import { mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { vi } from 'vitest'

// One fixed folder, so the generated shop can be reused (--reuse) and opened by
// the app for the startup measurements.
export const perfData = process.env.PERF_DATA_DIR ?? join(tmpdir(), 'pos-perf-data')
mkdirSync(perfData, { recursive: true })

vi.mock('electron', () => ({
  app: { getPath: () => perfData, getVersion: () => '0.0.0-perf', isPackaged: false },
  dialog: {},
  BrowserWindow: { getAllWindows: () => [], getFocusedWindow: () => null }
}))
