// ==============================================================================
// NUXT MODULE — UNIT TESTS
// Tests the exported module helpers: setupValidex, detectNuxtI18n, and
// the defineNuxtModule default export.
// ==============================================================================

import { getConfig, resetConfig } from '@validex/core'
import { afterEach, describe, expect, it } from 'vitest'

import validexModule, { detectNuxtI18n, setupValidex } from '../../src'

afterEach(() => resetConfig())

// ----------------------------------------------------------
// MODULE REGISTRATION
// ----------------------------------------------------------

describe('setupValidex', () => {
  it('registers without errors with default options', async () => {
    await expect(setupValidex()).resolves.not.toThrow()
  })

  it('applies rules config to global config', async () => {
    await setupValidex({ rules: { email: { blockPlusAlias: true } } })
    expect(getConfig().rules?.email?.blockPlusAlias).toBe(true)
  })

  it('applies i18n config with prefix and separator', async () => {
    await setupValidex({ i18n: { enabled: true, prefix: 'v', separator: ':' } })
    const config = getConfig()
    expect(config.i18n.enabled).toBe(true)
    expect(config.i18n.prefix).toBe('v')
    expect(config.i18n.separator).toBe(':')
  })

  it('defaults i18n.enabled to false when not specified', async () => {
    await setupValidex({ i18n: { prefix: 'custom' } })
    const config = getConfig()
    expect(config.i18n.enabled).toBe(false)
    expect(config.i18n.prefix).toBe('custom')
  })

  it('handles preload option without error', async () => {
    await setupValidex({ preload: { disposable: true } })
  })

  it('is idempotent when called twice', async () => {
    await setupValidex({ rules: { email: { blockPlusAlias: true } } })
    await setupValidex({ rules: { email: { blockPlusAlias: true } } })
    expect(getConfig().rules?.email?.blockPlusAlias).toBe(true)
  })

  it('applies empty rules object without error', async () => {
    await setupValidex({ rules: {} })
    expect(getConfig().i18n.enabled).toBe(false)
  })

  it('applies i18n pathMode key', async () => {
    await setupValidex({ i18n: { enabled: true, pathMode: 'key' } })
    expect(getConfig().i18n.pathMode).toBe('key')
  })

  it('applies i18n pathMode full', async () => {
    await setupValidex({ i18n: { enabled: true, pathMode: 'full' } })
    expect(getConfig().i18n.pathMode).toBe('full')
  })

  it('i18n.enabled explicitly false does not enable i18n', async () => {
    await setupValidex({ i18n: { enabled: false } })
    expect(getConfig().i18n.enabled).toBe(false)
  })
})

// ----------------------------------------------------------
// I18N DETECTION
// ----------------------------------------------------------

describe('detectNuxtI18n', () => {
  it('detects @nuxtjs/i18n', () => {
    expect(detectNuxtI18n(['@nuxtjs/i18n'])).toBe(true)
  })

  it('detects @nuxtjs/i18n alongside other modules', () => {
    expect(detectNuxtI18n(['@nuxtjs/i18n', '@pinia/nuxt'])).toBe(true)
  })

  it('detects nuxt-i18n', () => {
    expect(detectNuxtI18n(['nuxt-i18n'])).toBe(true)
  })

  it('returns false when i18n module absent', () => {
    expect(detectNuxtI18n(['@pinia/nuxt', '@vueuse/nuxt'])).toBe(false)
  })

  it('returns false for empty module list', () => {
    expect(detectNuxtI18n([])).toBe(false)
  })

  it('returns false for unrelated modules', () => {
    expect(detectNuxtI18n(['@pinia/nuxt', '@vueuse/nuxt', 'some-module'])).toBe(false)
  })
})

// ----------------------------------------------------------
// SSR SIMULATION
// ----------------------------------------------------------

describe('server-side rendering simulation', () => {
  it('setupValidex with preload resolves without error', async () => {
    await expect(setupValidex({
      preload: { countryCodes: true, currencyCodes: true },
    })).resolves.not.toThrow()
  })

  it('config is available after server-side setup', async () => {
    await setupValidex({ rules: { email: { blockPlusAlias: true } } })
    expect(getConfig().rules?.email?.blockPlusAlias).toBe(true)
  })
})

// ----------------------------------------------------------
// DEFAULT EXPORT
// ----------------------------------------------------------

describe('default export', () => {
  it('is a callable defineNuxtModule result', () => {
    expect(validexModule).toBeDefined()
  })
})
