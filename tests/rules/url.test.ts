// ==============================================================================
// URL RULE TESTS
// Validates URL parsing, protocol filtering, TLD requirements, auth handling,
// domain filtering, and security vector rejection.
// ==============================================================================

import type { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { url } from '../../src/rules/url'
import { testRuleContract } from '../helpers/testRule'

// ----------------------------------------------------------
// CONTRACT TESTS
// ----------------------------------------------------------

testRuleContract('url', url as (opts?: Record<string, unknown>) => unknown, 'url')

// ----------------------------------------------------------
// VALID URLS
// ----------------------------------------------------------

describe('url (valid)', () => {
  const schema = url() as z.ZodType

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
  const schema = url() as z.ZodType

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
    const schema = url() as z.ZodType
    const result = schema.safeParse('ftp://files.example.com')
    expect(result.success).toBe(false)
  })

  it('accepts ftp when explicitly allowed', () => {
    const schema = url({ protocols: ['ftp'] }) as z.ZodType
    const result = schema.safeParse('ftp://files.example.com')
    expect(result.success).toBe(true)
  })

  it('rejects https when only ftp is allowed', () => {
    const schema = url({ protocols: ['ftp'] }) as z.ZodType
    const result = schema.safeParse('https://example.com')
    expect(result.success).toBe(false)
  })

  it('accepts multiple allowed protocols', () => {
    const schema = url({ protocols: ['http', 'https', 'ftp'] }) as z.ZodType
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
    const schema = url() as z.ZodType
    const result = schema.safeParse('http://localhost')
    expect(result.success).toBe(false)
  })

  it('accepts URL without TLD when requireTLD: false', () => {
    const schema = url({ requireTLD: false }) as z.ZodType
    const result = schema.safeParse('http://localhost')
    expect(result.success).toBe(true)
  })

  it('accepts URL with port but no TLD when requireTLD: false', () => {
    const schema = url({ requireTLD: false }) as z.ZodType
    const result = schema.safeParse('http://localhost:3000')
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// ALLOW AUTH
// ----------------------------------------------------------

describe('url (allowAuth)', () => {
  it('rejects userinfo by default', () => {
    const schema = url() as z.ZodType
    const result = schema.safeParse('http://user:pass@host.com')
    expect(result.success).toBe(false)
  })

  it('accepts userinfo when allowAuth: true', () => {
    const schema = url({ allowAuth: true, requireTLD: false }) as z.ZodType
    const result = schema.safeParse('http://user:pass@host.com')
    expect(result.success).toBe(true)
  })

  it('rejects username-only auth by default', () => {
    const schema = url() as z.ZodType
    const result = schema.safeParse('http://admin@host.com')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// ALLOW QUERY
// ----------------------------------------------------------

describe('url (allowQuery: false)', () => {
  const schema = url({ allowQuery: false }) as z.ZodType

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
  const schema = url({ blockDomains: ['evil.com'] }) as z.ZodType

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
  const schema = url({ allowDomains: ['example.com'] }) as z.ZodType

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
// NORMALIZATION
// ----------------------------------------------------------

describe('url (normalization)', () => {
  it('trims whitespace', () => {
    const schema = url() as z.ZodType
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
  const schema = url() as z.ZodType

  const payloads: ReadonlyArray<string> = [
    '<script>alert("xss")</script>',
    '\'; DROP TABLE users; --',
    'javascript:alert(1)',
    '../../../etc/passwd',
    // eslint-disable-next-line no-template-curly-in-string
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
