import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { resetConfig, setup } from '../../src/config'
import { registerCustomError } from '../../src/core/customError'
import { validate } from '../../src/core/validate'

describe('validate', () => {
  afterEach(() => {
    resetConfig()
  })

  it('should return success for valid data', async () => {
    const schema = z.object({ name: z.string() })
    const result = await validate(schema, { name: 'Alice' })
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ name: 'Alice' })
    expect(result.errors).toEqual({})
    expect(result.firstErrors).toEqual({})
  })

  it('should return errors for invalid data', async () => {
    const schema = z.object({
      email: z.string().min(1),
      password: z.string().min(8),
    })
    const result = await validate(schema, { email: '', password: 'short' })
    expect(result.success).toBe(false)
    expect(result.data).toBeUndefined()
    expect(Object.keys(result.errors).length).toBeGreaterThan(0)
  })

  it('should populate firstErrors with one message per field', async () => {
    const schema = z.object({
      name: z.string().min(2).max(3),
    })
    const result = await validate(schema, { name: '' })
    expect(result.success).toBe(false)
    expect(typeof result.firstErrors['name']).toBe('string')
  })

  it('should build dot-path keys for nested schemas', async () => {
    const schema = z.object({
      billing: z.object({
        email: z.string().min(1),
      }),
    })
    const result = await validate(schema, { billing: { email: '' } })
    expect(result.success).toBe(false)
    expect(result.errors['billing.email']).toBeDefined()
  })

  it('should build nested error objects', async () => {
    const schema = z.object({
      billing: z.object({
        email: z.string().min(1),
      }),
    })
    const result = await validate(schema, { billing: { email: '' } })
    expect(result.success).toBe(false)
    const billingErrors = result.nestedErrors['billing']
    expect(billingErrors).toBeDefined()
    if (typeof billingErrors === 'object' && !Array.isArray(billingErrors) && 'email' in billingErrors) {
      expect(billingErrors['email']).toBeDefined()
    }
  })

  it('should include raw issues', async () => {
    const schema = z.string().min(1)
    const result = await validate(schema, '')
    expect(result.success).toBe(false)
    expect(result.issues.length).toBeGreaterThan(0)
  })

  it('should work with custom error handler', async () => {
    setup()
    registerCustomError()
    const schema = z.object({
      email: z.string().min(1),
    })
    const result = await validate(schema, { email: '' })
    expect(result.success).toBe(false)
    const emailError = result.firstErrors['email']
    expect(emailError).toBeDefined()
  })
})

describe('validate — edge cases', () => {
  afterEach(() => {
    resetConfig()
  })

  it('handles null input for object schema gracefully', async () => {
    const schema = z.object({ name: z.string() })
    const result = await validate(schema, null)
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
    expect(Object.keys(result.errors).length).toBeGreaterThan(0)
  })

  it('handles string input for object schema gracefully', async () => {
    const schema = z.object({ name: z.string() })
    const result = await validate(schema, 'not an object')
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })

  it('handles undefined input for object schema gracefully', async () => {
    const schema = z.object({ name: z.string() })
    const result = await validate(schema, undefined)
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })

  it('handles numeric input for object schema gracefully', async () => {
    const schema = z.object({ name: z.string() })
    const result = await validate(schema, 42)
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
  })
})
