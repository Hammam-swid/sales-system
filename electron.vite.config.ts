import { resolve } from 'node:path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    build: {
      lib: { entry: resolve(__dirname, 'main/main.ts') }
    },
    // TypeORM entities rely on legacy (experimental) decorators.
    esbuild: {
      tsconfigRaw: {
        compilerOptions: { experimentalDecorators: true, useDefineForClassFields: false }
      }
    }
  },
  preload: {
    build: {
      lib: { entry: resolve(__dirname, 'main/preload.ts') }
    }
  },
  renderer: {
    root: resolve(__dirname, 'renderer'),
    build: {
      rollupOptions: { input: resolve(__dirname, 'renderer/index.html') }
    },
    plugins: [react(), tailwindcss()]
  }
})
