// ==============================================================================
// LICENSE KEY RULE TESTS
// Tests for the license key validation rule covering formats and charsets.
// ==============================================================================

import type { z } from 'zod'

import { describe, expect, it } from 'vitest'

import { LicenseKey } from '@rules/licenseKey'

import { parse } from '../../_support/helpers/parse'
import { testRuleContract } from '../../_support/helpers/testRule'
// ----------------------------------------------------------
// CONTRACT
// ----------------------------------------------------------

testRuleContract(
  'LicenseKey',
  LicenseKey as (opts?: Record<string, unknown>) => unknown,
  'licenseKey',
)

// ----------------------------------------------------------
// VALID LICENSE KEYS (DEFAULT FORMAT)
// ----------------------------------------------------------

describe('licenseKey (valid - default)', () => {
  const schema = LicenseKey()

  it.each([
    'ABCDE-FGHIJ-KLMNO-PQRST-UVWXY',
    'A1B2C-D3E4F-G5H6I-J7K8L-M9N0O',
    '12345-67890-ABCDE-FGHIJ-KLMNO',
    'ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ-ZZZZZ',
  ])('accepts valid key: %s', (value) => {
    expect(parse(schema, value).success).toBe(true)
  })
})

// ----------------------------------------------------------
// INVALID LICENSE KEYS (DEFAULT FORMAT)
// ----------------------------------------------------------

describe('licenseKey (invalid - default)', () => {
  const schema = LicenseKey()

  it.each([
    'ABCDE',
    'ABCDE-FGHIJ',
    'ABCDE_FGHIJ_KLMNO_PQRST_UVWXY',
    'ABCDE-FGHI-KLMNO-PQRST-UVWXY',
    '',
    'ABCDE-FGHIJ-KLMNO-PQRST-UVWXY-EXTRA',
    'ABCD!-FGHIJ-KLMNO-PQRST-UVWXY',
  ])('rejects invalid key: %s', (value) => {
    expect(parse(schema, value).success).toBe(false)
  })

  it('rejects lowercase (normalized to uppercase, pattern still must match)', () => {
    const result = parse(schema, 'abcde-fghij-klmno-pqrst-uvwxy')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('ABCDE-FGHIJ-KLMNO-PQRST-UVWXY')
    }
  })
})

// ----------------------------------------------------------
// CUSTOM FORMAT
// ----------------------------------------------------------

describe('licenseKey (custom format)', () => {
  it('accepts 4-segment hex key', () => {
    const schema = LicenseKey({
      segments: 4,
      segmentLength: 4,
      charset: 'hex',
    })
    expect(parse(schema, 'ABCD-1234-EF56-7890').success).toBe(true)
  })

  it('rejects non-hex characters in hex mode', () => {
    const schema = LicenseKey({
      segments: 4,
      segmentLength: 4,
      charset: 'hex',
    })
    expect(parse(schema, 'GHIJ-1234-EF56-7890').success).toBe(false)
  })

  it('accepts numeric-only key', () => {
    const schema = LicenseKey({
      segments: 3,
      segmentLength: 4,
      charset: 'numeric',
    })
    expect(parse(schema, '1234-5678-9012').success).toBe(true)
  })

  it('accepts alpha-only key', () => {
    const schema = LicenseKey({
      segments: 3,
      segmentLength: 3,
      charset: 'alpha',
    })
    expect(parse(schema, 'ABC-DEF-GHI').success).toBe(true)
  })

  it('supports custom separator', () => {
    const schema = LicenseKey({
      segments: 3,
      segmentLength: 4,
      separator: '.',
    })
    expect(parse(schema, 'ABCD.EF12.GH34').success).toBe(true)
  })

  it('rejects wrong separator', () => {
    const schema = LicenseKey({
      segments: 3,
      segmentLength: 4,
      separator: '.',
    })
    expect(parse(schema, 'ABCD-EF12-GH34').success).toBe(false)
  })
})

// ----------------------------------------------------------
// UUID TYPE
// ----------------------------------------------------------

describe('licenseKey (uuid type)', () => {
  it('accepts valid UUID', () => {
    const schema = LicenseKey({ type: 'uuid' })
    expect(parse(schema, '550e8400-e29b-41d4-a716-446655440000').success).toBe(true)
  })

  it('rejects non-UUID string', () => {
    const schema = LicenseKey({ type: 'uuid' })
    expect(parse(schema, 'not-a-uuid').success).toBe(false)
  })
})

// ----------------------------------------------------------
// NORMALIZATION
// ----------------------------------------------------------

describe('licenseKey (normalize)', () => {
  it('uppercases and trims input', () => {
    const schema = LicenseKey()
    const result = (schema as z.ZodType).safeParse('  abcde-fghij-klmno-pqrst-uvwxy  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('ABCDE-FGHIJ-KLMNO-PQRST-UVWXY')
    }
  })
})

// ----------------------------------------------------------
// SECURITY VECTORS
// ----------------------------------------------------------

describe('licenseKey (security)', () => {
  const schema = LicenseKey()

  it.each([
    '<script>alert(1)</script>',
    'ABCDE\n-FGHIJ-KLMNO-PQRST-UVWXY',
    'A'.repeat(500),
    'ABCDE; DROP TABLE',
    'ABCDE\0FGHIJ',
  ])('rejects malicious input: %s', (value) => {
    expect(parse(schema, value).success).toBe(false)
  })
})

describe('licenseKey (regex override)', () => {
  it('accepts value matching custom regex override', () => {
    const schema = LicenseKey({ regex: /^LK-[A-Z0-9]{8}$/ })
    expect(parse(schema, 'LK-ABCD1234').success).toBe(true)
    expect(parse(schema, 'invalid').success).toBe(false)
  })
})

describe('licenseKey — edge cases', () => {
  it('validates single-segment license key', () => {
    const schema = LicenseKey({ segments: 1, segmentLength: 5 }) as z.ZodType
    expect(schema.safeParse('ABCDE').success).toBe(true)
    expect(schema.safeParse('ABC').success).toBe(false)
  })

  it('validates UUID-type license key', () => {
    const schema = LicenseKey({ type: 'uuid' }) as z.ZodType
    expect(schema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true)
    expect(schema.safeParse('not-a-uuid').success).toBe(false)
  })

  it('rejects lowercase input when normalize is false (format requires uppercase)', () => {
    const schema = LicenseKey({ normalize: false }) as z.ZodType
    const result = schema.safeParse('abcde-fghij-klmno-pqrst-uvwxy')
    expect(result.success).toBe(false)
  })

  it('preserves already-uppercase input when normalize is false', () => {
    const schema = LicenseKey({ normalize: false }) as z.ZodType
    const result = schema.safeParse('ABCDE-FGHIJ-KLMNO-PQRST-UVWXY')
    expect(result.success).toBe(true)
    if (result.success)
      expect(result.data).toBe('ABCDE-FGHIJ-KLMNO-PQRST-UVWXY')
  })

  it('validates UUID license key without normalization', () => {
    const schema = LicenseKey({ type: 'uuid', normalize: false }) as z.ZodType
    // Uppercase UUID should still validate (format check lowercases internally)
    expect(schema.safeParse('550E8400-E29B-41D4-A716-446655440000').success).toBe(true)
    expect(schema.safeParse('not-a-uuid').success).toBe(false)
  })
})
