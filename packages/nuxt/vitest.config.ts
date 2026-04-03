// ==============================================================================
// VITEST CONFIG — @validex/nuxt
// Extends shared base with package-specific coverage settings.
// ==============================================================================

import { defineConfig, mergeConfig } from 'vitest/config'

import baseConfig from '../../vitest.config.base'

export default mergeConfig(baseConfig, defineConfig({
  test: {
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/**/index.ts'],
    },
  },
}))
