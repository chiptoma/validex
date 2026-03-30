// ==============================================================================
// UUID RULE TESTS
// Validates UUID parsing, version filtering, normalization, and security.
// ==============================================================================

import type { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { Uuid } from '../../src/rules/uuid'
import { testRuleContract } from '../helpers/testRule'

// ----------------------------------------------------------
// CONTRACT TESTS
// ----------------------------------------------------------

testRuleContract('uuid', Uuid as (opts?: Record<string, unknown>) => unknown, 'uuid')

// ----------------------------------------------------------
// VALID UUIDS
// ----------------------------------------------------------

describe('uuid (valid)', () => {
  const schema = Uuid() as z.ZodType

  const validUuids: ReadonlyArray<string> = [
    '550e8400-e29b-41d4-a716-446655440000',
    '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    'a8098c1a-f86e-11da-bd1a-00112444be1e',
    '00000000-0000-0000-0000-000000000000',
    '123e4567-e89b-12d3-a456-426614174000',
    '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
    '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed',
    'c56a4180-65aa-42ec-a945-5fd21dec0538',
    'de305d54-75b4-431b-adb2-eb6b9e546014',
  ]

  it.each(validUuids)('accepts: %s', (value) => {
    const result = schema.safeParse(value)
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// INVALID UUIDS
// ----------------------------------------------------------

describe('uuid (invalid)', () => {
  const schema = Uuid() as z.ZodType

  const invalidUuids: ReadonlyArray<string> = [
    '550e8400-e29b-41d4-a716',
    '550e8400-e29b-41d4-a716-446655440000-extra',
    '550e8400e29b41d4a716446655440000',
    'gggggggg-gggg-gggg-gggg-gggggggggggg',
    '550e8400-e29b-41d4-a716-44665544000z',
    'not-a-uuid-at-all',
    '12345',
    '550e8400-e29b-41d4-a716_446655440000',
    '550e8400-e29b-41d4-a716-4466554400',
    '{550e8400-e29b-41d4-a716-446655440000}',
    'uuid:550e8400-e29b-41d4-a716-446655440000',
    '550e8400-e29b-41d4-a71-6446655440000',
  ]

  it.each(invalidUuids)('rejects: %s', (value) => {
    const result = schema.safeParse(value)
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// VERSION FILTERING
// ----------------------------------------------------------

describe('uuid (version filtering)', () => {
  it('accepts v4 UUID when version is 4', () => {
    const schema = Uuid({ version: 4 }) as z.ZodType
    const result = schema.safeParse('550e8400-e29b-41d4-a716-446655440000')
    expect(result.success).toBe(true)
  })

  it('rejects v1 UUID when version is 4', () => {
    const schema = Uuid({ version: 4 }) as z.ZodType
    const result = schema.safeParse('6ba7b810-9dad-11d1-80b4-00c04fd430c8')
    expect(result.success).toBe(false)
  })

  it('accepts v1 UUID when version is 1', () => {
    const schema = Uuid({ version: 1 }) as z.ZodType
    const result = schema.safeParse('6ba7b810-9dad-11d1-80b4-00c04fd430c8')
    expect(result.success).toBe(true)
  })

  it('rejects v4 UUID when version is 1', () => {
    const schema = Uuid({ version: 1 }) as z.ZodType
    const result = schema.safeParse('550e8400-e29b-41d4-a716-446655440000')
    expect(result.success).toBe(false)
  })

  it('accepts v7 UUID when version is 7', () => {
    const schema = Uuid({ version: 7 }) as z.ZodType
    const result = schema.safeParse('01867b2c-a0dd-7e2c-9c8e-83a2e0c9d7f1')
    expect(result.success).toBe(true)
  })

  it('accepts any version when version is "any"', () => {
    const schema = Uuid({ version: 'any' }) as z.ZodType
    expect(schema.safeParse('550e8400-e29b-41d4-a716-446655440000').success).toBe(true)
    expect(schema.safeParse('6ba7b810-9dad-11d1-80b4-00c04fd430c8').success).toBe(true)
  })
})

// ----------------------------------------------------------
// NORMALIZATION
// ----------------------------------------------------------

describe('uuid (normalization)', () => {
  it('accepts uppercase UUID and normalizes to lowercase', () => {
    const schema = Uuid() as z.ZodType
    const result = schema.safeParse('550E8400-E29B-41D4-A716-446655440000')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('550e8400-e29b-41d4-a716-446655440000')
    }
  })

  it('accepts mixed-case UUID and normalizes', () => {
    const schema = Uuid() as z.ZodType
    const result = schema.safeParse('550e8400-E29B-41d4-A716-446655440000')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('550e8400-e29b-41d4-a716-446655440000')
    }
  })

  it('trims whitespace from UUID', () => {
    const schema = Uuid() as z.ZodType
    const result = schema.safeParse('  550e8400-e29b-41d4-a716-446655440000  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('550e8400-e29b-41d4-a716-446655440000')
    }
  })

  it('preserves original case when normalize is false', () => {
    const schema = Uuid({ normalize: false }) as z.ZodType
    const upper = schema.safeParse('550E8400-E29B-41D4-A716-446655440000')
    expect(upper.success).toBe(true)
    if (upper.success) {
      expect(upper.data).toBe('550E8400-E29B-41D4-A716-446655440000')
    }
  })
})

// ----------------------------------------------------------
// SECURITY
// ----------------------------------------------------------

describe('uuid (security)', () => {
  const schema = Uuid() as z.ZodType

  const payloads: ReadonlyArray<string> = [
    '<script>alert("xss")</script>',
    '\'; DROP TABLE users; --',
    '550e8400-e29b-41d4-a716-446655440000\x00injected',
    '../../../etc/passwd',
    // eslint-disable-next-line no-template-curly-in-string
    '${7*7}',
    '{{constructor.constructor("return this")()}}',
    '%00%00%00%00-%00%00-%00%00-%00%00-%00%00%00%00%00%00',
    'AAAA-AAAA-AAAA-AAAA-AAAAAAAAAAAA',
  ]

  it.each(payloads)('rejects payload: %s', (value) => {
    const result = schema.safeParse(value)
    expect(result.success).toBe(false)
  })
})
