// ==============================================================================
// CONFIG STORE TESTS
// Tests setup, getConfig, resetConfig, and configure functions.
// ==============================================================================

import { afterEach, describe, expect, it } from 'vitest'

import { configure, getConfig, resetConfig, setup } from '@config'

describe('config store', () => {
  afterEach(() => {
    resetConfig()
  })

  it('should return default config when no setup called', () => {
    const config = getConfig()
    expect(config.i18n.enabled).toBe(false)
    expect(config.i18n.prefix).toBe('validation')
    expect(config.i18n.separator).toBe('.')
    expect(config.i18n.pathMode).toBe('semantic')
  })

  it('should have derived label fallback by default', () => {
    const config = getConfig()
    expect(config.label?.fallback).toBe('derived')
  })

  it('should store config via setup()', () => {
    setup({ rules: { email: { blockDisposable: true } } })
    const config = getConfig()
    const emailRules = config.rules?.email
    expect(emailRules?.blockDisposable).toBe(true)
  })

  it('should deep merge when setup() called multiple times', () => {
    setup({ rules: { password: { uppercase: { min: 2 } } } })
    setup({ rules: { password: { digits: { min: 1 } } } })
    const config = getConfig()
    const pwRules = config.rules?.password
    const uppercase = pwRules?.uppercase as Record<string, unknown> | undefined
    const digits = pwRules?.digits as Record<string, unknown> | undefined
    expect(uppercase?.['min']).toBe(2)
    expect(digits?.['min']).toBe(1)
  })

  it('should reset config to defaults', () => {
    setup({ rules: { email: { blockDisposable: true } } })
    resetConfig()
    const config = getConfig()
    expect(config.rules).toBeUndefined()
  })

  it('should enable i18n via setup()', () => {
    setup({ i18n: { enabled: true } })
    const config = getConfig()
    expect(config.i18n.enabled).toBe(true)
    expect(config.i18n.prefix).toBe('validation')
  })
})

describe('configure', () => {
  afterEach(() => {
    resetConfig()
  })

  it('merges into existing config', () => {
    setup({ rules: { email: { blockPlusAlias: true } } })
    configure({ rules: { email: { normalize: true } } })
    const config = getConfig()
    expect(config.rules?.email?.blockPlusAlias).toBe(true)
    expect(config.rules?.email?.normalize).toBe(true)
  })

  it('works without prior setup', () => {
    configure({ rules: { email: { blockPlusAlias: true } } })
    expect(getConfig().rules?.email?.blockPlusAlias).toBe(true)
  })

  it('changes reflected in getConfig', () => {
    configure({ i18n: { enabled: true, prefix: 'v' } })
    const config = getConfig()
    expect(config.i18n.enabled).toBe(true)
    expect(config.i18n.prefix).toBe('v')
  })
})
