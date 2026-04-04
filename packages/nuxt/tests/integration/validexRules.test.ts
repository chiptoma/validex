// ==============================================================================
// NUXT ADAPTER — VALIDEX RULES INTEGRATION TESTS
// Verifies that validex rules produce correct errors and validex-owned messages
// when used through the nuxt composable layer.
// ==============================================================================

import { Email, getParams, Password, PersonName, Phone, resetConfig } from '@validex/core'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { useValidation } from '../../src/composables'

describe('validex rules through nuxt composable', () => {
  afterEach(() => resetConfig())

  it('email rule with blockDisposable rejects disposable domains', async () => {
    const schema = z.object({ email: Email({ blockDisposable: true }) as z.ZodType })
    const v = useValidation(schema)
    const result = await v.validate({ email: 'test@mailinator.com' })
    expect(result.success).toBe(false)
    expect(v.errors.value['email']).toBeDefined()
  })

  it('email rule with blockPlusAlias rejects plus aliases', async () => {
    const schema = z.object({ email: Email({ blockPlusAlias: true }) as z.ZodType })
    const v = useValidation(schema)
    const result = await v.validate({ email: 'user+alias@example.com' })
    expect(result.success).toBe(false)
    expect(v.errors.value['email']).toBeDefined()
  })

  it('password rule enforces uppercase and digit requirements', async () => {
    const schema = z.object({
      password: Password({ uppercase: { min: 1 }, digits: { min: 1 } }) as z.ZodType,
    })
    const v = useValidation(schema)

    const weak = await v.validate({ password: 'alllowercase' })
    expect(weak.success).toBe(false)

    const strong = await v.validate({ password: 'StrongPass1!' })
    expect(strong.success).toBe(true)
  })

  it('combined Email + PersonName + Phone rules validate independently', async () => {
    const schema = z.object({
      email: Email() as z.ZodType,
      name: PersonName() as z.ZodType,
      phone: Phone() as z.ZodType,
    })
    const v = useValidation(schema)

    const result = await v.validate({ email: '', name: '', phone: '' })
    expect(result.success).toBe(false)
    const errorKeys = Object.keys(v.errors.value)
    expect(errorKeys).toContain('email')
    expect(errorKeys).toContain('name')
    expect(errorKeys).toContain('phone')
  })

  it('error messages are validex-owned, not raw Zod messages', async () => {
    const schema = z.object({ email: Email() as z.ZodType })
    const v = useValidation(schema)
    const result = await v.validate({ email: 'bad' })
    expect(result.success).toBe(false)

    const emailErrors = v.errors.value['email'] ?? []
    expect(emailErrors.length).toBeGreaterThan(0)
    for (const msg of emailErrors) {
      expect(msg).not.toBe('Invalid input')
      expect(msg).not.toBe('Expected string')
    }
  })

  it('getParams returns correct namespace and code from composable errors', async () => {
    const schema = z.object({ email: Email() as z.ZodType })
    const v = useValidation(schema)
    const result = await v.validate({ email: 'not-an-email' })
    expect(result.success).toBe(false)

    const issues = result.issues
    expect(issues.length).toBeGreaterThan(0)

    const firstIssue = issues[0]
    expect(firstIssue).toBeDefined()
    // SAFETY: asserted above
    const params = getParams(firstIssue as Parameters<typeof getParams>[0])
    expect(params.namespace).toBe('email')
    expect(params.code).toBe('invalid')
  })

  it('i18n keys follow expected pattern validation.messages.{ns}.{code}', async () => {
    const schema = z.object({ email: Email() as z.ZodType })
    const v = useValidation(schema)
    const result = await v.validate({ email: '' })
    expect(result.success).toBe(false)

    for (const issue of result.issues) {
      // SAFETY: validex issues always carry params; cast from ReadonlyArray<unknown>
      const params = getParams(issue as Parameters<typeof getParams>[0])
      expect(params.namespace).toBeTruthy()
      expect(params.code).toBeTruthy()
      // Verify the key would be: validation.messages.<namespace>.<code>
      const key = `validation.messages.${params.namespace}.${params.code}`
      expect(key).toMatch(/^validation\.messages\.\w+\.\w+$/)
    }
  })
})
