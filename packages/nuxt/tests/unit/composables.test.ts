// ==============================================================================
// NUXT COMPOSABLES — UNIT TESTS
// Tests the useValidation composable API surface directly.
// ==============================================================================

import { resetConfig } from '@validex/core'
import { afterEach, describe, expect, it } from 'vitest'
import { isRef } from 'vue'
import { z } from 'zod'

import { useValidation } from '../../src/composables'

/**
 * Is Shallow Ref
 * Checks whether a value is a Vue ShallowRef. Uses isRef + the
 * internal __v_isShallow flag since Vue does not export isShallowRef.
 *
 * @param value - The value to test.
 * @returns True if the value is a ShallowRef.
 */
function isShallowRef(value: unknown): boolean {
  return isRef(value) && (value as unknown as Record<string, unknown>)['__v_isShallow'] === true
}

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

  it('returns errors ref with empty initial state', () => {
    const v = useValidation(userSchema)
    expect(v.errors.value).toEqual({})
  })

  it('returns firstErrors ref with empty initial state', () => {
    const v = useValidation(userSchema)
    expect(v.firstErrors.value).toEqual({})
  })

  it('returns isValid ref with initial true', () => {
    const v = useValidation(userSchema)
    expect(v.isValid.value).toBe(true)
  })

  it('returns data ref with initial undefined', () => {
    const v = useValidation(userSchema)
    expect(v.data.value).toBeUndefined()
  })
})

