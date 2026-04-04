// ==============================================================================
// IP ADDRESS RULE TESTS
// Validates IPv4/IPv6 parsing, CIDR, version filtering, privacy, and security.
// ==============================================================================

import type { z } from 'zod'

import { describe, expect, it } from 'vitest'

import { IpAddress } from '@rules/ipAddress'

import { testRuleContract } from '../../_support/helpers/testRule'

// ----------------------------------------------------------
// CONTRACT TESTS
// ----------------------------------------------------------

testRuleContract('IpAddress', IpAddress as (opts?: Record<string, unknown>) => unknown, 'ipAddress')

// ----------------------------------------------------------
// VALID IPV4
// ----------------------------------------------------------

describe('ipAddress (valid IPv4)', () => {
  const schema = IpAddress() as z.ZodType

  const validIps: ReadonlyArray<string> = [
    '192.168.1.1',
    '8.8.8.8',
    '10.0.0.1',
    '255.255.255.255',
    '0.0.0.0',
    '172.16.0.1',
    '1.2.3.4',
  ]

  it.each(validIps)('accepts: %s', (value) => {
    const result = schema.safeParse(value)
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// VALID IPV6
// ----------------------------------------------------------

describe('ipAddress (valid IPv6)', () => {
  const schema = IpAddress() as z.ZodType

  const validIps: ReadonlyArray<string> = [
    '::1',
    '2001:db8::1',
    '::ffff:192.168.1.1',
    'fe80::1',
    '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
  ]

  it.each(validIps)('accepts: %s', (value) => {
    const result = schema.safeParse(value)
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// INVALID IPS
// ----------------------------------------------------------

describe('ipAddress (invalid)', () => {
  const schema = IpAddress() as z.ZodType

  const invalidIps: ReadonlyArray<string> = [
    '999.999.999.999',
    'not-an-ip',
    '192.168.1',
    '192.168.1.1.1',
    'abc.def.ghi.jkl',
    '192.168.1.256',
    '',
  ]

  it.each(invalidIps)('rejects: %s', (value) => {
    const result = schema.safeParse(value)
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// VERSION FILTERING
// ----------------------------------------------------------

describe('ipAddress (version filtering)', () => {
  it('v4 accepts IPv4', () => {
    const schema = IpAddress({ version: 'v4' }) as z.ZodType
    expect(schema.safeParse('192.168.1.1').success).toBe(true)
  })

  it('v4 rejects IPv6', () => {
    const schema = IpAddress({ version: 'v4' }) as z.ZodType
    expect(schema.safeParse('::1').success).toBe(false)
  })

  it('v6 accepts IPv6', () => {
    const schema = IpAddress({ version: 'v6' }) as z.ZodType
    expect(schema.safeParse('::1').success).toBe(true)
  })

  it('v6 rejects IPv4', () => {
    const schema = IpAddress({ version: 'v6' }) as z.ZodType
    expect(schema.safeParse('192.168.1.1').success).toBe(false)
  })

  it('any accepts both IPv4 and IPv6', () => {
    const schema = IpAddress({ version: 'any' }) as z.ZodType
    expect(schema.safeParse('192.168.1.1').success).toBe(true)
    expect(schema.safeParse('::1').success).toBe(true)
  })
})

// ----------------------------------------------------------
// CIDR NOTATION
// ----------------------------------------------------------

describe('ipAddress (CIDR)', () => {
  it('rejects CIDR when allowCidr is false (default)', () => {
    const schema = IpAddress() as z.ZodType
    expect(schema.safeParse('192.168.0.0/24').success).toBe(false)
  })

  it('accepts IPv4 CIDR when allowCidr is true', () => {
    const schema = IpAddress({ allowCidr: true }) as z.ZodType
    expect(schema.safeParse('192.168.0.0/24').success).toBe(true)
  })

  it('accepts IPv6 CIDR when allowCidr is true', () => {
    const schema = IpAddress({ allowCidr: true }) as z.ZodType
    expect(schema.safeParse('2001:db8::/32').success).toBe(true)
  })

  it('rejects plain IP when allowCidr is true (CIDR required)', () => {
    const schema = IpAddress({ allowCidr: true }) as z.ZodType
    expect(schema.safeParse('192.168.1.1').success).toBe(false)
  })
})

// ----------------------------------------------------------
// PRIVATE RANGE RESTRICTION
// ----------------------------------------------------------

describe('ipAddress (allowPrivate)', () => {
  it('accepts private IPv4 by default', () => {
    const schema = IpAddress({ version: 'v4' }) as z.ZodType
    expect(schema.safeParse('192.168.1.1').success).toBe(true)
  })

  it('rejects private IPv4 when allowPrivate is false', () => {
    const schema = IpAddress({ version: 'v4', allowPrivate: false }) as z.ZodType
    const privateIps: ReadonlyArray<string> = [
      '10.0.0.1',
      '172.16.0.1',
      '192.168.1.1',
      '127.0.0.1',
    ]
    for (const ip of privateIps) {
      expect(schema.safeParse(ip).success).toBe(false)
    }
  })

  it('accepts public IPv4 when allowPrivate is false', () => {
    const schema = IpAddress({ version: 'v4', allowPrivate: false }) as z.ZodType
    expect(schema.safeParse('8.8.8.8').success).toBe(true)
    expect(schema.safeParse('1.1.1.1').success).toBe(true)
  })

  it('rejects private IPv6 when allowPrivate is false', () => {
    const schema = IpAddress({ version: 'v6', allowPrivate: false }) as z.ZodType
    expect(schema.safeParse('::1').success).toBe(false)
    expect(schema.safeParse('fe80::1').success).toBe(false)
  })

  it('accepts public IPv6 when allowPrivate is false', () => {
    const schema = IpAddress({ version: 'v6', allowPrivate: false }) as z.ZodType
    expect(schema.safeParse('2001:db8::1').success).toBe(true)
  })
})

// ----------------------------------------------------------
// NORMALIZATION
// ----------------------------------------------------------

describe('ipAddress (normalization)', () => {
  it('trims whitespace', () => {
    const schema = IpAddress() as z.ZodType
    const result = schema.safeParse('  8.8.8.8  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('8.8.8.8')
    }
  })
})

// ----------------------------------------------------------
// SECURITY
// ----------------------------------------------------------

describe('ipAddress (security)', () => {
  const schema = IpAddress() as z.ZodType

  const payloads: ReadonlyArray<string> = [
    '<script>alert("xss")</script>',
    '\'; DROP TABLE users; --',
    '192.168.1.1\x00injected',
    '../../../etc/passwd',
    // eslint-disable-next-line no-template-curly-in-string -- REASON: XSS/injection test payload contains template literal syntax
    '${7*7}',
    '{{constructor.constructor("return this")()}}',
    '0x7f000001',
    '2130706433',
  ]

  it.each(payloads)('rejects payload: %s', (value) => {
    const result = schema.safeParse(value)
    expect(result.success).toBe(false)
  })
})

describe('ipAddress — edge cases', () => {
  it('rejects 0.0.0.0 as private IPv4', () => {
    const schema = IpAddress({ version: 'v4', allowPrivate: false }) as z.ZodType
    expect(schema.safeParse('0.0.0.0').success).toBe(false)
  })

  it('rejects fc00::1 as private IPv6 (unique local address)', () => {
    const schema = IpAddress({ version: 'v6', allowPrivate: false }) as z.ZodType
    expect(schema.safeParse('fc00::1').success).toBe(false)
  })

  it('rejects :: as private IPv6 (unspecified address)', () => {
    const schema = IpAddress({ version: 'v6', allowPrivate: false }) as z.ZodType
    expect(schema.safeParse('::').success).toBe(false)
  })

  it('rejects private IPv4 with version any', () => {
    const schema = IpAddress({ version: 'any', allowPrivate: false }) as z.ZodType
    expect(schema.safeParse('10.0.0.1').success).toBe(false)
  })

  it('rejects private IPv6 with version any', () => {
    const schema = IpAddress({ version: 'any', allowPrivate: false }) as z.ZodType
    expect(schema.safeParse('::1').success).toBe(false)
  })

  it('accepts valid IPv6 with CIDR notation when allowCidr is true', () => {
    const schema = IpAddress({ version: 'v6', allowCidr: true }) as z.ZodType
    expect(schema.safeParse('2001:db8::/32').success).toBe(true)
  })

  it('rejects IPv6 CIDR when allowCidr is false', () => {
    const schema = IpAddress({ version: 'v6', allowCidr: false }) as z.ZodType
    expect(schema.safeParse('2001:db8::/32').success).toBe(false)
  })

  it('preserves whitespace for IPv6 when normalize is false', () => {
    const schema = IpAddress({ version: 'v6', normalize: false }) as z.ZodType
    expect(schema.safeParse(' 2001:db8::1 ').success).toBe(false)
    expect(schema.safeParse('2001:db8::1').success).toBe(true)
  })

  it('accepts any version with CIDR notation when allowCidr is true', () => {
    const schema = IpAddress({ version: 'any', allowCidr: true }) as z.ZodType
    expect(schema.safeParse('192.168.1.0/24').success).toBe(true)
    expect(schema.safeParse('2001:db8::/32').success).toBe(true)
  })

  it('preserves whitespace for any version when normalize is false', () => {
    const schema = IpAddress({ version: 'any', normalize: false }) as z.ZodType
    expect(schema.safeParse(' 192.168.1.1 ').success).toBe(false)
    expect(schema.safeParse('192.168.1.1').success).toBe(true)
  })

  it('uses default version "any" when version is cleared', () => {
    const schema = IpAddress({ version: undefined }) as z.ZodType
    // Should accept both v4 and v6
    expect(schema.safeParse('192.168.1.1').success).toBe(true)
    expect(schema.safeParse('2001:db8::1').success).toBe(true)
  })

  it('accepts IPv4 with CIDR notation when allowCidr is true', () => {
    const schema = IpAddress({ version: 'v4', allowCidr: true }) as z.ZodType
    expect(schema.safeParse('192.168.1.0/24').success).toBe(true)
  })

  it('preserves whitespace for IPv4 when normalize is false', () => {
    const schema = IpAddress({ version: 'v4', normalize: false }) as z.ZodType
    expect(schema.safeParse(' 192.168.1.1 ').success).toBe(false)
    expect(schema.safeParse('192.168.1.1').success).toBe(true)
  })
})
