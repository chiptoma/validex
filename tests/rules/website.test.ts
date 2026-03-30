// ==============================================================================
// WEBSITE RULE TESTS
// Validates website URL parsing, domain filtering, protocol enforcement, and
// security vector rejection.
// ==============================================================================

import type { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { website } from '../../src/rules/website'
import { testRuleContract } from '../helpers/testRule'

// ----------------------------------------------------------
// CONTRACT TESTS
// ----------------------------------------------------------

testRuleContract('website', website as (opts?: Record<string, unknown>) => unknown, 'website')

// ----------------------------------------------------------
// VALID WEBSITES
// ----------------------------------------------------------

describe('website (valid)', () => {
  const schema = website() as z.ZodType

  const validWebsites: ReadonlyArray<string> = [
    'https://example.com',
    'http://example.com',
    'example.com',
    'www.example.com',
    'https://www.example.com',
    'https://example.com/path',
    'https://example.com/path/to/page',
    'https://sub.example.com',
    'https://deep.sub.example.com',
    'http://www.example.org',
    'HTTPS://EXAMPLE.COM',
    '  https://example.com  ',
  ]

  it.each(validWebsites)('accepts: %s', (value) => {
    const result = schema.safeParse(value)
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// INVALID WEBSITES
// ----------------------------------------------------------

describe('website (invalid)', () => {
  const schema = website() as z.ZodType

  const invalidWebsites: ReadonlyArray<string> = [
    'ftp://example.com',
    'not a url',
    'javascript:alert(1)',
    'data:text/html,<h1>hi</h1>',
    'mailto:test@example.com',
  ]

  it.each(invalidWebsites)('rejects: %s', (value) => {
    const result = schema.safeParse(value)
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// NORMALIZATION
// ----------------------------------------------------------

describe('website (normalization)', () => {
  it('auto-prepends https:// to bare domains', () => {
    const schema = website() as z.ZodType
    const result = schema.safeParse('example.com')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('https://example.com')
    }
  })

  it('lowercases the URL', () => {
    const schema = website() as z.ZodType
    const result = schema.safeParse('HTTPS://EXAMPLE.COM')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('https://example.com')
    }
  })

  it('trims whitespace', () => {
    const schema = website() as z.ZodType
    const result = schema.safeParse('  https://example.com  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('https://example.com')
    }
  })
})

// ----------------------------------------------------------
// REQUIRE HTTPS
// ----------------------------------------------------------

describe('website (requireHttps)', () => {
  const schema = website({ requireHttps: true }) as z.ZodType

  it('accepts https URL', () => {
    const result = schema.safeParse('https://example.com')
    expect(result.success).toBe(true)
  })

  it('rejects http URL', () => {
    const result = schema.safeParse('http://example.com')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// REQUIRE WWW
// ----------------------------------------------------------

describe('website (requireWww)', () => {
  const schema = website({ requireWww: true }) as z.ZodType

  it('accepts URL with www prefix', () => {
    const result = schema.safeParse('https://www.example.com')
    expect(result.success).toBe(true)
  })

  it('rejects URL without www prefix', () => {
    const result = schema.safeParse('https://example.com')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// ALLOW PATH
// ----------------------------------------------------------

describe('website (allowPath: false)', () => {
  const schema = website({ allowPath: false }) as z.ZodType

  it('accepts URL without path', () => {
    const result = schema.safeParse('https://example.com')
    expect(result.success).toBe(true)
  })

  it('rejects URL with path', () => {
    const result = schema.safeParse('https://example.com/page')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// ALLOW QUERY
// ----------------------------------------------------------

describe('website (allowQuery)', () => {
  it('rejects query string by default', () => {
    const schema = website() as z.ZodType
    const result = schema.safeParse('https://example.com?q=1')
    expect(result.success).toBe(false)
  })

  it('accepts query string when allowQuery: true', () => {
    const schema = website({ allowQuery: true }) as z.ZodType
    const result = schema.safeParse('https://example.com?q=1')
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// DOMAIN FILTERING
// ----------------------------------------------------------

describe('website (blockDomains)', () => {
  const schema = website({ blockDomains: ['evil.com'] }) as z.ZodType

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

describe('website (allowDomains)', () => {
  const schema = website({ allowDomains: ['example.com'] }) as z.ZodType

  it('accepts allowed domain', () => {
    const result = schema.safeParse('https://example.com')
    expect(result.success).toBe(true)
  })

  it('accepts subdomain of allowed domain', () => {
    const result = schema.safeParse('https://sub.example.com')
    expect(result.success).toBe(true)
  })

  it('rejects domain not in allowed list', () => {
    const result = schema.safeParse('https://other.com')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// ALLOW SUBDOMAINS
// ----------------------------------------------------------

describe('website (allowSubdomains: false)', () => {
  const schema = website({ allowSubdomains: false }) as z.ZodType

  it('accepts base domain', () => {
    const result = schema.safeParse('https://example.com')
    expect(result.success).toBe(true)
  })

  it('accepts www prefix (treated as base domain)', () => {
    const result = schema.safeParse('https://www.example.com')
    expect(result.success).toBe(true)
  })

  it('rejects subdomain URL', () => {
    const result = schema.safeParse('https://sub.example.com')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// SECURITY
// ----------------------------------------------------------

describe('website (security)', () => {
  const schema = website() as z.ZodType

  const payloads: ReadonlyArray<string> = [
    '<script>alert("xss")</script>',
    '\'; DROP TABLE users; --',
    'javascript:alert(1)',
    '{{constructor.constructor("return this")()}}',
    'data:text/html,<script>alert(1)</script>',
    'file:///etc/passwd',
    'ftp://example.com/malicious',
    'mailto:user@example.com',
  ]

  it.each(payloads)('rejects payload: %s', (value) => {
    const result = schema.safeParse(value)
    expect(result.success).toBe(false)
  })
})
