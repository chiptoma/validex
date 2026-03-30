// ==============================================================================
// JWT RULE TESTS
// Tests for JWT validation covering structure, expiry, not-before, required
// claims, algorithm filtering, and security vectors.
// ==============================================================================

import type { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { Jwt } from '../../src/rules/jwt'

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Create Test JWT
 * Builds a JWT string from header and payload objects for testing.
 * Signature is a dummy value since we only validate structure.
 *
 * @param header  - The JWT header object.
 * @param payload - The JWT payload object.
 * @returns A base64url-encoded JWT string.
 */
function createTestJwt(
  header: Record<string, unknown>,
  payload: Record<string, unknown>,
): string {
  const h = btoa(JSON.stringify(header))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  const p = btoa(JSON.stringify(payload))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
  return `${h}.${p}.signature`
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
 * Now Seconds
 * Returns the current Unix timestamp in seconds.
 *
 * @returns Current time as integer seconds since epoch.
 */
function nowSeconds(): number {
  return Math.floor(Date.now() / 1000)
}

// ----------------------------------------------------------
// VALID JWT STRUCTURE
// ----------------------------------------------------------

describe('jwt (valid)', () => {
  const schema = Jwt()

  it.each([
    createTestJwt({ alg: 'HS256', typ: 'JWT' }, { sub: '1234567890' }),
    createTestJwt({ alg: 'RS256', typ: 'JWT' }, { sub: 'user', iss: 'auth0' }),
    createTestJwt({ alg: 'HS384' }, { data: 'test' }),
    createTestJwt({ alg: 'HS512' }, { iat: nowSeconds() }),
    createTestJwt({ alg: 'ES256' }, { sub: 'a', aud: 'app' }),
    createTestJwt({ alg: 'PS256' }, { roles: ['admin'] }),
    createTestJwt({ alg: 'HS256' }, { exp: nowSeconds() + 3600, sub: 'u1' }),
    createTestJwt({ alg: 'HS256' }, { nbf: nowSeconds() - 60 }),
    createTestJwt({ alg: 'HS256' }, { iss: 'test', aud: 'api', sub: 'user' }),
    createTestJwt({ alg: 'RS512', typ: 'JWT' }, { scope: 'read write' }),
    createTestJwt({ alg: 'HS256' }, {}),
    createTestJwt({ alg: 'none' }, { sub: 'anon' }),
  ])('accepts valid JWT: %s', async (value) => {
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// INVALID JWT STRUCTURE
// ----------------------------------------------------------

describe('jwt (invalid structure)', () => {
  const schema = Jwt()

  it.each([
    'not.a.jwt',
    'only.two',
    'a.b.c.d',
    '',
    'random-string',
    '...',
    'header.payload',
    '   ',
    'abc',
    'null',
    '123.456.789',
  ])('rejects invalid JWT: %s', async (value) => {
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// CHECK EXPIRY
// ----------------------------------------------------------

describe('jwt (checkExpiry)', () => {
  it('rejects expired token', async () => {
    const schema = Jwt({ checkExpiry: true })
    const token = createTestJwt(
      { alg: 'HS256' },
      { exp: nowSeconds() - 3600 },
    )
    const result = await parseAsync(schema, token)
    expect(result.success).toBe(false)
  })

  it('accepts non-expired token', async () => {
    const schema = Jwt({ checkExpiry: true })
    const token = createTestJwt(
      { alg: 'HS256' },
      { exp: nowSeconds() + 3600 },
    )
    const result = await parseAsync(schema, token)
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// CHECK NOT BEFORE
// ----------------------------------------------------------

describe('jwt (checkNotBefore)', () => {
  it('rejects token with nbf in future', async () => {
    const schema = Jwt({ checkNotBefore: true })
    const token = createTestJwt(
      { alg: 'HS256' },
      { nbf: nowSeconds() + 3600 },
    )
    const result = await parseAsync(schema, token)
    expect(result.success).toBe(false)
  })

  it('accepts token with nbf in past', async () => {
    const schema = Jwt({ checkNotBefore: true })
    const token = createTestJwt(
      { alg: 'HS256' },
      { nbf: nowSeconds() - 60 },
    )
    const result = await parseAsync(schema, token)
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// CLOCK TOLERANCE
// ----------------------------------------------------------

describe('jwt (clockTolerance)', () => {
  it('accepts token expired by 10s with 30s tolerance', async () => {
    const schema = Jwt({ checkExpiry: true, clockTolerance: 30 })
    const token = createTestJwt(
      { alg: 'HS256' },
      { exp: nowSeconds() - 10 },
    )
    const result = await parseAsync(schema, token)
    expect(result.success).toBe(true)
  })

  it('rejects token expired by 60s with 30s tolerance', async () => {
    const schema = Jwt({ checkExpiry: true, clockTolerance: 30 })
    const token = createTestJwt(
      { alg: 'HS256' },
      { exp: nowSeconds() - 60 },
    )
    const result = await parseAsync(schema, token)
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// REQUIRE EXPIRY
// ----------------------------------------------------------

describe('jwt (requireExpiry)', () => {
  it('rejects token without exp claim', async () => {
    const schema = Jwt({ requireExpiry: true })
    const token = createTestJwt({ alg: 'HS256' }, { sub: 'user' })
    const result = await parseAsync(schema, token)
    expect(result.success).toBe(false)
  })

  it('accepts token with exp claim', async () => {
    const schema = Jwt({ requireExpiry: true })
    const token = createTestJwt(
      { alg: 'HS256' },
      { exp: nowSeconds() + 3600 },
    )
    const result = await parseAsync(schema, token)
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// REQUIRE CLAIMS
// ----------------------------------------------------------

describe('jwt (requireClaims)', () => {
  it('rejects token missing required claim', async () => {
    const schema = Jwt({ requireClaims: ['sub'] })
    const token = createTestJwt({ alg: 'HS256' }, { iss: 'test' })
    const result = await parseAsync(schema, token)
    expect(result.success).toBe(false)
  })

  it('accepts token with all required claims', async () => {
    const schema = Jwt({ requireClaims: ['sub', 'iss'] })
    const token = createTestJwt(
      { alg: 'HS256' },
      { sub: 'user', iss: 'test' },
    )
    const result = await parseAsync(schema, token)
    expect(result.success).toBe(true)
  })

  it('rejects token missing one of multiple required claims', async () => {
    const schema = Jwt({ requireClaims: ['sub', 'iss', 'aud'] })
    const token = createTestJwt(
      { alg: 'HS256' },
      { sub: 'user', iss: 'test' },
    )
    const result = await parseAsync(schema, token)
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// ALLOW ALGORITHMS
// ----------------------------------------------------------

describe('jwt (allowAlgorithms)', () => {
  it('rejects token with disallowed algorithm', async () => {
    const schema = Jwt({ allowAlgorithms: ['RS256'] })
    const token = createTestJwt(
      { alg: 'HS256', typ: 'JWT' },
      { sub: 'user' },
    )
    const result = await parseAsync(schema, token)
    expect(result.success).toBe(false)
  })

  it('accepts token with allowed algorithm', async () => {
    const schema = Jwt({ allowAlgorithms: ['RS256', 'HS256'] })
    const token = createTestJwt(
      { alg: 'HS256', typ: 'JWT' },
      { sub: 'user' },
    )
    const result = await parseAsync(schema, token)
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// EMPTY TO UNDEFINED
// ----------------------------------------------------------

describe('jwt (emptyToUndefined)', () => {
  it('rejects empty string by default', async () => {
    const schema = Jwt()
    const result = await parseAsync(schema, '')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// SECURITY VECTORS
// ----------------------------------------------------------

describe('jwt (security)', () => {
  const schema = Jwt()

  it.each([
    '<script>alert(1)</script>.payload.sig',
    'header.<img src=x>.sig',
    'a.b.c; DROP TABLE users',
    'a.b\0.c',
    'a.\u200B.c',
    'javascript:void(0)',
    `${'a'.repeat(10000)}.b.c`,
    '../../etc/passwd',
    'null',
    'undefined',
  ])('rejects malicious input: %s', async (value) => {
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(false)
  })
})
