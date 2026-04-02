// ==============================================================================
// NUXT END-TO-END INTEGRATION TESTS
// Validates Nuxt useValidation composable in realistic multi-step workflows.
// ==============================================================================

import { resetConfig } from '@validex/core'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { useValidation } from '../src'

// ----------------------------------------------------------
// NUXT END-TO-END
// ----------------------------------------------------------

describe('nuxt end-to-end', () => {
  afterEach(() => {
    resetConfig()
  })

  const userSchema = z.object({
    email: z.string().email(),
    name: z.string().min(2).max(50),
  })

  it('validates valid data with isValid true and no errors', async () => {
    const v = useValidation(userSchema)
    const result = await v.validate({ email: 'alice@example.com', name: 'Alice' })

    expect(result.success).toBe(true)
    expect(v.getIsValid()).toBe(true)
    expect(v.getErrors()).toEqual({})
    expect(v.getFirstErrors()).toEqual({})
    expect(v.getData()).toEqual({ email: 'alice@example.com', name: 'Alice' })
  })

  it('populates errors for invalid data', async () => {
    const v = useValidation(userSchema)
    const result = await v.validate({ email: 'not-email', name: '' })

    expect(result.success).toBe(false)
    expect(v.getIsValid()).toBe(false)

    const errors = v.getErrors()
    expect(errors['email']).toBeDefined()
    expect(Array.isArray(errors['email'])).toBe(true)
    expect((errors['email'] as readonly string[]).length).toBeGreaterThan(0)
    expect(errors['name']).toBeDefined()
  })

  it('clears errors and restores state', async () => {
    const v = useValidation(userSchema)
    await v.validate({ email: 'bad', name: '' })

    expect(v.getIsValid()).toBe(false)
    expect(Object.keys(v.getErrors()).length).toBeGreaterThan(0)

    v.clearErrors()

    expect(v.getIsValid()).toBe(true)
    expect(v.getErrors()).toEqual({})
    expect(v.getFirstErrors()).toEqual({})
    expect(v.getData()).toBeUndefined()
  })

  it('updates errors on subsequent validation after clearErrors', async () => {
    const v = useValidation(userSchema)

    await v.validate({ email: 'bad', name: '' })
    expect(v.getErrors()['email']).toBeDefined()
    expect(v.getErrors()['name']).toBeDefined()

    v.clearErrors()

    await v.validate({ email: 'valid@test.com', name: '' })
    expect(v.getErrors()['email']).toBeUndefined()
    expect(v.getErrors()['name']).toBeDefined()
    expect(v.getIsValid()).toBe(false)
  })

  it('transitions from invalid to valid across multiple validations', async () => {
    const v = useValidation(userSchema)

    await v.validate({ email: '', name: '' })
    expect(v.getIsValid()).toBe(false)

    await v.validate({ email: 'ok@test.com', name: 'Bob' })
    expect(v.getIsValid()).toBe(true)
    expect(v.getErrors()).toEqual({})
    expect(v.getData()).toEqual({ email: 'ok@test.com', name: 'Bob' })
  })
})
