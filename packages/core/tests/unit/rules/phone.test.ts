// ==============================================================================
// PHONE RULE TESTS
// Tests for phone number validation covering international numbers, country
// filtering, mobile requirement, format options, and security vectors.
// ==============================================================================

import type { z } from 'zod'

import { describe, expect, it } from 'vitest'

import { Phone } from '@rules/phone'

import { getAsyncErrorCodes, parseAsync } from '../../_support/helpers/parse'

// ----------------------------------------------------------
// VALID PHONE NUMBERS
// ----------------------------------------------------------

describe('phone (valid)', () => {
  const schema = Phone()

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
  const schema = Phone()

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
    const schema = Phone({ requireCountryCode: true, country: 'US' })
    const result = await parseAsync(schema, '2125551234')
    expect(result.success).toBe(false)
  })

  it('accepts number with + when requireCountryCode is true', async () => {
    const schema = Phone({ requireCountryCode: true })
    const result = await parseAsync(schema, '+12125551234')
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// ALLOW COUNTRIES
// ----------------------------------------------------------

describe('phone (allowCountries)', () => {
  const schema = Phone({ allowCountries: ['US'] })

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
  const schema = Phone({ blockCountries: ['RU'] })

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
    const schema = Phone({ format: 'e164' })
    const result = await parseAsync(schema, '+1 212 555 1234')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('+12125551234')
    }
  })

  it('formats as international', async () => {
    const schema = Phone({ format: 'international' })
    const result = await parseAsync(schema, '+12125551234')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('+1 212 555 1234')
    }
  })

  it('formats as national', async () => {
    const schema = Phone({ format: 'national', country: 'US' })
    const result = await parseAsync(schema, '+12125551234')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('(212) 555-1234')
    }
  })
})

// ----------------------------------------------------------
// METADATA
// ----------------------------------------------------------

describe('phone (metadata)', () => {
  it('accepts mobile number with metadata: mobile + requireMobile', async () => {
    const schema = Phone({ metadata: 'mobile', requireMobile: true })
    const result = await parseAsync(schema, '+34612345678')
    expect(result.success).toBe(true)
  })

  it('rejects landline with metadata: max + requireMobile', async () => {
    const schema = Phone({ metadata: 'max', requireMobile: true })
    // UK London landline (FIXED_LINE); max metadata needed to classify non-mobile
    const result = await parseAsync(schema, '+442071234567')
    expect(result.success).toBe(false)
  })

  it('parses successfully with metadata: max', async () => {
    const schema = Phone({ metadata: 'max' })
    const result = await parseAsync(schema, '+12125551234')
    expect(result.success).toBe(true)
  })

  it('throws config error when requireMobile with default metadata (min)', () => {
    expect(() => Phone({ requireMobile: true })).toThrow('validex: requireMobile')
  })

  it('throws config error when requireMobile with metadata: min', () => {
    expect(() => Phone({ requireMobile: true, metadata: 'min' })).toThrow('validex: requireMobile')
  })

  it('throws config error when metadata: custom without customMetadataPath', () => {
    expect(() => Phone({ metadata: 'custom' })).toThrow('validex: Phone metadata "custom" requires customMetadataPath')
  })
})

// ----------------------------------------------------------
// REQUIRE MOBILE
// ----------------------------------------------------------

describe('phone (requireMobile)', () => {
  it('accepts Spanish mobile with metadata: mobile', async () => {
    const schema = Phone({ requireMobile: true, metadata: 'mobile' })
    const result = await parseAsync(schema, '+34612345678')
    expect(result.success).toBe(true)
  })

  it('accepts UK mobile with metadata: mobile', async () => {
    const schema = Phone({ requireMobile: true, metadata: 'mobile' })
    const result = await parseAsync(schema, '+447911123456')
    expect(result.success).toBe(true)
  })

  it('accepts US mobile with metadata: max', async () => {
    const schema = Phone({ requireMobile: true, metadata: 'max' })
    const result = await parseAsync(schema, '+12025551234')
    expect(result.success).toBe(true)
  })

  it('rejects UK landline and returns requireMobile error code', async () => {
    const schema = Phone({ requireMobile: true, metadata: 'max' })
    const result = await parseAsync(schema, '+442071234567')
    expect(result.success).toBe(false)
    const codes = await getAsyncErrorCodes(schema, '+442071234567')
    expect(codes).toContain('requireMobile')
  })

  it('rejects Paris landline and returns requireMobile error code', async () => {
    const schema = Phone({ requireMobile: true, metadata: 'max' })
    const result = await parseAsync(schema, '+33142123456')
    expect(result.success).toBe(false)
    const codes = await getAsyncErrorCodes(schema, '+33142123456')
    expect(codes).toContain('requireMobile')
  })

  it('rejects Berlin landline and returns requireMobile error code', async () => {
    const schema = Phone({ requireMobile: true, metadata: 'max' })
    const result = await parseAsync(schema, '+4930123456')
    expect(result.success).toBe(false)
    const codes = await getAsyncErrorCodes(schema, '+4930123456')
    expect(codes).toContain('requireMobile')
  })
})

// ----------------------------------------------------------
// NORMALIZE
// ----------------------------------------------------------

describe('phone (normalize)', () => {
  it('trims and formats when normalize is true (default)', async () => {
    const schema = Phone({ format: 'e164' })
    const result = await parseAsync(schema, '  +1 212 555 1234  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('+12125551234')
    }
  })

  it('does not format output when normalize is false', async () => {
    const schema = Phone({ normalize: false })
    const result = await parseAsync(schema, '+12125551234')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('+12125551234')
    }
  })
})

// ----------------------------------------------------------
// SECURITY VECTORS
// ----------------------------------------------------------

describe('phone (security)', () => {
  const schema = Phone()

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

describe('phone — edge cases', () => {
  it('rejects phone from non-allowed country', async () => {
    const schema = Phone({ allowCountries: ['US'] }) as z.ZodType
    const result = await schema.safeParseAsync('+447911123456')
    expect(result.success).toBe(false)
  })

  it('throws when metadata is custom without customMetadataPath', () => {
    expect(() => Phone({ metadata: 'custom' })).toThrow('customMetadataPath')
  })

  it('throws when metadata is custom with empty customMetadataPath', () => {
    expect(() => Phone({ metadata: 'custom', customMetadataPath: '' })).toThrow('customMetadataPath')
  })
})
