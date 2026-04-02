// ==============================================================================
// NUXT COMPOSABLES — UNIT TESTS
// Tests the useValidation composable API surface directly.
// ==============================================================================

import { resetConfig } from '@validex/core'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { useValidation } from '../src/composables'

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
})

describe('useValidation — API surface', () => {
  afterEach(() => resetConfig())

  it('returns validate function', () => {
    const v = useValidation(userSchema)
    expect(typeof v.validate).toBe('function')
  })

  it('returns clearErrors function', () => {
    const v = useValidation(userSchema)
    expect(typeof v.clearErrors).toBe('function')
  })

  it('returns getErrors getter', () => {
    const v = useValidation(userSchema)
    expect(typeof v.getErrors).toBe('function')
    expect(v.getErrors()).toEqual({})
  })

  it('returns getFirstErrors getter', () => {
    const v = useValidation(userSchema)
    expect(typeof v.getFirstErrors).toBe('function')
    expect(v.getFirstErrors()).toEqual({})
  })

  it('returns getIsValid getter', () => {
    const v = useValidation(userSchema)
    expect(typeof v.getIsValid).toBe('function')
    expect(v.getIsValid()).toBe(true)
  })

  it('returns getData getter', () => {
    const v = useValidation(userSchema)
    expect(typeof v.getData).toBe('function')
    expect(v.getData()).toBeUndefined()
  })
})

describe('useValidation — validation flow', () => {
  afterEach(() => resetConfig())

  it('validates valid data successfully', async () => {
    const v = useValidation(userSchema)
    const result = await v.validate({ name: 'Alice', email: 'a@b.com' })
    expect(result.success).toBe(true)
    expect(v.getIsValid()).toBe(true)
    expect(v.getData()).toEqual({ name: 'Alice', email: 'a@b.com' })
  })

  it('populates errors for invalid data', async () => {
    const v = useValidation(userSchema)
    await v.validate({ name: '', email: 'bad' })
    expect(v.getIsValid()).toBe(false)
    expect(Object.keys(v.getErrors()).length).toBeGreaterThan(0)
  })

  it('populates firstErrors with one message per field', async () => {
    const v = useValidation(userSchema)
    await v.validate({ name: '', email: 'bad' })
    const fe = v.getFirstErrors()
    expect(typeof fe['name']).toBe('string')
    expect(typeof fe['email']).toBe('string')
  })

  it('clears errors and resets state', async () => {
    const v = useValidation(userSchema)
    await v.validate({ name: '', email: '' })
    expect(v.getIsValid()).toBe(false)
    v.clearErrors()
    expect(v.getIsValid()).toBe(true)
    expect(v.getErrors()).toEqual({})
    expect(v.getData()).toBeUndefined()
  })

  it('updates state on re-validation', async () => {
    const v = useValidation(userSchema)
    await v.validate({ name: '', email: '' })
    expect(v.getIsValid()).toBe(false)

    await v.validate({ name: 'Bob', email: 'bob@test.com' })
    expect(v.getIsValid()).toBe(true)
    expect(v.getErrors()).toEqual({})
  })

  it('returns ValidationResult from validate()', async () => {
    const v = useValidation(userSchema)
    const result = await v.validate({ name: '', email: '' })
    expect(result.success).toBe(false)
    expect(result.errors).toBeDefined()
    expect(result.firstErrors).toBeDefined()
    expect(result.nestedErrors).toBeDefined()
    expect(result.issues).toBeDefined()
  })

  it('getters return fresh state after each validation', async () => {
    const v = useValidation(userSchema)

    await v.validate({ name: '', email: '' })
    const errors1 = v.getErrors()
    expect(Object.keys(errors1).length).toBeGreaterThan(0)

    await v.validate({ name: 'Alice', email: 'a@b.com' })
    const errors2 = v.getErrors()
    expect(Object.keys(errors2).length).toBe(0)

    // errors1 still has old values (not mutated)
    expect(Object.keys(errors1).length).toBeGreaterThan(0)
  })

  it('works with simple string schema', async () => {
    const v = useValidation(z.string().min(3))
    const result = await v.validate('hi')
    expect(result.success).toBe(false)
  })
})
