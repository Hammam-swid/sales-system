// npm run bench [-- --reuse]: builds the busy-shop database (or reuses it), times the
// main operations through the real services, then measures startup in the built app.
// The report lands in tests/perf/results/.
import { spawnSync } from 'node:child_process'

const reuse = process.argv.includes('--reuse')
const env = { ...process.env, PERF_REUSE: reuse ? '1' : '0' }

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', env, shell: process.platform === 'win32' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run('node', ['scripts/run-in-electron.mjs', 'node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.perf.config.ts'])
run('npx', ['electron-vite', 'build'])
run('npx', ['playwright', 'test', 'tests/perf/startup.spec.ts'])
