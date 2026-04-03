// ==============================================================================
// README EXAMPLES — NUXT ADAPTER VERIFICATION TESTS
// Ensures Nuxt adapter code examples in README.md use the real validex API.
// ==============================================================================

import { Email, Password, resetConfig } from '@validex/core'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { setupValidex, useValidation } from '../../src'

// ----------------------------------------------------------
// NUXT ADAPTER EXAMPLES
// ----------------------------------------------------------

describe('rEADME — Nuxt adapter', () => {
  it('setupValidex() configures global defaults', async () => {
    resetConfig()
    await setupValidex({
      rules: {
        email: { blockPlusAlias: true },
      },
    })

    const schema = Email() as z.ZodType
    const result = await schema.safeParseAsync('user+tag@example.com')
    expect(result.success).toBe(false)

    resetConfig()
  })

  it('useValidation() returns expected interface', async () => {
    resetConfig()
    const schema = z.object({
      email: Email() as z.ZodType,
      password: Password() as z.ZodType,
    })

    const v = useValidation(schema)

    expect(typeof v.validate).toBe('function')
    expect(typeof v.clearErrors).toBe('function')
    expect(typeof v.getErrors).toBe('function')
    expect(typeof v.getFirstErrors).toBe('function')
    expect(typeof v.getIsValid).toBe('function')

    const result = await v.validate({
      email: 'user@example.com',
      password: 'Str0ng!Pass',
    })
    expect(result.success).toBe(true)
    expect(v.getIsValid()).toBe(true)
    expect(v.getErrors()).toEqual({})

    resetConfig()
  })

  it('useValidation() tracks errors after failed validation', async () => {
    resetConfig()
    const schema = z.object({
      email: Email() as z.ZodType,
    })

    const v = useValidation(schema)
    await v.validate({ email: 'not-valid' })

    expect(v.getIsValid()).toBe(false)
    const errors = v.getErrors()
    expect(Object.keys(errors).length).toBeGreaterThan(0)
    const firstErrors = v.getFirstErrors()
    expect(Object.keys(firstErrors).length).toBeGreaterThan(0)

    v.clearErrors()
    expect(v.getIsValid()).toBe(true)
    expect(v.getErrors()).toEqual({})

    resetConfig()
  })
})

// ----------------------------------------------------------
// SUBPATH EXPORTS — NUXT
// ----------------------------------------------------------

describe('rEADME — Subpath exports (nuxt)', () => {
  it('@validex/nuxt exports work', async () => {
    const { useValidation: uv, setupValidex: sv } = await import('../../src')
    expect(typeof uv).toBe('function')
    expect(typeof sv).toBe('function')
  })
})
