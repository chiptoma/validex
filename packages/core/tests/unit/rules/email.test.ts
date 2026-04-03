// ==============================================================================
// EMAIL RULE TESTS
// Validates email parsing, domain filtering, plus alias blocking,
// disposable detection, normalization, and security vectors.
// ==============================================================================

import type { z } from 'zod'

import { describe, expect, it } from 'vitest'

import { getParams } from '@core/getParams'
import { Email } from '@rules/email'

import { testRuleContract } from '../../_support/helpers/testRule'

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Parse
 * Runs safeParse on the given schema and value.
 *
 * @param schema - The Zod schema (from rule factory).
 * @param value  - The value to parse.
 * @returns The safe parse result.
 */
function parse(schema: unknown, value: unknown): { success: boolean, data?: unknown, error?: unknown } {
  return (schema as z.ZodType).safeParse(value)
}

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

/**
 * Get Error Codes
 * Extracts all error codes from a failed parse result.
 *
 * @param schema - The Zod schema (from rule factory).
 * @param value  - The value to parse.
 * @returns Array of error code strings.
 */
function getErrorCodes(schema: unknown, value: unknown): ReadonlyArray<string> {
  const result = (schema as z.ZodType).safeParse(value)
  if (result.success)
    return []
  return result.error.issues.map((issue) => {
    const params = getParams(issue as Parameters<typeof getParams>[0])
    return params.code
  })
}

/**
 * Get Async Error Codes
 * Extracts all error codes from a failed async parse result.
 *
 * @param schema - The Zod schema (from rule factory).
 * @param value  - The value to parse.
 * @returns Array of error code strings.
 */
async function getAsyncErrorCodes(schema: unknown, value: unknown): Promise<ReadonlyArray<string>> {
  const result = await (schema as z.ZodType).safeParseAsync(value)
  if (result.success)
    return []
  return result.error.issues.map((issue) => {
    const params = getParams(issue as Parameters<typeof getParams>[0])
    return params.code
  })
}

// ----------------------------------------------------------
// CONTRACT
// ----------------------------------------------------------

testRuleContract(
  'email',
  Email as (opts?: Record<string, unknown>) => unknown,
  'email',
)

// ----------------------------------------------------------
// VALID EMAILS
// ----------------------------------------------------------

describe('email (valid)', () => {
  const schema = Email()

  it.each([
    'user@example.com',
    'user+tag@gmail.com',
    'user@sub.domain.co.uk',
    'very.common@example.org',
    'test@test.com',
    'name.surname@domain.com',
    'user@domain.co',
    'user123@example.com',
    'a@b.cc',
    'first.last@example.com',
    'disposable.style+email@example.com',
  ])('accepts: %s', (value) => {
    expect(parse(schema, value).success).toBe(true)
  })
})

// ----------------------------------------------------------
// INVALID EMAILS
// ----------------------------------------------------------

describe('email (invalid)', () => {
  const schema = Email()

  it.each([
    'not-an-email',
    '@domain.com',
    'user@',
    'user @example.com',
    'user@.com',
    'user@com',
    '@',
    'user@@domain.com',
    '.user@domain.com',
    'user.@domain.com',
    'user@domain..com',
  ])('rejects: %s', (value) => {
    expect(parse(schema, value).success).toBe(false)
  })

  it('rejects empty string', () => {
    expect(parse(schema, '').success).toBe(false)
  })
})

// ----------------------------------------------------------
// NORMALIZATION
// ----------------------------------------------------------

describe('email (normalization)', () => {
  it('normalizes uppercase to lowercase', () => {
    const schema = Email()
    const result = parse(schema, 'USER@EXAMPLE.COM')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('user@example.com')
    }
  })

  it('trims whitespace', () => {
    const schema = Email()
    const result = parse(schema, '  user@example.com  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('user@example.com')
    }
  })

  it('preserves original case when normalize is false', () => {
    const schema = Email({ normalize: false })
    const result = parse(schema, 'User@Example.COM')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('User@Example.COM')
    }
  })
})

// ----------------------------------------------------------
// BLOCK PLUS ALIAS
// ----------------------------------------------------------

describe('email (blockPlusAlias)', () => {
  const schema = Email({ blockPlusAlias: true })

  it('rejects plus alias when blocked', () => {
    const result = parse(schema, 'user+tag@gmail.com')
    expect(result.success).toBe(false)
    expect(getErrorCodes(schema, 'user+tag@gmail.com')).toContain('plusAliasBlocked')
  })

  it('accepts regular email when blockPlusAlias is true', () => {
    expect(parse(schema, 'user@gmail.com').success).toBe(true)
  })
})

// ----------------------------------------------------------
// LENGTH CONSTRAINTS
// ----------------------------------------------------------

