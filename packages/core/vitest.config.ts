// ==============================================================================
// VITEST CONFIG — @validex/core
// Extends shared base with core-specific setup, aliases, and coverage thresholds.
// ==============================================================================

import { resolve } from 'node:path'

import { defineConfig, mergeConfig } from 'vitest/config'

import baseConfig from '../../vitest.config.base'

const dir = (p: string): string => resolve(__dirname, `src/${p}`)

export default mergeConfig(baseConfig, defineConfig({
  resolve: {
    alias: {
      '@checks': dir('checks'),
      '@rules': dir('rules'),
      '@core': dir('core'),
      '@config': dir('config'),
      '@internal': dir('internal'),
      '@loaders': dir('loaders'),
      '@utilities': dir('utilities'),
      '@augmentation': dir('augmentation'),
      '@cli': dir('cli'),
      '@locales': dir('locales'),
      '@validex-types': dir('types.ts'),
    },
  },
  test: {
    setupFiles: ['./tests/_support/setup.ts'],
    coverage: {
      // mergeConfig concatenates with base exclude ['src/**/index.ts']
      exclude: ['src/data/**', 'src/types.ts'],
      thresholds: {
        lines: 98,
        functions: 98,
        branches: 95,
        statements: 98,
      },
    },
  },
}))
