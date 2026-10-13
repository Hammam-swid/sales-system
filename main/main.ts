import 'reflect-metadata'
import { join } from 'node:path'
import { app, BrowserWindow, Menu, shell } from 'electron'
import { closeDatabase, initDatabase } from './database/data-source'
import { seedDatabase } from './database/seed'
import { registerIpcHandlers } from './ipc'
import { startBackupScheduler } from './services/backup.service'

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  win.once('ready-to-show', () => win.show())

  // The app never navigates away from its own UI; external links open in the OS browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) void shell.openExternal(url)
    return { action: 'deny' }
  })

  if (!app.isPackaged && process.env.ELECTRON_RENDERER_URL) {
    void win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

async function bootstrap(): Promise<void> {
  const dataSource = await initDatabase()

  // `npm run seed` launches the app with --seed: fill sample data and exit without a window.
  if (process.argv.includes('--seed')) {
    const result = await seedDatabase(dataSource)
    console.log(result.seeded ? 'Seed completed.' : 'Seed skipped: database already has data.')
    await closeDatabase()
    app.quit()
    return
  }

  // The installed app has no use for the default menu, and it would expose
  // developer tools and page reload to whoever is at the till.
  if (app.isPackaged) Menu.setApplicationMenu(null)

  registerIpcHandlers()
  startBackupScheduler()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
}

if (!app.requestSingleInstanceLock()) {
  // Two instances writing to the same SQLite file is never wanted.
  app.quit()
} else {
  app.on('second-instance', () => {
    const [win] = BrowserWindow.getAllWindows()
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  app.whenReady().then(bootstrap).catch((error) => {
    console.error('Failed to start application:', error)
    app.exit(1)
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
  })

  app.on('will-quit', () => {
    void closeDatabase()
  })
}
