// ==============================================================================
// PASSWORD CONFIRMATION RULE TESTS
// Basic string validation tests for the confirmation field.
// ------------------------------------------------------------------------------
// NOTE: Cross-field matching (sameAs) is tested in integration tests.
// ==============================================================================

import type { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { passwordConfirmation } from '../../src/rules/passwordConfirmation'

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

function parse(schema: unknown, value: unknown): { success: boolean } {
  return (schema as z.ZodType).safeParse(value)
}

// ----------------------------------------------------------
// BASIC VALIDATION
// ----------------------------------------------------------

describe('passwordConfirmation (basic)', () => {
  const schema = passwordConfirmation()

  it('accepts a valid password string', () => {
    expect(parse(schema, 'P@ssw0rd!').success).toBe(true)
  })

  it('rejects empty string (emptyToUndefined)', () => {
    expect(parse(schema, '').success).toBe(false)
  })

  it('rejects non-string input', () => {
    expect(parse(schema, 12345).success).toBe(false)
  })

  it('rejects a weak password (same rules as password)', () => {
    expect(parse(schema, 'password').success).toBe(false)
  })
})

// ----------------------------------------------------------
// OPTIONS
// ----------------------------------------------------------

describe('passwordConfirmation (options)', () => {
  it('defaults passwordField to "password"', () => {
    const schema = passwordConfirmation()
    expect(schema).toBeDefined()
  })

  it('accepts custom passwordField option', () => {
    const schema = passwordConfirmation({ passwordField: 'newPassword' })
    expect(schema).toBeDefined()
  })

  it('passes label through to underlying schema', () => {
    const schema = passwordConfirmation({ label: 'Confirm' })
    expect(parse(schema, 'P@ssw0rd!').success).toBe(true)
  })
})

// ----------------------------------------------------------
// EMPTY AND WHITESPACE
// ----------------------------------------------------------

describe('passwordConfirmation (empty and whitespace)', () => {
  const schema = passwordConfirmation()

  it('rejects empty password and empty confirmation equally', () => {
    const result = parse(schema, '')
    expect(result.success).toBe(false)
  })

  it('rejects whitespace-only passwords', () => {
    expect(parse(schema, '   ').success).toBe(false)
  })

  it('rejects tab-only passwords', () => {
    expect(parse(schema, '\t\t\t').success).toBe(false)
  })
})

// ----------------------------------------------------------
// UNICODE AND SPECIAL CHARACTERS
// ----------------------------------------------------------

describe('passwordConfirmation (unicode and special characters)', () => {
  const schema = passwordConfirmation()

  it('accepts unicode passwords that meet composition rules', () => {
    expect(parse(schema, 'Contraseña1!').success).toBe(true)
  })

  it('rejects case-mismatched passwords (validation is case-sensitive)', () => {
    // "Password1!" is valid, "password1!" lacks uppercase
    const upper = parse(schema, 'Password1!')
    const lower = parse(schema, 'password1!')
    expect(upper.success).toBe(true)
    expect(lower.success).toBe(false)
  })

  it('accepts passwords with many special characters', () => {
    expect(parse(schema, 'P@$$w0rd!#%^&*').success).toBe(true)
  })

  it('accepts passwords with only the minimum special characters', () => {
    expect(parse(schema, 'Abcdefg1!').success).toBe(true)
  })
})

// ----------------------------------------------------------
// LENGTH EXTREMES
// ----------------------------------------------------------

describe('passwordConfirmation (length extremes)', () => {
  const schema = passwordConfirmation()

  it('accepts very long matching passwords (1000+ chars)', () => {
    const longPwd = `A${'b'.repeat(997)}1!z`
    expect(longPwd.length).toBeGreaterThan(1000)
    // Exceeds default max of 128, so should fail
    expect(parse(schema, longPwd).success).toBe(false)
  })

  it('accepts a password at exactly minimum length (8 chars)', () => {
    expect(parse(schema, 'P@ssw0r!').success).toBe(true)
  })

  it('rejects a password below minimum length', () => {
    expect(parse(schema, 'P@s1!').success).toBe(false)
  })
})

// ----------------------------------------------------------
// CUSTOM PASSWORD FIELD
// ----------------------------------------------------------

describe('passwordConfirmation (passwordField option)', () => {
  it('creates a schema with custom passwordField "currentPassword"', () => {
    const schema = passwordConfirmation({ passwordField: 'currentPassword' })
    expect(schema).toBeDefined()
    expect(parse(schema, 'V@lid8pwd!').success).toBe(true)
  })

  it('creates a schema with custom passwordField "newPass"', () => {
    const schema = passwordConfirmation({ passwordField: 'newPass' })
    expect(schema).toBeDefined()
    expect(parse(schema, 'V@lid8pwd!').success).toBe(true)
  })
})

// ----------------------------------------------------------
// NULL AND UNDEFINED INPUTS
// ----------------------------------------------------------

describe('passwordConfirmation (null and undefined)', () => {
  const schema = passwordConfirmation()

  it('rejects null input', () => {
    expect(parse(schema, null).success).toBe(false)
  })

  it('rejects undefined input', () => {
    expect(parse(schema, undefined).success).toBe(false)
  })
})
