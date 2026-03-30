// ==============================================================================
// PHONE RULE TESTS
// Tests for phone number validation covering international numbers, country
// filtering, mobile requirement, format options, and security vectors.
// ==============================================================================

import type { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { phone } from '../../src/rules/phone'

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
// VALID PHONE NUMBERS
// ----------------------------------------------------------

describe('phone (valid)', () => {
  const schema = phone()

  it.each([
    { label: 'Spain', value: '+34612345678' },
    { label: 'UK', value: '+442079460958' },
    { label: 'US', value: '+12125551234' },
    { label: 'Japan', value: '+81312345678' },
    { label: 'Germany', value: '+4930123456' },
    { label: 'France', value: '+33612345678' },
    { label: 'Australia', value: '+61412345678' },
    { label: 'Brazil', value: '+5511912345678' },
    { label: 'India', value: '+919876543210' },
    { label: 'Canada', value: '+14165551234' },
  ])('accepts valid $label number: $value', async ({ value }) => {
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// INVALID PHONE NUMBERS
// ----------------------------------------------------------

describe('phone (invalid)', () => {
  const schema = phone()

  it.each([
    { desc: 'too short', value: '12345' },
    { desc: 'text', value: 'not-a-phone' },
    { desc: 'invalid country', value: '+999999999999' },
    { desc: 'empty string', value: '' },
    { desc: 'just prefix', value: '+1' },
    { desc: 'letters with prefix', value: '+1abcdefghij' },
  ])('rejects $desc: $value', async ({ value }) => {
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// REQUIRE COUNTRY CODE
// ----------------------------------------------------------

describe('phone (requireCountryCode)', () => {
  it('rejects number without + when requireCountryCode is true', async () => {
    const schema = phone({ requireCountryCode: true, country: 'US' })
    const result = await parseAsync(schema, '2125551234')
    expect(result.success).toBe(false)
  })

  it('accepts number with + when requireCountryCode is true', async () => {
    const schema = phone({ requireCountryCode: true })
    const result = await parseAsync(schema, '+12125551234')
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// ALLOW COUNTRIES
// ----------------------------------------------------------

describe('phone (allowCountries)', () => {
  const schema = phone({ allowCountries: ['US'] })

  it('accepts US number when US is allowed', async () => {
    const result = await parseAsync(schema, '+12125551234')
    expect(result.success).toBe(true)
  })

  it('rejects DE number when only US is allowed', async () => {
    const result = await parseAsync(schema, '+4930123456')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// BLOCK COUNTRIES
// ----------------------------------------------------------

describe('phone (blockCountries)', () => {
  const schema = phone({ blockCountries: ['RU'] })

  it('rejects RU number when RU is blocked', async () => {
    const result = await parseAsync(schema, '+79161234567')
    expect(result.success).toBe(false)
  })

  it('accepts US number when RU is blocked', async () => {
    const result = await parseAsync(schema, '+12125551234')
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// FORMAT OPTIONS
// ----------------------------------------------------------

describe('phone (format)', () => {
  it('formats as E.164 by default', async () => {
    const schema = phone({ format: 'e164' })
    const result = await parseAsync(schema, '+1 212 555 1234')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('+12125551234')
    }
  })

  it('formats as international', async () => {
    const schema = phone({ format: 'international' })
    const result = await parseAsync(schema, '+12125551234')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('+1 212 555 1234')
    }
  })

  it('formats as national', async () => {
    const schema = phone({ format: 'national', country: 'US' })
    const result = await parseAsync(schema, '+12125551234')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('(212) 555-1234')
    }
  })
})

// ----------------------------------------------------------
// SECURITY VECTORS
// ----------------------------------------------------------

describe('phone (security)', () => {
  const schema = phone()

  it.each([
    '+1<script>alert(1)</script>',
    '+1\n2125551234',
    '+1; DROP TABLE',
    '+1\0',
    '+1\u200B',
    'javascript:void(0)',
    '+1'.repeat(100),
    '<img src=x onerror=alert(1)>',
    '../../etc/passwd',
    'null',
    'undefined',
  ])('rejects malicious input: %s', async (value) => {
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(false)
  })
})
