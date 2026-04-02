// ==============================================================================
// URL RULE TESTS
// Validates URL parsing, protocol filtering, TLD requirements, auth handling,
// domain filtering, and security vector rejection.
// ==============================================================================

import type { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { getParams } from '../../src/core/getParams'
import { Url } from '../../src/rules/url'
import { testRuleContract } from '../helpers/testRule'

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

function getErrorCodes(schema: z.ZodType, value: unknown): ReadonlyArray<string> {
  const result = schema.safeParse(value)
  if (result.success)
    return []
  return result.error.issues.map((issue) => {
    const params = getParams(issue as Parameters<typeof getParams>[0])
    return params.code
  })
}

// ----------------------------------------------------------
// CONTRACT TESTS
// ----------------------------------------------------------

testRuleContract('url', Url as (opts?: Record<string, unknown>) => unknown, 'url')

// ----------------------------------------------------------
// VALID URLS
// ----------------------------------------------------------

describe('url (valid)', () => {
  const schema = Url() as z.ZodType

  const validUrls: ReadonlyArray<string> = [
    'https://example.com',
    'http://example.com',
    'https://example.com/path',
    'https://example.com/path/to/resource',
    'https://example.com?q=search',
    'https://example.com/path?q=search&page=2',
    'https://sub.example.com',
    'https://www.example.com',
    'https://example.co.uk',
    'http://example.org/path#fragment',
    'https://example.com:8080',
    'https://example.com:443/path',
  ]

  it.each(validUrls)('accepts: %s', (value) => {
    const result = schema.safeParse(value)
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// INVALID URLS
// ----------------------------------------------------------

describe('url (invalid)', () => {
  const schema = Url() as z.ZodType

  const invalidUrls: ReadonlyArray<string> = [
    'not-a-url',
    'example.com',
    'just some text',
    '://missing-protocol.com',
    '',
  ]

  it.each(invalidUrls)('rejects: %s', (value) => {
    const result = schema.safeParse(value)
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// PROTOCOL FILTERING
// ----------------------------------------------------------

describe('url (protocols)', () => {
  it('rejects ftp by default', () => {
    const schema = Url() as z.ZodType
    const result = schema.safeParse('ftp://files.example.com')
    expect(result.success).toBe(false)
  })

  it('accepts ftp when explicitly allowed', () => {
    const schema = Url({ protocols: ['ftp'] }) as z.ZodType
    const result = schema.safeParse('ftp://files.example.com')
    expect(result.success).toBe(true)
  })

  it('rejects https when only ftp is allowed', () => {
    const schema = Url({ protocols: ['ftp'] }) as z.ZodType
    const result = schema.safeParse('https://example.com')
    expect(result.success).toBe(false)
  })

  it('accepts multiple allowed protocols', () => {
    const schema = Url({ protocols: ['http', 'https', 'ftp'] }) as z.ZodType
    expect(schema.safeParse('http://example.com').success).toBe(true)
    expect(schema.safeParse('https://example.com').success).toBe(true)
    expect(schema.safeParse('ftp://files.example.com').success).toBe(true)
  })
})

// ----------------------------------------------------------
// REQUIRE TLD
// ----------------------------------------------------------

describe('url (requireTLD)', () => {
  it('rejects URL without TLD by default', () => {
    const schema = Url() as z.ZodType
    const result = schema.safeParse('http://localhost')
    expect(result.success).toBe(false)
  })

  it('accepts URL without TLD when requireTLD: false', () => {
    const schema = Url({ requireTLD: false }) as z.ZodType
    const result = schema.safeParse('http://localhost')
    expect(result.success).toBe(true)
  })

  it('accepts URL with port but no TLD when requireTLD: false', () => {
    const schema = Url({ requireTLD: false }) as z.ZodType
    const result = schema.safeParse('http://localhost:3000')
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// ALLOW AUTH
// ----------------------------------------------------------

describe('url (allowAuth)', () => {
  it('rejects userinfo by default', () => {
    const schema = Url() as z.ZodType
    const result = schema.safeParse('http://user:pass@host.com')
    expect(result.success).toBe(false)
  })

  it('accepts userinfo when allowAuth: true', () => {
    const schema = Url({ allowAuth: true, requireTLD: false }) as z.ZodType
    const result = schema.safeParse('http://user:pass@host.com')
    expect(result.success).toBe(true)
  })

  it('rejects username-only auth by default', () => {
    const schema = Url() as z.ZodType
    const result = schema.safeParse('http://admin@host.com')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// ALLOW QUERY
// ----------------------------------------------------------

describe('url (allowQuery: false)', () => {
  const schema = Url({ allowQuery: false }) as z.ZodType

  it('accepts URL without query', () => {
    const result = schema.safeParse('https://example.com/path')
    expect(result.success).toBe(true)
  })

  it('rejects URL with query string', () => {
    const result = schema.safeParse('https://example.com?q=1')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// DOMAIN FILTERING
// ----------------------------------------------------------

describe('url (blockDomains)', () => {
  const schema = Url({ blockDomains: ['evil.com'] }) as z.ZodType

  it('rejects blocked domain', () => {
    const result = schema.safeParse('https://evil.com')
    expect(result.success).toBe(false)
  })

  it('rejects subdomain of blocked domain', () => {
    const result = schema.safeParse('https://sub.evil.com')
    expect(result.success).toBe(false)
  })

  it('accepts non-blocked domain', () => {
    const result = schema.safeParse('https://good.com')
    expect(result.success).toBe(true)
  })
})

describe('url (allowDomains)', () => {
  const schema = Url({ allowDomains: ['example.com'] }) as z.ZodType

  it('accepts allowed domain', () => {
    const result = schema.safeParse('https://example.com')
    expect(result.success).toBe(true)
  })

  it('rejects domain not in allowed list', () => {
    const result = schema.safeParse('https://other.com')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// LENGTH CONSTRAINTS
// ----------------------------------------------------------

describe('url (length)', () => {
  it('accepts URL within min length', () => {
    const schema = Url({ length: { min: 15 } }) as z.ZodType
    expect(schema.safeParse('https://example.com').success).toBe(true)
  })

  it('accepts URL within min and max range', () => {
    const schema = Url({ length: { min: 10, max: 100 } }) as z.ZodType
    expect(schema.safeParse('https://example.com').success).toBe(true)
  })

  it('accepts URL with query string within generous max', () => {
    const schema = Url({ length: { max: 2048 } }) as z.ZodType
    expect(schema.safeParse('https://example.com/path?query=value&foo=bar').success).toBe(true)
  })

  it('rejects URL shorter than min length with min error code', () => {
    const schema = Url({ length: { min: 30 } }) as z.ZodType
    expect(schema.safeParse('https://a.co').success).toBe(false)
    expect(getErrorCodes(schema, 'https://a.co')).toContain('min')
  })

  it('rejects URL longer than max length with max error code', () => {
    const schema = Url({ length: { max: 15 } }) as z.ZodType
    expect(schema.safeParse('https://example.com').success).toBe(false)
    expect(getErrorCodes(schema, 'https://example.com')).toContain('max')
  })

  it('rejects URL exceeding tight max with max error code', () => {
    const schema = Url({ length: { max: 10 } }) as z.ZodType
    expect(schema.safeParse('https://example.com').success).toBe(false)
    expect(getErrorCodes(schema, 'https://example.com')).toContain('max')
  })
})

// ----------------------------------------------------------
// NORMALIZATION
// ----------------------------------------------------------

describe('url (normalization)', () => {
  it('trims whitespace', () => {
    const schema = Url() as z.ZodType
    const result = schema.safeParse('  https://example.com  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('https://example.com')
    }
  })
})

// ----------------------------------------------------------
// SECURITY
// ----------------------------------------------------------

describe('url (security)', () => {
  const schema = Url() as z.ZodType

  const payloads: ReadonlyArray<string> = [
    '<script>alert("xss")</script>',
    '\'; DROP TABLE users; --',
    'javascript:alert(1)',
    '../../../etc/passwd',
    // eslint-disable-next-line no-template-curly-in-string -- REASON: XSS/injection test payload contains template literal syntax
    '${7*7}',
    '{{constructor.constructor("return this")()}}',
    'data:text/html,<script>alert(1)</script>',
    'file:///etc/passwd',
  ]

  it.each(payloads)('rejects payload: %s', (value) => {
    const result = schema.safeParse(value)
    expect(result.success).toBe(false)
  })
})

describe('url — edge cases', () => {
  it('preserves original URL casing when normalize is false', async () => {
    const schema = Url({ normalize: false }) as z.ZodType
    const result = await schema.safeParseAsync('https://Example.COM/Path')
    expect(result.success).toBe(true)
    if (result.success)
      expect(result.data).toBe('https://Example.COM/Path')
  })
})
