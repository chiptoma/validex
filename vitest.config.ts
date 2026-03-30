import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/index.ts', 'src/data/**', 'src/types.ts', 'src/internal/normalizers.ts', 'src/config/defaults.ts'],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 80,
        statements: 95,
      },
    },
  },
})
