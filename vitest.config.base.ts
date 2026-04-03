// ==============================================================================
// VITEST BASE CONFIG
// Shared test configuration for all packages in the monorepo.
// ==============================================================================

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
    },
  },
})
