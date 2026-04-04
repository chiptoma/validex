// ==============================================================================
// MAC ADDRESS RULE TESTS
// Validates MAC address parsing, delimiter options, and security.
// ==============================================================================

import type { z } from 'zod'

import { describe, expect, it } from 'vitest'

import { MacAddress } from '@rules/macAddress'

import { testRuleContract } from '../../_support/helpers/testRule'

// ----------------------------------------------------------
// CONTRACT TESTS
// ----------------------------------------------------------

testRuleContract(
  'MacAddress',
  MacAddress as (opts?: Record<string, unknown>) => unknown,
  'macAddress',
)

// ----------------------------------------------------------
// VALID MAC ADDRESSES (COLON DELIMITER)
// ----------------------------------------------------------

describe('macAddress (valid, colon delimiter)', () => {
  const schema = MacAddress() as z.ZodType

  const validMacs: ReadonlyArray<string> = [
    '00:1A:2B:3C:4D:5E',
    'AA:BB:CC:DD:EE:FF',
    '01:23:45:67:89:AB',
    'a1:b2:c3:d4:e5:f6',
    '00:00:00:00:00:00',
    'FF:FF:FF:FF:FF:FF',
    'de:ad:be:ef:ca:fe',
    '12:34:56:78:9a:bc',
    'AB:CD:EF:01:23:45',
    '0a:0b:0c:0d:0e:0f',
    'f0:f1:f2:f3:f4:f5',
  ]

  it.each(validMacs)('accepts: %s', (value) => {
    const result = schema.safeParse(value)
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// INVALID MAC ADDRESSES
// ----------------------------------------------------------

describe('macAddress (invalid)', () => {
  const schema = MacAddress() as z.ZodType

  const invalidMacs: ReadonlyArray<string> = [
    '00:1A:2B:3C:4D',
    '00:1A:2B:3C:4D:5E:6F',
    '001A2B3C4D5E',
    '00-1A-2B-3C-4D-5E',
    'GG:HH:II:JJ:KK:LL',
    '00:1A:2B:3C:4D:5',
    '00:1A:2B:3C:4D:5EE',
    'not-a-mac',
    '00:1A:2B:3C:4D:5E:',
    ':00:1A:2B:3C:4D:5E',
    '00::1A:2B:3C:4D:5E',
    '00:1A:2B:3C:4D:5G',
  ]

  it.each(invalidMacs)('rejects: %s', (value) => {
    const result = schema.safeParse(value)
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// DELIMITER OPTIONS
// ----------------------------------------------------------

describe('macAddress (delimiter options)', () => {
  it('accepts hyphen-delimited when delimiter is "-"', () => {
    const schema = MacAddress({ delimiter: '-' }) as z.ZodType
    const result = schema.safeParse('00-1A-2B-3C-4D-5E')
    expect(result.success).toBe(true)
  })

  it('rejects colon-delimited when delimiter is "-"', () => {
    const schema = MacAddress({ delimiter: '-' }) as z.ZodType
    const result = schema.safeParse('00:1A:2B:3C:4D:5E')
    expect(result.success).toBe(false)
  })

  it('accepts no-delimiter format when delimiter is "none"', () => {
    const schema = MacAddress({ delimiter: 'none' }) as z.ZodType
    const result = schema.safeParse('001A2B3C4D5E')
    expect(result.success).toBe(true)
  })

  it('rejects colon-delimited when delimiter is "none"', () => {
    const schema = MacAddress({ delimiter: 'none' }) as z.ZodType
    const result = schema.safeParse('00:1A:2B:3C:4D:5E')
    expect(result.success).toBe(false)
  })

  it('rejects hyphen-delimited with default colon delimiter', () => {
    const schema = MacAddress() as z.ZodType
    const result = schema.safeParse('00-1A-2B-3C-4D-5E')
    expect(result.success).toBe(false)
  })

  it('accepts lowercase with hyphen delimiter', () => {
    const schema = MacAddress({ delimiter: '-' }) as z.ZodType
    const result = schema.safeParse('aa-bb-cc-dd-ee-ff')
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// NORMALIZATION
// ----------------------------------------------------------

describe('macAddress (normalization)', () => {
  it('trims whitespace when normalize is true', () => {
    const schema = MacAddress() as z.ZodType
    const result = schema.safeParse('  00:1A:2B:3C:4D:5E  ')
    expect(result.success).toBe(true)
  })

  it('rejects whitespace when normalize is false', () => {
    const schema = MacAddress({ normalize: false }) as z.ZodType
    const result = schema.safeParse('  00:1A:2B:3C:4D:5E  ')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// SECURITY
// ----------------------------------------------------------

describe('macAddress (security)', () => {
  const schema = MacAddress() as z.ZodType

  const payloads: ReadonlyArray<string> = [
    '<script>alert("xss")</script>',
    '\'; DROP TABLE users; --',
    '00:1A:2B:3C:4D:5E\x00injected',
    '../../../etc/passwd',
    // eslint-disable-next-line no-template-curly-in-string -- REASON: XSS/injection test payload contains template literal syntax
    '${7*7}',
    '{{constructor.constructor("return this")()}}',
    '%00:%00:%00:%00:%00:%00',
  ]

  it.each(payloads)('rejects payload: %s', (value) => {
    const result = schema.safeParse(value)
    expect(result.success).toBe(false)
  })
})
