// ==============================================================================
// VITEST CONFIG — @validex/core
// Extends shared base with core-specific setup and coverage thresholds.
// ==============================================================================

import { defineConfig, mergeConfig } from 'vitest/config'

import baseConfig from '../../vitest.config.base'

export default mergeConfig(baseConfig, defineConfig({
  test: {
    setupFiles: ['./tests/_support/setup.ts'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/index.ts', 'src/data/**', 'src/types.ts'],
      thresholds: {
        lines: 98,
        functions: 98,
        branches: 95,
        statements: 98,
      },
    },
  },
}))
