// ==============================================================================
// NUXT FIXTURE CONFIG
// Minimal Nuxt app used by @nuxt/test-utils e2e tests.
// ==============================================================================

import { resolve } from 'node:path'
import { defineNuxtConfig } from 'nuxt/config'

const validexRoot = resolve(__dirname, '../../../src')

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  alias: {
    '~validex': validexRoot,
  },
  nitro: {
    alias: {
      '~validex': validexRoot,
    },
  },
})
