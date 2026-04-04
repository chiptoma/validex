// ==============================================================================
// README EXAMPLES — NUXT ADAPTER VERIFICATION TESTS
// Ensures Nuxt adapter code examples in README.md use the real validex API.
// ==============================================================================

import { Email, Password, resetConfig } from '@validex/core'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { setupValidex, useValidation } from '../../src'

afterEach(() => resetConfig())

// ----------------------------------------------------------
// NUXT ADAPTER EXAMPLES
// ----------------------------------------------------------

describe('readme examples — Nuxt adapter', () => {
  it('setupValidex() configures global defaults', async () => {
    await setupValidex({ rules: { email: { blockPlusAlias: true } } })

    const schema = Email() as z.ZodType
    const result = await schema.safeParseAsync('user+tag@example.com')
    expect(result.success).toBe(false)
  })

  it('useValidation() validates and tracks errors', async () => {
    const schema = z.object({
      email: Email() as z.ZodType,
      password: Password() as z.ZodType,
    })

    const v = useValidation(schema)
    const result = await v.validate({ email: 'user@example.com', password: 'Str0ng!Pass' })
    expect(result.success).toBe(true)
    expect(v.isValid.value).toBe(true)
    expect(v.errors.value).toEqual({})
  })

  it('useValidation() populates errors and clears them', async () => {
    const v = useValidation(z.object({ email: Email() as z.ZodType }))
    await v.validate({ email: 'not-valid' })

    expect(v.isValid.value).toBe(false)
    expect(Object.keys(v.errors.value).length).toBeGreaterThan(0)

    v.clearErrors()
    expect(v.isValid.value).toBe(true)
    expect(v.errors.value).toEqual({})
  })
})

// ----------------------------------------------------------
// SUBPATH EXPORTS
// ----------------------------------------------------------

describe('readme examples — subpath exports (nuxt)', () => {
  it('@validex/nuxt exports useValidation and setupValidex', async () => {
    const { useValidation: uv, setupValidex: sv } = await import('../../src')
    expect(typeof uv).toBe('function')
    expect(typeof sv).toBe('function')
  })
})
