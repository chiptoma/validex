// ==============================================================================
// INTEGRATION — ERROR SYSTEM
// Tests error surface normalization, customFn isolation, regex override
// isolation, ValidationResult shape, and validate() utility behavior.
// ==============================================================================

import type { z } from 'zod'
import { afterEach, describe, expect, it } from 'vitest'
import { z as zod } from 'zod'
import { resetConfig, setup } from '../../src/config'
import { registerCustomError } from '../../src/core/customError'
import { getParams } from '../../src/core/getParams'
import { validate } from '../../src/core/validate'
import { email } from '../../src/rules/email'
import { password } from '../../src/rules/password'
import { PersonName } from '../../src/rules/personName'
import { postalCode } from '../../src/rules/postalCode'
import { Slug } from '../../src/rules/slug'

// ----------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------

const RAW_ZOD_CODES = [
  'too_small',
  'too_big',
  'invalid_type',
  'invalid_format',
  'invalid_string',
]

// ----------------------------------------------------------
// TESTS
// ----------------------------------------------------------

describe('error system integration', () => {
  afterEach(() => {
    resetConfig()
  })

  // ----------------------------------------------------------
  // 6.13 — NO RAW ZOD CODES LEAK
  // ----------------------------------------------------------

  describe('6.13 — no raw Zod codes leak via getParams', () => {
    it('should map all native Zod codes to validex codes', async () => {
      setup()
      registerCustomError()

      const schema = zod.object({
        email: email() as z.ZodType,
        name: PersonName() as z.ZodType,
        password: password() as z.ZodType,
      })

      const result = await validate(schema, {
        email: '',
        name: '',
        password: '',
      })

      expect(result.success).toBe(false)
      expect(result.issues.length).toBeGreaterThan(0)

      for (const issue of result.issues) {
        const params = getParams(issue as Parameters<typeof getParams>[0])
        expect(RAW_ZOD_CODES).not.toContain(params.code)
      }
    })

    it('should map codes correctly for non-empty but invalid values', async () => {
      setup()
      registerCustomError()

      const schema = zod.object({
        email: email() as z.ZodType,
        name: PersonName() as z.ZodType,
        password: password() as z.ZodType,
      })

      const result = await validate(schema, {
        email: 'not-valid',
        name: '!!',
        password: 'weak',
      })

      expect(result.success).toBe(false)
      for (const issue of result.issues) {
        const params = getParams(issue as Parameters<typeof getParams>[0])
        expect(RAW_ZOD_CODES).not.toContain(params.code)
      }
    })
  })

  // ----------------------------------------------------------
  // 6.14 — MULTIPLE CUSTOMFN IN SAME SCHEMA
  // ----------------------------------------------------------

  describe('6.14 — multiple customFn in same schema', () => {
    it('should pass when both customFns are satisfied', async () => {
      setup()
      registerCustomError()

      const schema = zod.object({
        email: email({
          customFn: (v: string) => v.endsWith('.org') || 'Must be .org',
        }) as z.ZodType,
        name: PersonName({
          customFn: (v: string) => v.length > 3 || 'Name too short',
        }) as z.ZodType,
      })

      const result = await validate(schema, {
        email: 'user@example.org',
        name: 'Alice',
      })

      expect(result.success).toBe(true)
    })

    it('should fail only on email customFn when email is .com', async () => {
      setup()
      registerCustomError()

      const schema = zod.object({
        email: email({
          customFn: (v: string) => v.endsWith('.org') || 'Must be .org',
        }) as z.ZodType,
        name: PersonName({
          customFn: (v: string) => v.length > 3 || 'Name too short',
        }) as z.ZodType,
      })

      const result = await validate(schema, {
        email: 'user@example.com',
        name: 'Alice',
      })

      expect(result.success).toBe(false)
      expect(result.errors['email']).toBeDefined()
      expect(result.errors['name']).toBeUndefined()
    })

    it('should fail on both when both customFns fail', async () => {
      setup()
      registerCustomError()

      const schema = zod.object({
        email: email({
          customFn: (v: string) => v.endsWith('.org') || 'Must be .org',
        }) as z.ZodType,
        name: PersonName({
          customFn: (v: string) => v.length > 3 || 'Name too short',
        }) as z.ZodType,
      })

      const result = await validate(schema, {
        email: 'user@example.com',
        name: 'Ana',
      })

      expect(result.success).toBe(false)
      expect(result.errors['email']).toBeDefined()
      expect(result.errors['name']).toBeDefined()
    })
  })

  // ----------------------------------------------------------
  // 6.15 — REGEX OVERRIDE ISOLATION
  // ----------------------------------------------------------

  describe('6.15 — regex override isolation', () => {
    it('should apply custom regex only to the overridden field', async () => {
      setup()
      registerCustomError()

      const schema = zod.object({
        slug1: Slug({ regex: /^[a-z]+$/ }) as z.ZodType,
        slug2: Slug() as z.ZodType,
      })

      // slug1 with letters-only passes custom regex
      const valid = await validate(schema, {
        slug1: 'hello',
        slug2: 'hello-world',
      })
      expect(valid.success).toBe(true)
    })

    it('should reject hyphens on custom regex without affecting default', async () => {
      setup()
      registerCustomError()

      const schema = zod.object({
        slug1: Slug({ regex: /^[a-z]+$/ }) as z.ZodType,
        slug2: Slug() as z.ZodType,
      })

      // slug1 rejects hyphens (custom regex), slug2 allows them (default)
      const result = await validate(schema, {
        slug1: 'hello-world',
        slug2: 'hello-world',
      })

      expect(result.success).toBe(false)
      expect(result.errors['slug1']).toBeDefined()
      expect(result.errors['slug2']).toBeUndefined()
    })
  })

  // ----------------------------------------------------------
  // 6.16 — VALIDATION RESULT SHAPE
  // ----------------------------------------------------------

  describe('6.16 — ValidationResult shape', () => {
    it('should produce correct dot-path keys for nested schemas', async () => {
      setup()
      registerCustomError()

      const schema = zod.object({
        billing: zod.object({
          email: email() as z.ZodType,
          address: zod.object({
            postalCode: postalCode({ country: 'US' }) as z.ZodType,
          }),
        }),
        password: password() as z.ZodType,
      })

      const result = await validate(schema, {
        billing: {
          email: '',
          address: { postalCode: '' },
        },
        password: '',
      })

      expect(result.success).toBe(false)

      // Dot-path keys in errors
      expect(result.errors['billing.email']).toBeDefined()
      expect(result.errors['billing.address.postalCode']).toBeDefined()
      expect(result.errors['password']).toBeDefined()
    })

    it('should produce firstErrors with single string values', async () => {
      setup()
      registerCustomError()

      const schema = zod.object({
        billing: zod.object({
          email: email() as z.ZodType,
        }),
        password: password() as z.ZodType,
      })

      const result = await validate(schema, {
        billing: { email: '' },
        password: '',
      })

      expect(result.success).toBe(false)

      // firstErrors has same keys with single string values
      expect(typeof result.firstErrors['billing.email']).toBe('string')
      expect(typeof result.firstErrors['password']).toBe('string')
    })

    it('should produce nestedErrors matching schema shape', async () => {
      setup()
      registerCustomError()

      const schema = zod.object({
        billing: zod.object({
          email: email() as z.ZodType,
          address: zod.object({
            postalCode: postalCode({ country: 'US' }) as z.ZodType,
          }),
        }),
        password: password() as z.ZodType,
      })

      const result = await validate(schema, {
        billing: {
          email: '',
          address: { postalCode: '' },
        },
        password: '',
      })

      expect(result.success).toBe(false)

      // nestedErrors has nested structure
      const billing = result.nestedErrors['billing']
      expect(billing).toBeDefined()
      expect(typeof billing).toBe('object')

      // billing.email should be an array of strings
      const billingObj = billing as Record<string, unknown>
      expect(Array.isArray(billingObj['email'])).toBe(true)

      // billing.address.postalCode should be an array of strings
      const address = billingObj['address'] as Record<string, unknown>
      expect(address).toBeDefined()
      expect(Array.isArray(address['postalCode'])).toBe(true)

      // password at root should be an array of strings
      expect(Array.isArray(result.nestedErrors['password'])).toBe(true)
    })

    it('should populate issues as an array', async () => {
      setup()
      registerCustomError()

      const schema = zod.object({
        email: email() as z.ZodType,
      })

      const result = await validate(schema, { email: '' })
      expect(result.success).toBe(false)
      expect(Array.isArray(result.issues)).toBe(true)
      expect(result.issues.length).toBeGreaterThan(0)
    })
  })

  // ----------------------------------------------------------
  // 6.17 — VALIDATE() UTILITY
  // ----------------------------------------------------------

  describe('6.17 — validate() utility', () => {
    it('should return success with data for valid input', async () => {
      setup()
      registerCustomError()

      const schema = zod.object({
        email: email() as z.ZodType,
        password: password() as z.ZodType,
      })

      const result = await validate(schema, {
        email: 'user@example.com',
        password: 'MyStr0ng!Pass',
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data).toHaveProperty('email')
      expect(result.data).toHaveProperty('password')
      expect(result.errors).toEqual({})
      expect(result.firstErrors).toEqual({})
      expect(result.issues).toEqual([])
    })

    it('should return failure with errors for invalid input', async () => {
      setup()
      registerCustomError()

      const schema = zod.object({
        email: email() as z.ZodType,
        password: password() as z.ZodType,
      })

      const result = await validate(schema, {
        email: 'invalid',
        password: 'weak',
      })

      expect(result.success).toBe(false)
      expect(result.data).toBeUndefined()
      expect(Object.keys(result.errors).length).toBeGreaterThan(0)
      expect(Object.keys(result.firstErrors).length).toBeGreaterThan(0)
      expect(result.issues.length).toBeGreaterThan(0)
    })
  })
})
