import path from 'node:path'
import { defineConfig } from 'vitest/config'

const PROJECT_DIR = import.meta.dirname

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(PROJECT_DIR, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
