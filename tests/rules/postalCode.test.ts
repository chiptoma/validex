// ==============================================================================
// POSTAL CODE RULE TESTS
// Tests for postal code validation covering multiple countries, regex override,
// normalization, and security vectors.
// ==============================================================================

import type { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { PostalCode } from '../../src/rules/postalCode'

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
// VALID POSTAL CODES
// ----------------------------------------------------------

describe('postalCode (valid)', () => {
  it.each([
    { country: 'US', value: '12345' },
    { country: 'US', value: '12345-6789' },
    { country: 'GB', value: 'SW1A 1AA' },
    { country: 'GB', value: 'EC1A 1BB' },
    { country: 'CA', value: 'K1A 0B1' },
    { country: 'DE', value: '10115' },
    { country: 'DE', value: '80331' },
    { country: 'FR', value: '75001' },
    { country: 'FR', value: '13001' },
    { country: 'JP', value: '100-0001' },
    { country: 'ES', value: '28001' },
    { country: 'NL', value: '1012 AB' },
  ])('accepts $country: $value', async ({ country, value }) => {
    const schema = PostalCode({ country })
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// INVALID POSTAL CODES
// ----------------------------------------------------------

describe('postalCode (invalid)', () => {
  it.each([
    { country: 'US', value: 'ABCDE', desc: 'letters for US' },
    { country: 'US', value: '1234', desc: 'too short for US' },
    { country: 'US', value: '123456', desc: 'too long for US' },
    { country: 'GB', value: '123456', desc: 'numeric for UK' },
    { country: 'DE', value: 'ABCDE', desc: 'letters for Germany' },
    { country: 'FR', value: 'ABCDE', desc: 'letters for France' },
  ])('rejects $desc: $value', async ({ country, value }) => {
    const schema = PostalCode({ country })
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(false)
  })

  it('rejects empty string', async () => {
    const schema = PostalCode({ country: 'US' })
    const result = await parseAsync(schema, '')
    expect(result.success).toBe(false)
  })

  it('rejects random strings', async () => {
    const schema = PostalCode({ country: 'US' })
    const result = await parseAsync(schema, 'not-a-postal-code')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// DIFFERENT COUNTRIES
// ----------------------------------------------------------

describe('postalCode (country switching)', () => {
  it('validates same code differently per country', async () => {
    const usSchema = PostalCode({ country: 'US' })
    const deSchema = PostalCode({ country: 'DE' })

    const usResult = await parseAsync(usSchema, '10115')
    const deResult = await parseAsync(deSchema, '10115')

    // 10115 is valid for both US and DE (5-digit)
    expect(usResult.success).toBe(true)
    expect(deResult.success).toBe(true)
  })

  it('uK code invalid for US', async () => {
    const schema = PostalCode({ country: 'US' })
    const result = await parseAsync(schema, 'SW1A 1AA')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// REGEX OVERRIDE
// ----------------------------------------------------------

describe('postalCode (regex override)', () => {
  it('uses custom regex when provided', async () => {
    const schema = PostalCode({
      country: 'XX',
      regex: /^\d{4}$/,
    })
    const valid = await parseAsync(schema, '1234')
    const invalid = await parseAsync(schema, '12345')

    expect(valid.success).toBe(true)
    expect(invalid.success).toBe(false)
  })

  it('custom regex overrides country validation', async () => {
    const schema = PostalCode({
      country: 'US',
      regex: /^[A-Z]{3}$/,
    })
    const result = await parseAsync(schema, 'ABC')
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// NORMALIZATION
// ----------------------------------------------------------

describe('postalCode (normalization)', () => {
  it('uppercases lowercase input', async () => {
    const schema = PostalCode({ country: 'GB' })
    const result = await parseAsync(schema, 'sw1a 1aa')
    expect(result.success).toBe(true)
  })

  it('trims whitespace', async () => {
    const schema = PostalCode({ country: 'US' })
    const result = await parseAsync(schema, '  12345  ')
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// SECURITY VECTORS
// ----------------------------------------------------------

describe('postalCode (security)', () => {
  const schema = PostalCode({ country: 'US' })

  it.each([
    '12345<script>alert(1)</script>',
    '12345\n67890',
    '12345; DROP TABLE',
    '12345\0',
    '12345\u200B',
    'javascript:void(0)',
    '12345'.repeat(100),
    '<img src=x onerror=alert(1)>',
    '../../etc/passwd',
    'null',
    'undefined',
  ])('rejects malicious input: %s', async (value) => {
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(false)
  })
})
