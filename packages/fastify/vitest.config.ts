// ==============================================================================
// VITEST CONFIG — @validex/fastify
// Extends shared base with adapter-specific coverage thresholds.
// ==============================================================================

import { defineConfig, mergeConfig } from 'vitest/config'

import baseConfig from '../../vitest.config.base'

export default mergeConfig(baseConfig, defineConfig({
  test: {
    coverage: {
      thresholds: {
        lines: 98,
        functions: 98,
        branches: 98,
        statements: 98,
      },
    },
  },
}))
