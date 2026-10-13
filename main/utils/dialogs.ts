import { join } from 'node:path'
import { app, BrowserWindow, dialog, type FileFilter } from 'electron'
import { AppError } from '../errors'

// In unpackaged development builds these environment variables answer the dialogs,
// so automated checks can run unattended. They are ignored in packaged builds.
function unattended(name: 'POS_EXPORT_DIR' | 'POS_OPEN_FILE' | 'POS_CHOOSE_DIR'): string | undefined {
  return app.isPackaged ? undefined : process.env[name] || undefined
}

export function activeWindow(): BrowserWindow {
  const window = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  if (!window) throw new AppError('INTERNAL')
  return window
}

// Returns null when the user cancels.
export async function chooseSavePath(fileName: string, filter: FileFilter): Promise<string | null> {
  const directory = unattended('POS_EXPORT_DIR')
  if (directory) return join(directory, fileName)

  const result = await dialog.showSaveDialog(activeWindow(), {
    defaultPath: join(app.getPath('documents'), fileName),
    filters: [filter]
  })
  return result.canceled || !result.filePath ? null : result.filePath
}

export async function chooseOpenPath(filter: FileFilter): Promise<string | null> {
  const file = unattended('POS_OPEN_FILE')
  if (file) return file

  const result = await dialog.showOpenDialog(activeWindow(), {
    properties: ['openFile'],
    filters: [filter]
  })
  return result.canceled ? null : (result.filePaths[0] ?? null)
}

export async function chooseFolder(): Promise<string | null> {
  const directory = unattended('POS_CHOOSE_DIR')
  if (directory) return directory

  const result = await dialog.showOpenDialog(activeWindow(), {
    properties: ['openDirectory', 'createDirectory']
  })
  return result.canceled ? null : (result.filePaths[0] ?? null)
}
