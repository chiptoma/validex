// ==============================================================================
// VAT NUMBER RULE TESTS
// Tests for VAT number validation covering country detection, prefix handling,
// normalization, and security vectors.
// ==============================================================================

import type { z } from 'zod'

import { describe, expect, it } from 'vitest'

import { VatNumber } from '@rules/vatNumber'

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Parse Async
 * Runs safeParseAsync on the given schema and value.
 *
 * @param schema - The Zod schema (from rule factory).
 * @param value  - The value to parse.
 * @returns The safe parse result.
 */
async function parseAsync(
  schema: unknown,
  value: unknown,
): Promise<{ success: boolean, data?: unknown, error?: unknown }> {
  return (schema as z.ZodType).safeParseAsync(value)
}

// ----------------------------------------------------------
// VALID VAT NUMBERS (AUTO-DETECT)
// ----------------------------------------------------------

describe('vatNumber (valid with prefix)', () => {
  const schema = VatNumber()

  it.each([
    'DE123456789',
    'FR12345678901',
    'GB123456789',
    'IT12345678901',
    'ES12345678X',
    'PL1234567890',
    'NL123456789B12',
    'BE0123456789',
    'ATU12345678',
    'CZ12345678',
    'DK12345678',
    'SE123456789012',
  ])('accepts valid VAT number: %s', async (value) => {
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// VALID VAT WITH COUNTRY OPTION
// ----------------------------------------------------------

describe('vatNumber (country option)', () => {
  it('accepts number without prefix when country is set', async () => {
    const schema = VatNumber({ country: 'DE' })
    const result = await parseAsync(schema, '123456789')
    expect(result.success).toBe(true)
  })

  it('accepts number with prefix when country is set', async () => {
    const schema = VatNumber({ country: 'DE' })
    const result = await parseAsync(schema, 'DE123456789')
    expect(result.success).toBe(true)
  })

  it('rejects mismatched country format', async () => {
    const schema = VatNumber({ country: 'DE' })
    const result = await parseAsync(schema, 'FR123')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// NORMALIZATION
// ----------------------------------------------------------

describe('vatNumber (normalization)', () => {
  it('normalizes lowercase to uppercase', async () => {
    const schema = VatNumber()
    const result = await parseAsync(schema, 'de123456789')
    expect(result.success).toBe(true)
  })

  it('strips spaces (Austria example)', async () => {
    const schema = VatNumber()
    const result = await parseAsync(schema, 'AT U12345678')
    expect(result.success).toBe(true)
  })

  it('trims whitespace', async () => {
    const schema = VatNumber()
    const result = await parseAsync(schema, '  DE123456789  ')
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// REQUIRE PREFIX
// ----------------------------------------------------------

describe('vatNumber (requirePrefix)', () => {
  it('accepts value with prefix when requirePrefix is true', async () => {
    const schema = VatNumber({ country: 'DE', requirePrefix: true })
    const result = await parseAsync(schema, 'DE123456789')
    expect(result.success).toBe(true)
  })

  it('rejects value without prefix when requirePrefix is true', async () => {
    const schema = VatNumber({ country: 'DE', requirePrefix: true })
    const result = await parseAsync(schema, '123456789')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// INVALID VAT NUMBERS
// ----------------------------------------------------------

describe('vatNumber (invalid)', () => {
  const schema = VatNumber()

  it.each([
    'XX123456789',
    '12345',
    'DE12345',
    '',
    'INVALID',
    'ZZ999999',
    'DE',
    'A',
  ])('rejects invalid VAT number: %s', async (value) => {
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// EMPTY TO UNDEFINED
// ----------------------------------------------------------

describe('vatNumber (emptyToUndefined)', () => {
  it('rejects empty string by default', async () => {
    const schema = VatNumber()
    const result = await parseAsync(schema, '')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// SECURITY VECTORS
// ----------------------------------------------------------

describe('vatNumber (security)', () => {
  const schema = VatNumber()

  it.each([
    'DE123456789<script>alert(1)</script>',
    'DE123456789\nFR12345678901',
    'DE123456789; DROP TABLE',
    'DE\x00123456789',
    'DE\u200B123456789',
    'javascript:void(0)',
    'DE123456789'.repeat(50),
    '<img src=x onerror=alert(1)>',
    '../../etc/passwd',
    'null',
    'undefined',
  ])('rejects malicious input: %s', async (value) => {
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(false)
  })
})

describe('vatNumber — edge cases', () => {
  it('preserves case when normalize is false', async () => {
    const schema = VatNumber({ normalize: false }) as z.ZodType
    const result = await schema.safeParseAsync('de123456789')
    // Without uppercase normalization, DE pattern may fail
    expect(result.success).toBe(false)
  })

  it('uses default requirePrefix false when cleared via undefined', async () => {
    // Clearing requirePrefix to undefined triggers the ?? false fallback
    const schema = VatNumber({ requirePrefix: undefined }) as z.ZodType
    // Without prefix requirement, a valid VAT number without country prefix should fail
    // because the format still needs a country prefix in the string for pattern matching
    const result = await schema.safeParseAsync('DE123456789')
    expect(result.success).toBe(true)
  })
})
