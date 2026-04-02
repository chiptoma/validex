// ==============================================================================
// WEBSITE RULE TESTS
// Validates website URL parsing, domain filtering, protocol enforcement, and
// security vector rejection.
// ==============================================================================

import type { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { getParams } from '../../src/core/getParams'
import { Website } from '../../src/rules/website'
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

testRuleContract('website', Website as (opts?: Record<string, unknown>) => unknown, 'website')

// ----------------------------------------------------------
// VALID WEBSITES
// ----------------------------------------------------------

describe('website (valid)', () => {
  const schema = Website() as z.ZodType

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
  const schema = Website() as z.ZodType

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

// ----------------------------------------------------------
// LENGTH CONSTRAINTS
// ----------------------------------------------------------

describe('website (length)', () => {
  it('accepts URL within min length', () => {
    const schema = Website({ length: { min: 15 } }) as z.ZodType
    expect(schema.safeParse('https://example.com').success).toBe(true)
  })

  it('accepts URL within min and max range', () => {
    const schema = Website({ length: { min: 10, max: 100 } }) as z.ZodType
    expect(schema.safeParse('https://example.com').success).toBe(true)
  })

  it('accepts long URL within generous max', () => {
    const schema = Website({ length: { max: 255 } }) as z.ZodType
    expect(schema.safeParse('https://example.com/some/long/path/here').success).toBe(true)
  })

  it('rejects URL shorter than min length with min error code', () => {
    const schema = Website({ length: { min: 30 } }) as z.ZodType
    expect(schema.safeParse('https://a.co').success).toBe(false)
    expect(getErrorCodes(schema, 'https://a.co')).toContain('min')
  })

  it('rejects URL longer than max length with max error code', () => {
    const schema = Website({ length: { max: 15 } }) as z.ZodType
    expect(schema.safeParse('https://example.com').success).toBe(false)
    expect(getErrorCodes(schema, 'https://example.com')).toContain('max')
  })

  it('rejects URL exceeding tight max with max error code', () => {
    const schema = Website({ length: { max: 10 } }) as z.ZodType
    expect(schema.safeParse('https://example.com').success).toBe(false)
    expect(getErrorCodes(schema, 'https://example.com')).toContain('max')
  })
})

// ----------------------------------------------------------
// NORMALIZATION
// ----------------------------------------------------------

describe('website (normalization)', () => {
  it('auto-prepends https:// to bare domains', () => {
    const schema = Website() as z.ZodType
    const result = schema.safeParse('example.com')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('https://example.com')
    }
  })

  it('lowercases the URL', () => {
    const schema = Website() as z.ZodType
    const result = schema.safeParse('HTTPS://EXAMPLE.COM')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('https://example.com')
    }
  })

  it('trims whitespace', () => {
    const schema = Website() as z.ZodType
    const result = schema.safeParse('  https://example.com  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('https://example.com')
    }
  })
})

// ----------------------------------------------------------
// NORMALIZE FALSE
// ----------------------------------------------------------

describe('website (normalize: false)', () => {
  it('does not auto-prepend protocol to bare domains', () => {
    const schema = Website({ normalize: false }) as z.ZodType
    const result = schema.safeParse('example.com')
    expect(result.success).toBe(false)
  })

  it('preserves original case', () => {
    const schema = Website({ normalize: false }) as z.ZodType
    const result = schema.safeParse('https://EXAMPLE.COM')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('https://EXAMPLE.COM')
    }
  })
})

// ----------------------------------------------------------
// REQUIRE HTTPS
// ----------------------------------------------------------

describe('website (requireHttps)', () => {
  const schema = Website({ requireHttps: true }) as z.ZodType

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
  const schema = Website({ requireWww: true }) as z.ZodType

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
  const schema = Website({ allowPath: false }) as z.ZodType

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
    const schema = Website() as z.ZodType
    const result = schema.safeParse('https://example.com?q=1')
    expect(result.success).toBe(false)
  })

  it('accepts query string when allowQuery: true', () => {
    const schema = Website({ allowQuery: true }) as z.ZodType
    const result = schema.safeParse('https://example.com?q=1')
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// DOMAIN FILTERING
// ----------------------------------------------------------

describe('website (blockDomains)', () => {
  const schema = Website({ blockDomains: ['evil.com'] }) as z.ZodType

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
  const schema = Website({ allowDomains: ['example.com'] }) as z.ZodType

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
  const schema = Website({ allowSubdomains: false }) as z.ZodType

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
  const schema = Website() as z.ZodType

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

describe('website — edge cases', () => {
  it('preserves case when normalize is false', async () => {
    const schema = Website({ normalize: false }) as z.ZodType
    const result = await schema.safeParseAsync('HTTPS://EXAMPLE.COM')
    expect(result.success).toBe(true)
    if (result.success)
      expect(result.data).toBe('HTTPS://EXAMPLE.COM')
  })

  it('uses default max 255 when length is cleared', async () => {
    // Clearing length triggers range?.max ?? 255 fallback
    const schema = Website({ length: undefined }) as z.ZodType
    const result = await schema.safeParseAsync('https://example.com')
    expect(result.success).toBe(true)
  })

  it('uses empty domain lists when blockDomains and allowDomains are cleared', async () => {
    // Clearing domain lists triggers ?? [] fallback
    const schema = Website({ blockDomains: undefined, allowDomains: undefined }) as z.ZodType
    const result = await schema.safeParseAsync('https://example.com')
    expect(result.success).toBe(true)
  })
})
