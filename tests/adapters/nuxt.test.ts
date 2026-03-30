// ==============================================================================
// NUXT ADAPTER TESTS
// Validates module setup, i18n detection, composable behavior, and Vue
// reactivity integration without requiring a full Nuxt runtime.
// ==============================================================================

import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  createNuxtModule,
  detectNuxtI18n,
  setupValidex,
  useValidation,
} from '../../src/adapters/nuxt'
import { getConfig, resetConfig } from '../../src/config'
import { email } from '../../src/rules/email'
import { PersonName } from '../../src/rules/personName'

// ----------------------------------------------------------
// MODULE REGISTRATION
// ----------------------------------------------------------

describe('nuxt adapter — module registration', () => {
  afterEach(() => resetConfig())

  it('module registers without errors via setupValidex', async () => {
    await expect(setupValidex()).resolves.not.toThrow()
  })

  it('module applies rules config to global config', async () => {
    await setupValidex({ rules: { email: { blockPlusAlias: true } } })
    const config = getConfig()
    expect(config.rules?.['email']?.['blockPlusAlias']).toBe(true)
  })

  it('module applies i18n config', async () => {
    await setupValidex({ i18n: { enabled: true, prefix: 'v' } })
    const config = getConfig()
    expect(config.i18n.enabled).toBe(true)
    expect(config.i18n.prefix).toBe('v')
  })

  it('module applies i18n separator', async () => {
    await setupValidex({ i18n: { enabled: true, prefix: 'v', separator: ':' } })
    const config = getConfig()
    expect(config.i18n.separator).toBe(':')
  })

  it('defaults i18n.enabled to false when not specified', async () => {
    await setupValidex({ i18n: { prefix: 'custom' } })
    const config = getConfig()
    expect(config.i18n.enabled).toBe(false)
    expect(config.i18n.prefix).toBe('custom')
  })

  it('applies empty options without error', async () => {
    await setupValidex()
    const config = getConfig()
    expect(config.i18n.enabled).toBe(false)
  })

  it('handles preload option without error', async () => {
    await setupValidex({ preload: { disposable: true } })
    const config = getConfig()
    expect(config.i18n.enabled).toBe(false)
  })

  it('createNuxtModule returns valid module definition', () => {
    const mod = createNuxtModule()
    expect(mod.meta.name).toBe('validex')
    expect(mod.meta.configKey).toBe('validex')
    expect(mod.meta.compatibility.nuxt).toBe('>=3.0.0')
  })

  it('createNuxtModule has empty defaults', () => {
    const mod = createNuxtModule()
    expect(mod.defaults).toEqual({})
  })

  it('createNuxtModule setup applies config', async () => {
    const mod = createNuxtModule()
    await mod.setup({ rules: { Password: { uppercase: { min: 2 } } } })

    const config = getConfig()
    const pwRules = config.rules?.['Password']
    const uppercase = pwRules?.['uppercase'] as
      | Record<string, unknown>
      | undefined
    expect(uppercase?.['min']).toBe(2)
  })
})

// ----------------------------------------------------------
// I18N DETECTION
// ----------------------------------------------------------

describe('nuxt adapter — i18n detection', () => {
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

  it('handles empty module list', () => {
    expect(detectNuxtI18n([])).toBe(false)
  })
})

// ----------------------------------------------------------
// USE VALIDATION — CORE
// ----------------------------------------------------------

describe('nuxt adapter — useValidation core', () => {
  afterEach(() => resetConfig())

  const userSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
  })

  it('returns all expected interface members', () => {
    const v = useValidation(userSchema)
    expect(typeof v.validate).toBe('function')
    expect(typeof v.clearErrors).toBe('function')
    expect(typeof v.getErrors).toBe('function')
    expect(typeof v.getFirstErrors).toBe('function')
    expect(typeof v.getIsValid).toBe('function')
    expect(typeof v.getData).toBe('function')
  })

  it('starts with clean state', () => {
    const v = useValidation(userSchema)
    expect(v.getErrors()).toEqual({})
    expect(v.getFirstErrors()).toEqual({})
    expect(v.getIsValid()).toBe(true)
    expect(v.getData()).toBeUndefined()
  })

  it('returns success for valid data', async () => {
    const v = useValidation(userSchema)
    const result = await v.validate({ name: 'Alice', email: 'a@b.com' })
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ name: 'Alice', email: 'a@b.com' })
    expect(v.getIsValid()).toBe(true)
    expect(v.getErrors()).toEqual({})
    expect(v.getData()).toEqual({ name: 'Alice', email: 'a@b.com' })
  })

  it('populates errors after failed validation', async () => {
    const v = useValidation(userSchema)
    const result = await v.validate({ name: '', email: 'invalid' })
    expect(result.success).toBe(false)
    expect(v.getIsValid()).toBe(false)
    const errors = v.getErrors()
    expect(Object.keys(errors).length).toBeGreaterThan(0)
    expect(errors['name']).toBeDefined()
    expect(errors['email']).toBeDefined()
  })

  it('populates firstErrors after failed validation', async () => {
    const v = useValidation(userSchema)
    await v.validate({ name: '', email: 'bad' })
    const firstErrors = v.getFirstErrors()
    expect(typeof firstErrors['name']).toBe('string')
    expect(typeof firstErrors['email']).toBe('string')
  })

  it('clears errors and restores state', async () => {
    const v = useValidation(userSchema)
    await v.validate({ name: '', email: 'bad' })
    expect(v.getIsValid()).toBe(false)

    v.clearErrors()
    expect(v.getErrors()).toEqual({})
    expect(v.getFirstErrors()).toEqual({})
    expect(v.getIsValid()).toBe(true)
    expect(v.getData()).toBeUndefined()
  })

  it('updates errors on subsequent validations', async () => {
    const v = useValidation(userSchema)
    await v.validate({ name: '', email: 'bad' })
    expect(v.getErrors()['name']).toBeDefined()
    expect(v.getErrors()['email']).toBeDefined()

    await v.validate({ name: 'Alice', email: 'bad' })
    expect(v.getErrors()['name']).toBeUndefined()
    expect(v.getErrors()['email']).toBeDefined()
  })

  it('transitions from invalid to valid on re-validation', async () => {
    const v = useValidation(userSchema)
    await v.validate({ name: '', email: '' })
    expect(v.getIsValid()).toBe(false)

    await v.validate({ name: 'Bob', email: 'bob@test.com' })
    expect(v.getIsValid()).toBe(true)
    expect(v.getErrors()).toEqual({})
    expect(v.getData()).toEqual({ name: 'Bob', email: 'bob@test.com' })
  })
})

