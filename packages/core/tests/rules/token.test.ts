// ==============================================================================
// TOKEN RULE TESTS
// Tests for the token validation rule covering all supported token types.
// ==============================================================================

import type { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { Token } from '../../src/rules/token'
import { testRuleContract } from '../helpers/testRule'

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

function parse(schema: unknown, value: unknown): { success: boolean } {
  return (schema as z.ZodType).safeParse(value)
}

// ----------------------------------------------------------
// CONTRACT
// ----------------------------------------------------------

testRuleContract(
  'Token',
  () => Token({ type: 'nanoid' }),
  'token',
)

// ----------------------------------------------------------
// NANOID
// ----------------------------------------------------------

describe('token (nanoid)', () => {
  const schema = Token({ type: 'nanoid' })

  it('accepts valid 21-char nanoid', () => {
    expect(parse(schema, 'V1StGXR8_Z5jdHi6B-myT').success).toBe(true)
  })

  it('rejects wrong length', () => {
    expect(parse(schema, 'short').success).toBe(false)
  })

  it('rejects invalid characters', () => {
    expect(parse(schema, 'V1StGXR8_Z5jdHi6B.myT').success).toBe(false)
  })

  it('accepts custom length range', () => {
    const custom = Token({ type: 'nanoid', length: { min: 10, max: 30 } })
    expect(parse(custom, 'V1StGXR8_Z').success).toBe(true)
  })
})

// ----------------------------------------------------------
// HEX
// ----------------------------------------------------------

describe('token (hex)', () => {
  const schema = Token({ type: 'hex', length: { min: 32, max: 64 } })

  it('accepts valid hex string', () => {
    expect(parse(schema, 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6').success).toBe(true)
  })

  it('rejects non-hex characters', () => {
    expect(parse(schema, 'g1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6').success).toBe(false)
  })

  it('rejects too short', () => {
    expect(parse(schema, 'abcdef').success).toBe(false)
  })
})

// ----------------------------------------------------------
// BASE64
// ----------------------------------------------------------

describe('token (base64)', () => {
  const schema = Token({ type: 'base64', length: { min: 4, max: 100 } })

  it('accepts valid base64', () => {
    expect(parse(schema, 'SGVsbG8gV29ybGQ=').success).toBe(true)
  })

  it('accepts base64 without padding', () => {
    expect(parse(schema, 'SGVsbG8').success).toBe(true)
  })

  it('rejects invalid base64 characters', () => {
    expect(parse(schema, 'SGVs!G8=').success).toBe(false)
  })
})

// ----------------------------------------------------------
// CUID
// ----------------------------------------------------------

describe('token (cuid)', () => {
  const schema = Token({ type: 'cuid' })

  it('accepts valid cuid', () => {
    expect(parse(schema, 'cjld2cyuq0000t3rmniod1foy').success).toBe(true)
  })

  it('rejects cuid not starting with c', () => {
    expect(parse(schema, 'ajld2cyuq0000t3rmniod1foy').success).toBe(false)
  })

  it('rejects wrong length', () => {
    expect(parse(schema, 'cjld2').success).toBe(false)
  })
})

// ----------------------------------------------------------
// CUID2
// ----------------------------------------------------------

describe('token (cuid2)', () => {
  const schema = Token({ type: 'cuid2' })

  it('accepts valid cuid2', () => {
    expect(parse(schema, 'tz4a98xxat96iws9zmbrgj3a').success).toBe(true)
  })

  it('rejects cuid2 starting with digit', () => {
    expect(parse(schema, '1z4a98xxat96iws9zmbrgj3a').success).toBe(false)
  })

  it('rejects uppercase', () => {
    expect(parse(schema, 'Tz4a98xxat96iws9zmbrgj3a').success).toBe(false)
  })
})

// ----------------------------------------------------------
// ULID
// ----------------------------------------------------------

describe('token (ulid)', () => {
  const schema = Token({ type: 'ulid' })

  it('accepts valid ULID', () => {
    expect(parse(schema, '01ARZ3NDEKTSV4RRFFQ69G5FAV').success).toBe(true)
  })

  it('rejects wrong length', () => {
    expect(parse(schema, '01ARZ3NDEK').success).toBe(false)
  })

  it('rejects invalid Crockford Base32 chars (I, L, O, U)', () => {
    expect(parse(schema, '01ARZ3NDEKTSV4RRFFQI9G5FAV').success).toBe(false)
  })
})

// ----------------------------------------------------------
// LENGTH CONSTRAINTS
// ----------------------------------------------------------

describe('token (length)', () => {
  it('supports exact length via number', () => {
    const schema = Token({ type: 'hex', length: 8 })
    expect(parse(schema, 'abcdef12').success).toBe(true)
    expect(parse(schema, 'abcdef1').success).toBe(false)
    expect(parse(schema, 'abcdef123').success).toBe(false)
  })
})

// ----------------------------------------------------------
// SECURITY VECTORS
// ----------------------------------------------------------

describe('token (security)', () => {
  const schema = Token({ type: 'nanoid' })

  it.each([
    '<script>alert(1)</script>',
    'V1StGXR8_Z5jdHi6B\nmyT',
    'V'.repeat(500),
    'V1St; DROP TABLE users',
    'V1StGXR8_Z5jdHi6B\0myT',
  ])('rejects malicious input: %s', (value) => {
    expect(parse(schema, value).success).toBe(false)
  })
})
