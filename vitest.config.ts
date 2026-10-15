import { defineConfig } from 'vitest/config'

export default defineConfig({
  // TypeORM entities need legacy decorators and class fields left to the decorators.
  esbuild: {
    tsconfigRaw: {
      compilerOptions: { experimentalDecorators: true, useDefineForClassFields: false }
    }
  },
  test: {
    environment: 'node',
    include: ['tests/logic/**/*.test.ts'],
    setupFiles: ['tests/logic/setup.ts'],
    // Each file opens its own database through module-level state in data-source.ts.
    fileParallelism: false,
    testTimeout: 20_000
  }
})