describe('email (length)', () => {
  it('accepts email within min length', () => {
    const schema = Email({ length: { min: 10 } })
    expect(parse(schema, 'user@example.com').success).toBe(true)
  })

  it('accepts email within min and max length', () => {
    const schema = Email({ length: { min: 5, max: 30 } })
    expect(parse(schema, 'a@b.cc').success).toBe(true)
  })

  it('accepts email at exactly max length boundary', () => {
    const schema = Email({ length: { max: 16 } })
    expect(parse(schema, 'user@example.com').success).toBe(true)
  })

  it('rejects email shorter than min length with min error code', () => {
    const schema = Email({ length: { min: 10 } })
    expect(parse(schema, 'a@b.cc').success).toBe(false)
    expect(getErrorCodes(schema, 'a@b.cc')).toContain('min')
  })

  it('rejects email longer than max length with max error code', () => {
    const schema = Email({ length: { max: 10 } })
    expect(parse(schema, 'user@example.com').success).toBe(false)
    expect(getErrorCodes(schema, 'user@example.com')).toContain('max')
  })

  it('rejects email far below min length with min error code', () => {
    const schema = Email({ length: { min: 50 } })
    expect(parse(schema, 'user@example.com').success).toBe(false)
    expect(getErrorCodes(schema, 'user@example.com')).toContain('min')
  })
})

// ----------------------------------------------------------
// ALLOW DOMAINS
// ----------------------------------------------------------

describe('email (allowDomains)', () => {
  const schema = Email({ allowDomains: ['example.com', 'test.org'] })

  it('accepts email with allowed domain', () => {
    expect(parse(schema, 'user@example.com').success).toBe(true)
  })

  it('accepts email with second allowed domain', () => {
    expect(parse(schema, 'user@test.org').success).toBe(true)
  })

  it('rejects email with non-allowed domain', () => {
    const result = parse(schema, 'user@other.com')
    expect(result.success).toBe(false)
    expect(getErrorCodes(schema, 'user@other.com')).toContain('domainNotAllowed')
  })
})

// ----------------------------------------------------------
// BLOCK DOMAINS
// ----------------------------------------------------------

describe('email (blockDomains)', () => {
  const schema = Email({ blockDomains: ['evil.com', 'spam.net'] })

  it('rejects email with blocked domain', () => {
    const result = parse(schema, 'user@evil.com')
    expect(result.success).toBe(false)
    expect(getErrorCodes(schema, 'user@evil.com')).toContain('domainBlocked')
  })

  it('accepts email with non-blocked domain', () => {
    expect(parse(schema, 'user@example.com').success).toBe(true)
  })
})

// ----------------------------------------------------------
// SUBDOMAIN BLOCKING
// ----------------------------------------------------------

describe('email (allowSubdomains)', () => {
  const schema = Email({ allowSubdomains: false })

  it('rejects subdomain email when subdomains not allowed', () => {
    const result = parse(schema, 'user@sub.domain.com')
    expect(result.success).toBe(false)
    expect(getErrorCodes(schema, 'user@sub.domain.com')).toContain('subdomainNotAllowed')
  })

  it('accepts single-level domain when subdomains not allowed', () => {
    expect(parse(schema, 'user@domain.com').success).toBe(true)
  })
})

// ----------------------------------------------------------
// BLOCK DISPOSABLE (ASYNC)
// ----------------------------------------------------------

describe('email (blockDisposable)', () => {
  const schema = Email({ blockDisposable: true })

  it('rejects known disposable email domain', async () => {
    const result = await parseAsync(schema, 'user@mailinator.com')
    expect(result.success).toBe(false)
    const codes = await getAsyncErrorCodes(schema, 'user@mailinator.com')
    expect(codes).toContain('disposableBlocked')
  })

  it('accepts non-disposable email domain', async () => {
    const result = await parseAsync(schema, 'user@gmail.com')
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// SECURITY VECTORS
// ----------------------------------------------------------

describe('email (security)', () => {
  const schema = Email()

  it.each([
    '<script>alert("xss")</script>@evil.com',
    'user@domain.com\'; DROP TABLE users; --',
    'user@domain.com\x00injected',
    '../../../etc/passwd@domain.com',
    // eslint-disable-next-line no-template-curly-in-string -- REASON: XSS/injection test payload contains template literal syntax
    '${7*7}@domain.com',
    '{{constructor.constructor("return this")()}}@domain.com',
    `${'a'.repeat(255)}@domain.com`,
    'user\n@domain.com',
    'user\r@domain.com',
    'user\t@domain.com',
  ])('rejects payload: %s', (value) => {
    const result = parse(schema, value)
    expect(result.success).toBe(false)
  })
})