// ----------------------------------------------------------
// USE VALIDATION — VALIDEX RULES
// ----------------------------------------------------------

describe('nuxt adapter — useValidation with validex rules', () => {
  afterEach(() => resetConfig())

  it('validates with validex email and PersonName rules — valid', async () => {
    const schema = z.object({
      name: PersonName() as z.ZodType,
      email: email() as z.ZodType,
    })
    const v = useValidation(schema)
    const result = await v.validate({
      name: 'Alice Smith',
      email: 'alice@example.com',
    })
    expect(result.success).toBe(true)
    expect(v.getIsValid()).toBe(true)
    expect(Object.keys(v.getErrors())).toHaveLength(0)
  })

  it('validates with validex email and PersonName rules — invalid', async () => {
    const schema = z.object({
      name: PersonName() as z.ZodType,
      email: email() as z.ZodType,
    })
    const v = useValidation(schema)
    const result = await v.validate({ name: '', email: '' })
    expect(result.success).toBe(false)
    expect(v.getIsValid()).toBe(false)
    expect(Object.keys(v.getErrors()).length).toBeGreaterThan(0)
  })

  it('firstErrors has one message per field', async () => {
    const schema = z.object({
      email: email() as z.ZodType,
    })
    const v = useValidation(schema)
    await v.validate({ email: '' })
    const firstErrors = v.getFirstErrors()
    expect(typeof firstErrors['email']).toBe('string')
  })
})

// ----------------------------------------------------------
// USE VALIDATION — REACTIVE WRAPPER PATTERN
// Verifies the getter-based API contract that enables Vue
// reactivity wrapping (ref/reactive) in real Nuxt components.
// Vue itself is not importable under strict pnpm since it is
// a transitive dep of nuxt, not a direct devDependency.
// ----------------------------------------------------------

describe('nuxt adapter — useValidation reactive wrapper pattern', () => {
  afterEach(() => resetConfig())

  it('getters reflect state changes after validation — invalid', async () => {
    const schema = z.object({ email: email() as z.ZodType })
    const v = useValidation(schema)

    // Simulate wrapping: snapshot state via getters (as a Vue ref would)
    let isValid = v.getIsValid()
    let errors = { ...v.getErrors() }

    await v.validate({ email: '' })

    // Re-read from getters (as a Vue watchEffect/computed would)
    isValid = v.getIsValid()
    errors = { ...v.getErrors() }

    expect(isValid).toBe(false)
    expect(Object.keys(errors).length).toBeGreaterThan(0)
  })

  it('getters reflect valid transition', async () => {
    const schema = z.object({ email: email() as z.ZodType })
    const v = useValidation(schema)

    await v.validate({ email: '' })
    expect(v.getIsValid()).toBe(false)

    await v.validate({ email: 'test@example.com' })
    expect(v.getIsValid()).toBe(true)
  })

  it('error getters update correctly across re-validations', async () => {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
    })
    const v = useValidation(schema)

    // First: both fields fail
    await v.validate({ name: '', email: 'bad' })
    let errors = { ...v.getErrors() }
    expect(errors['name']).toBeDefined()
    expect(errors['email']).toBeDefined()

    // Second: only email fails
    await v.validate({ name: 'Alice', email: 'bad' })
    errors = { ...v.getErrors() }
    expect(errors['name']).toBeUndefined()
    expect(errors['email']).toBeDefined()

    // Third: all valid
    await v.validate({ name: 'Alice', email: 'alice@test.com' })
    errors = { ...v.getErrors() }
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('getters always return fresh state (no stale closures)', async () => {
    const schema = z.object({ email: email() as z.ZodType })
    const v = useValidation(schema)

    // Capture getter references once (as a component setup would)
    const { getIsValid, getErrors, getFirstErrors } = v

    await v.validate({ email: '' })
    expect(getIsValid()).toBe(false)
    expect(Object.keys(getErrors()).length).toBeGreaterThan(0)
    expect(typeof getFirstErrors()['email']).toBe('string')

    await v.validate({ email: 'test@example.com' })
    expect(getIsValid()).toBe(true)
    expect(Object.keys(getErrors())).toHaveLength(0)
  })
})

// ----------------------------------------------------------
// SSR SIMULATION
// ----------------------------------------------------------

describe('nuxt adapter — SSR simulation', () => {
  afterEach(() => resetConfig())

  it('setupValidex with preload resolves without error', async () => {
    await expect(setupValidex({
      preload: { countryCodes: true, currencyCodes: true },
    })).resolves.not.toThrow()
  })

  it('config is available after server-side setup', async () => {
    await setupValidex({
      rules: { email: { blockPlusAlias: true } },
    })
    const config = getConfig()
    expect(config.rules?.['email']?.['blockPlusAlias']).toBe(true)
  })
})
