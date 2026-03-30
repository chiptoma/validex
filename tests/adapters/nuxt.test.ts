import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  createNuxtModule,
  detectNuxtI18n,
  setupValidex,
  useValidation,
} from '../../src/adapters/nuxt'
import { getConfig, resetConfig } from '../../src/config'

describe('nuxt adapter', () => {
  afterEach(() => {
    resetConfig()
  })

  // --------------------------------------------------------
  // MODULE SETUP
  // --------------------------------------------------------

  describe('setupValidex', () => {
    it('should apply rule defaults to global config', async () => {
      await setupValidex({
        rules: { Email: { blockDisposable: true } },
      })

      const config = getConfig()
      expect(config.rules?.['Email']?.['blockDisposable']).toBe(true)
    })

    it('should apply i18n config to global config', async () => {
      await setupValidex({
        i18n: { enabled: true, prefix: 'v', separator: ':' },
      })

      const config = getConfig()
      expect(config.i18n.enabled).toBe(true)
      expect(config.i18n.prefix).toBe('v')
      expect(config.i18n.separator).toBe(':')
    })

    it('should default i18n.enabled to false when not specified', async () => {
      await setupValidex({ i18n: { prefix: 'custom' } })

      const config = getConfig()
      expect(config.i18n.enabled).toBe(false)
      expect(config.i18n.prefix).toBe('custom')
    })

    it('should apply empty options without error', async () => {
      await setupValidex()
      const config = getConfig()
      expect(config.i18n.enabled).toBe(false)
    })

    it('should handle preload option without error', async () => {
      await setupValidex({ preload: { disposable: true } })
      const config = getConfig()
      expect(config.i18n.enabled).toBe(false)
    })
  })

  // --------------------------------------------------------
  // CREATE NUXT MODULE
  // --------------------------------------------------------

  describe('createNuxtModule', () => {
    it('should return a valid module definition', () => {
      const mod = createNuxtModule()

      expect(mod.meta.name).toBe('validex')
      expect(mod.meta.configKey).toBe('validex')
      expect(mod.meta.compatibility.nuxt).toBe('>=3.0.0')
    })

    it('should have empty defaults', () => {
      const mod = createNuxtModule()
      expect(mod.defaults).toEqual({})
    })

    it('should expose a setup function', () => {
      const mod = createNuxtModule()
      expect(typeof mod.setup).toBe('function')
    })

    it('should apply config when setup is called', async () => {
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

  // --------------------------------------------------------
  // DETECT NUXT I18N
  // --------------------------------------------------------

  describe('detectNuxtI18n', () => {
    it('should detect @nuxtjs/i18n', () => {
      expect(detectNuxtI18n(['@nuxtjs/i18n', '@pinia/nuxt'])).toBe(true)
    })

    it('should detect nuxt-i18n legacy name', () => {
      expect(detectNuxtI18n(['nuxt-i18n'])).toBe(true)
    })

    it('should return false when i18n is absent', () => {
      expect(detectNuxtI18n(['@pinia/nuxt', '@nuxt/devtools'])).toBe(false)
    })

    it('should return false for empty module list', () => {
      expect(detectNuxtI18n([])).toBe(false)
    })
  })

  // --------------------------------------------------------
  // USE VALIDATION
  // --------------------------------------------------------

  describe('useValidation', () => {
    const userSchema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
    })

    it('should return the correct interface', () => {
      const v = useValidation(userSchema)

      expect(typeof v.validate).toBe('function')
      expect(typeof v.clearErrors).toBe('function')
      expect(typeof v.getErrors).toBe('function')
      expect(typeof v.getFirstErrors).toBe('function')
      expect(typeof v.getIsValid).toBe('function')
      expect(typeof v.getData).toBe('function')
    })

    it('should start with clean state', () => {
      const v = useValidation(userSchema)

      expect(v.getErrors()).toEqual({})
      expect(v.getFirstErrors()).toEqual({})
      expect(v.getIsValid()).toBe(true)
      expect(v.getData()).toBeUndefined()
    })

    it('should return success for valid data', async () => {
      const v = useValidation(userSchema)
      const result = await v.validate({ name: 'Alice', email: 'a@b.com' })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ name: 'Alice', email: 'a@b.com' })
      expect(v.getIsValid()).toBe(true)
      expect(v.getErrors()).toEqual({})
      expect(v.getData()).toEqual({ name: 'Alice', email: 'a@b.com' })
    })

    it('should populate errors after failed validation', async () => {
      const v = useValidation(userSchema)
      const result = await v.validate({ name: '', email: 'invalid' })

      expect(result.success).toBe(false)
      expect(v.getIsValid()).toBe(false)

      const errors = v.getErrors()
      expect(Object.keys(errors).length).toBeGreaterThan(0)
      expect(errors['name']).toBeDefined()
      expect(errors['email']).toBeDefined()
    })

    it('should populate firstErrors after failed validation', async () => {
      const v = useValidation(userSchema)
      await v.validate({ name: '', email: 'bad' })

      const firstErrors = v.getFirstErrors()
      expect(typeof firstErrors['name']).toBe('string')
      expect(typeof firstErrors['email']).toBe('string')
    })

    it('should clear errors and restore state', async () => {
      const v = useValidation(userSchema)
      await v.validate({ name: '', email: 'bad' })

      expect(v.getIsValid()).toBe(false)

      v.clearErrors()

      expect(v.getErrors()).toEqual({})
      expect(v.getFirstErrors()).toEqual({})
      expect(v.getIsValid()).toBe(true)
      expect(v.getData()).toBeUndefined()
    })

    it('should update errors on subsequent validations', async () => {
      const v = useValidation(userSchema)

      await v.validate({ name: '', email: 'bad' })
      expect(v.getErrors()['name']).toBeDefined()
      expect(v.getErrors()['email']).toBeDefined()

      await v.validate({ name: 'Alice', email: 'bad' })
      expect(v.getErrors()['name']).toBeUndefined()
      expect(v.getErrors()['email']).toBeDefined()
    })

    it('should transition from invalid to valid on re-validation', async () => {
      const v = useValidation(userSchema)

      await v.validate({ name: '', email: '' })
      expect(v.getIsValid()).toBe(false)

      await v.validate({ name: 'Bob', email: 'bob@test.com' })
      expect(v.getIsValid()).toBe(true)
      expect(v.getErrors()).toEqual({})
      expect(v.getData()).toEqual({ name: 'Bob', email: 'bob@test.com' })
    })
  })
})