describe('useValidation — validation flow', () => {
  afterEach(() => resetConfig())

  it('validates valid data successfully', async () => {
    const v = useValidation(userSchema)
    const result = await v.validate({ name: 'Alice', email: 'a@b.com' })
    expect(result.success).toBe(true)
    expect(v.isValid.value).toBe(true)
    expect(v.data.value).toEqual({ name: 'Alice', email: 'a@b.com' })
  })

  it('populates errors for invalid data', async () => {
    const v = useValidation(userSchema)
    await v.validate({ name: '', email: 'bad' })
    expect(v.isValid.value).toBe(false)
    expect(Object.keys(v.errors.value).length).toBeGreaterThan(0)
  })

  it('populates firstErrors with one message per field', async () => {
    const v = useValidation(userSchema)
    await v.validate({ name: '', email: 'bad' })
    const fe = v.firstErrors.value
    expect(typeof fe['name']).toBe('string')
    expect(typeof fe['email']).toBe('string')
  })

  it('clears errors and resets state', async () => {
    const v = useValidation(userSchema)
    await v.validate({ name: '', email: '' })
    expect(v.isValid.value).toBe(false)
    v.clearErrors()
    expect(v.isValid.value).toBe(true)
    expect(v.errors.value).toEqual({})
    expect(v.data.value).toBeUndefined()
  })

  it('updates state on re-validation', async () => {
    const v = useValidation(userSchema)
    await v.validate({ name: '', email: '' })
    expect(v.isValid.value).toBe(false)

    await v.validate({ name: 'Bob', email: 'bob@test.com' })
    expect(v.isValid.value).toBe(true)
    expect(v.errors.value).toEqual({})
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

  it('refs return fresh state after each validation', async () => {
    const v = useValidation(userSchema)

    await v.validate({ name: '', email: '' })
    const errors1 = { ...v.errors.value }
    expect(Object.keys(errors1).length).toBeGreaterThan(0)

    await v.validate({ name: 'Alice', email: 'a@b.com' })
    expect(Object.keys(v.errors.value).length).toBe(0)

    // errors1 snapshot still has old values
    expect(Object.keys(errors1).length).toBeGreaterThan(0)
  })

  it('works with simple string schema', async () => {
    const v = useValidation(z.string().min(3))
    const result = await v.validate('hi')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// EDGE CASES
// ----------------------------------------------------------

describe('useValidation — edge cases', () => {
  afterEach(() => resetConfig())

  it('validates array schema with nested objects', async () => {
    const schema = z.array(z.object({ tag: z.string().min(1) }))
    const v = useValidation(schema)
    const result = await v.validate([{ tag: 'a' }, { tag: 'b' }])
    expect(result.success).toBe(true)
    expect(v.data.value).toEqual([{ tag: 'a' }, { tag: 'b' }])
  })

  it('returns errors for invalid items in array schema', async () => {
    const schema = z.array(z.object({ tag: z.string().min(1) }))
    const v = useValidation(schema)
    const result = await v.validate([{ tag: '' }])
    expect(result.success).toBe(false)
    expect(Object.keys(v.errors.value).length).toBeGreaterThan(0)
  })

  it('validates optional and nullable fields', async () => {
    const schema = z.object({
      name: z.string().optional(),
      bio: z.string().nullable(),
    })
    const v = useValidation(schema)
    const result = await v.validate({ bio: null })
    expect(result.success).toBe(true)
    expect(v.data.value).toEqual({ bio: null })
  })

  it('validates deeply nested schema (3+ levels)', async () => {
    const schema = z.object({
      level1: z.object({
        level2: z.object({
          level3: z.string().min(1),
        }),
      }),
    })
    const v = useValidation(schema)
    const invalid = await v.validate({ level1: { level2: { level3: '' } } })
    expect(invalid.success).toBe(false)

    const valid = await v.validate({ level1: { level2: { level3: 'ok' } } })
    expect(valid.success).toBe(true)
  })

  it('returns errors for empty object when fields are required', async () => {
    const v = useValidation(userSchema)
    const result = await v.validate({})
    expect(result.success).toBe(false)
    expect(Object.keys(v.errors.value).length).toBeGreaterThan(0)
  })

  it('handles null input gracefully', async () => {
    const v = useValidation(userSchema)
    const result = await v.validate(null)
    expect(result.success).toBe(false)
  })

  it('handles undefined input gracefully', async () => {
    const v = useValidation(userSchema)
    const result = await v.validate(undefined)
    expect(result.success).toBe(false)
  })

  it('concurrent validate calls do not corrupt state', async () => {
    const schema = z.object({ n: z.number().min(10) })
    const v = useValidation(schema)

    const [r1, r2] = await Promise.all([
      v.validate({ n: 5 }),
      v.validate({ n: 20 }),
    ])

    // Last to resolve wins — state should reflect one of them
    const valid = v.isValid.value
    expect(typeof valid).toBe('boolean')
    expect(r1.success).toBe(false)
    expect(r2.success).toBe(true)
  })

  it('data ref returns parsed data after transform', async () => {
    const schema = z.object({
      name: z.string().transform(s => s.toUpperCase()),
    })
    const v = useValidation(schema)
    await v.validate({ name: 'alice' })
    expect(v.data.value).toEqual({ name: 'ALICE' })
  })

  it('re-validation after clearErrors preserves fresh state', async () => {
    const v = useValidation(userSchema)
    await v.validate({ name: '', email: '' })
    v.clearErrors()
    expect(v.isValid.value).toBe(true)
    expect(v.data.value).toBeUndefined()

    await v.validate({ name: 'Bob', email: 'bob@test.com' })
    expect(v.isValid.value).toBe(true)
    expect(v.data.value).toEqual({ name: 'Bob', email: 'bob@test.com' })
  })
})

// ----------------------------------------------------------
// REACTIVITY CONTRACT
// ----------------------------------------------------------

describe('useValidation — reactivity contract', () => {
  afterEach(() => resetConfig())

  it('errors is a Vue ShallowRef', () => {
    const { errors } = useValidation(userSchema)
    expect(isShallowRef(errors)).toBe(true)
  })

  it('firstErrors is a Vue ShallowRef', () => {
    const { firstErrors } = useValidation(userSchema)
    expect(isShallowRef(firstErrors)).toBe(true)
  })

  it('isValid is a Vue ShallowRef', () => {
    const { isValid } = useValidation(userSchema)
    expect(isShallowRef(isValid)).toBe(true)
  })

  it('data is a Vue ShallowRef', () => {
    const { data } = useValidation(userSchema)
    expect(isShallowRef(data)).toBe(true)
  })

  it('ref identity is stable after validation (same ref, updated value)', async () => {
    const v = useValidation(userSchema)
    const errorsBefore = v.errors
    const firstErrorsBefore = v.firstErrors
    const isValidBefore = v.isValid
    const dataBefore = v.data

    await v.validate({ name: '', email: 'bad' })

    expect(v.errors).toBe(errorsBefore)
    expect(v.firstErrors).toBe(firstErrorsBefore)
    expect(v.isValid).toBe(isValidBefore)
    expect(v.data).toBe(dataBefore)

    expect(Object.keys(v.errors.value).length).toBeGreaterThan(0)
    expect(v.isValid.value).toBe(false)
  })

  it('ref identity is stable across multiple validations', async () => {
    const v = useValidation(userSchema)
    const errorsBefore = v.errors

    await v.validate({ name: '', email: '' })
    expect(v.errors).toBe(errorsBefore)

    await v.validate({ name: 'Alice', email: 'a@b.com' })
    expect(v.errors).toBe(errorsBefore)

    v.clearErrors()
    expect(v.errors).toBe(errorsBefore)
    expect(v.errors.value).toEqual({})
  })

  it('validate and clearErrors are plain functions (not refs)', () => {
    const { validate, clearErrors } = useValidation(userSchema)
    expect(isShallowRef(validate)).toBe(false)
    expect(isShallowRef(clearErrors)).toBe(false)
    expect(typeof validate).toBe('function')
    expect(typeof clearErrors).toBe('function')
  })
})
