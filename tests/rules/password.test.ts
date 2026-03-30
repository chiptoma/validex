// ==============================================================================
// PASSWORD RULE TESTS
// Validates password composition, length, consecutive, and error code checks.
// ==============================================================================

import type { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { getParams } from '../../src/core/getParams'
import { Password } from '../../src/rules/password'
import { testRuleContract } from '../helpers/testRule'

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

function parse(schema: unknown, value: unknown): { success: boolean } {
  return (schema as z.ZodType).safeParse(value)
}

function getErrorCodes(schema: unknown, value: unknown): ReadonlyArray<string> {
  const result = (schema as z.ZodType).safeParse(value)
  if (result.success)
    return []
  return result.error.issues.map((issue) => {
    const params = getParams(issue as Parameters<typeof getParams>[0])
    return params.code
  })
}

// ----------------------------------------------------------
// CONTRACT
// ----------------------------------------------------------

testRuleContract(
  'password',
  Password as (opts?: Record<string, unknown>) => unknown,
  'password',
)

// ----------------------------------------------------------
// VALID PASSWORDS
// ----------------------------------------------------------

describe('password (valid)', () => {
  const schema = Password()

  it.each([
    'P@ssw0rd!',
    'Str0ng!Pass',
    'MyP@ss123',
    'H3llo!World',
    'S3cure#Key',
    'V@lid1Pass',
    'Test!ng42',
    'G00d$Pass',
    'Br@ve1Fox',
    'W1nter!Is',
    'Cl0ud#9Up',
  ])('accepts valid password: %s', (value) => {
    expect(parse(schema, value).success).toBe(true)
  })
})

// ----------------------------------------------------------
// INVALID PASSWORDS
// ----------------------------------------------------------

describe('password (invalid)', () => {
  const schema = Password()

  it.each([
    ['password', 'no uppercase, digit, or special'],
    ['12345678', 'no letters or special'],
    ['SHORT1!', 'too short (< 8 chars)'],
    ['aaaa', 'too short and consecutive'],
    ['', 'empty string'],
    ['ALLUPPERCASE1!', 'no lowercase'],
    ['alllowercase1!', 'no uppercase'],
    ['NoDigitsHere!', 'no digits'],
    ['N0SpecialChars', 'no special characters'],
  ])('rejects: %s (%s)', (value) => {
    expect(parse(schema, value).success).toBe(false)
  })
})

// ----------------------------------------------------------
// INDIVIDUAL ERROR CODES
// ----------------------------------------------------------

describe('password (error codes)', () => {
  const schema = Password()

  it('reports minUppercase for missing uppercase', () => {
    const codes = getErrorCodes(schema, 'password1!')
    expect(codes).toContain('minUppercase')
  })

  it('reports minLowercase for missing lowercase', () => {
    const codes = getErrorCodes(schema, 'PASSWORD1!')
    expect(codes).toContain('minLowercase')
  })

  it('reports minDigits for missing digits', () => {
    const codes = getErrorCodes(schema, 'Password!!')
    expect(codes).toContain('minDigits')
  })

  it('reports minSpecial for missing special characters', () => {
    const codes = getErrorCodes(schema, 'Password12')
    expect(codes).toContain('minSpecial')
  })

  it('reports multiple missing codes at once', () => {
    const codes = getErrorCodes(schema, 'password')
    expect(codes).toContain('minUppercase')
    expect(codes).toContain('minDigits')
    expect(codes).toContain('minSpecial')
  })
})

// ----------------------------------------------------------
// CONSECUTIVE CHARACTERS
// ----------------------------------------------------------

describe('password (consecutive)', () => {
  it('rejects password with 4 consecutive identical characters', () => {
    const codes = getErrorCodes(Password(), 'Paaaaw0rd!')
    expect(codes).toContain('maxConsecutive')
  })

  it('accepts password with exactly 3 consecutive characters', () => {
    expect(parse(Password(), 'Paaa1!bb').success).toBe(true)
  })

  it('respects custom consecutive limit', () => {
    const strict = Password({ consecutive: { max: 2 } })
    const codes = getErrorCodes(strict, 'Paaa1!bb')
    expect(codes).toContain('maxConsecutive')
  })
})

// ----------------------------------------------------------
// LENGTH CONSTRAINTS
// ----------------------------------------------------------

describe('password (length)', () => {
  it('rejects password shorter than min length', () => {
    const schema = Password({ length: { min: 12, max: 128 } })
    expect(parse(schema, 'P@ss1!Ab').success).toBe(false)
  })

  it('rejects password longer than max length', () => {
    const schema = Password({ length: { min: 8, max: 16 } })
    const long = `P@ssw0rd!${'a'.repeat(20)}`
    expect(parse(schema, long).success).toBe(false)
  })

  it('accepts password within custom range', () => {
    const schema = Password({ length: { min: 10, max: 20 } })
    expect(parse(schema, 'P@ssw0rd!!').success).toBe(true)
  })
})

// ----------------------------------------------------------
// MAX UPPERCASE
// ----------------------------------------------------------

describe('password (maxUppercase)', () => {
  it('rejects password exceeding max uppercase', () => {
    const schema = Password({ uppercase: { min: 1, max: 3 } })
    const codes = getErrorCodes(schema, 'ABCD!efg1')
    expect(codes).toContain('maxUppercase')
  })

  it('accepts password within max uppercase', () => {
    const schema = Password({ uppercase: { min: 1, max: 3 } })
    expect(parse(schema, 'ABc!efg1h').success).toBe(true)
  })
})

// ----------------------------------------------------------
// NORMALIZE
// ----------------------------------------------------------

describe('password (normalize)', () => {
  it('does not alter case by default (normalize: false)', () => {
    const schema = Password() as z.ZodType
    const result = schema.safeParse('P@ssw0rd!')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('P@ssw0rd!')
    }
  })

  it('trims whitespace when normalize is true', () => {
    const schema = Password({ normalize: true }) as z.ZodType
    const result = schema.safeParse('  P@ssw0rd!  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('P@ssw0rd!')
    }
  })
})

// ----------------------------------------------------------
// SECURITY VECTORS
// ----------------------------------------------------------

describe('password (security)', () => {
  const schema = Password()

  it.each([
    '<script>alert("xss")</script>',
    '\'; DROP TABLE users; --',
    '../../../etc/passwd',
    // eslint-disable-next-line no-template-curly-in-string -- REASON: XSS/injection test payload contains template literal syntax
    '${7*7}',
    '{{constructor.constructor("return this")()}}',
    '\x00\x00\x00\x00\x00\x00\x00\x00',
  ])('rejects malicious input: %s', (value) => {
    expect(parse(schema, value).success).toBe(false)
  })
})
