// ==============================================================================
// NUXT FIXTURE CONFIG
// Minimal Nuxt app used by @nuxt/test-utils e2e tests.
// ==============================================================================

import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  modules: ['@validex/nuxt'],
})
