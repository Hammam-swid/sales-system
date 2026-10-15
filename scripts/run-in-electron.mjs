// Runs a Node script with Electron's own Node, so native modules built for
// Electron (better-sqlite3) load exactly as they do in the app.
// Usage: node scripts/run-in-electron.mjs <script> [args...]
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const electron = require('electron')

const child = spawn(electron, process.argv.slice(2), {
  stdio: 'inherit',
  env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
})
child.on('exit', (code, signal) => process.exit(signal ? 1 : (code ?? 1)))
