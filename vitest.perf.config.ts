import { defineConfig } from 'vitest/config'

// The benchmark: npm run bench. Kept apart from the logic tests because it builds
// a large database and takes minutes.
export default defineConfig({
  esbuild: {
    tsconfigRaw: {
      compilerOptions: { experimentalDecorators: true, useDefineForClassFields: false }
    }
  },
  test: {
    environment: 'node',
    include: ['tests/perf/benchmark.perf.ts'],
    setupFiles: ['tests/perf/setup.ts'],
    testTimeout: 30 * 60_000,
    hookTimeout: 30 * 60_000
  }
})
