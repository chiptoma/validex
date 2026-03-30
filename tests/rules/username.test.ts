// ==============================================================================
// USERNAME RULE TESTS
// Tests for the username validation rule covering patterns, boundary, and
// consecutive character constraints.
// ==============================================================================

import type { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { Username } from '../../src/rules/username'
import { testRuleContract } from '../helpers/testRule'

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

function parse(schema: unknown, value: unknown): { success: boolean, data?: unknown } {
  return (schema as z.ZodType).safeParse(value)
}

// ----------------------------------------------------------
// CONTRACT
// ----------------------------------------------------------

testRuleContract('Username', Username as (opts?: Record<string, unknown>) => unknown, 'username')

// ----------------------------------------------------------
// VALID USERNAMES
// ----------------------------------------------------------

describe('username (valid)', () => {
  const schema = Username()

  it.each([
    'john_doe',
    'user123',
    'alice',
    'bob42',
    'test_user_01',
    'a1b2c3',
    'hello',
    'usr',
  ])('accepts valid username: %s', (value) => {
    expect(parse(schema, value).success).toBe(true)
  })
})

// ----------------------------------------------------------
// INVALID USERNAMES
// ----------------------------------------------------------

describe('username (invalid)', () => {
  const schema = Username()

  it.each([
    '_user',
    'user_',
    '-user',
    'user-name',
    'ab',
    '',
    'hello world',
    'user@name',
    'user.name',
    'user!name',
  ])('rejects invalid username: %s', (value) => {
    expect(parse(schema, value).success).toBe(false)
  })
})

// ----------------------------------------------------------
// PATTERN PRESETS
// ----------------------------------------------------------

describe('username (pattern)', () => {
  it('alphanumeric rejects underscores', () => {
    const schema = Username({ pattern: 'alphanumeric' })
    expect(parse(schema, 'john_doe').success).toBe(false)
  })

  it('alphanumeric accepts pure alphanumeric', () => {
    const schema = Username({ pattern: 'alphanumeric' })
    expect(parse(schema, 'johndoe').success).toBe(true)
  })

  it('alphanumeric-dash allows dashes', () => {
    const schema = Username({ pattern: 'alphanumeric-dash', boundary: 'alphanumeric' })
    expect(parse(schema, 'a-b-c').success).toBe(true)
  })

  it('alphanumeric-dash rejects underscores', () => {
    const schema = Username({ pattern: 'alphanumeric-dash' })
    expect(parse(schema, 'a_b_c').success).toBe(false)
  })

  it('alphanumeric-underscore allows underscores', () => {
    const schema = Username({ pattern: 'alphanumeric-underscore' })
    expect(parse(schema, 'a_b_c').success).toBe(true)
  })
})

// ----------------------------------------------------------
// EXTRA CHARS AND DISALLOW CHARS
// ----------------------------------------------------------

describe('username (extraChars / disallowChars)', () => {
  it('allows dots when extraChars includes .', () => {
    const schema = Username({ extraChars: '.' })
    expect(parse(schema, 'john.doe').success).toBe(true)
  })

  it('disallows underscore when disallowChars includes _', () => {
    const schema = Username({ disallowChars: '_' })
    expect(parse(schema, 'john_doe').success).toBe(false)
  })
})

// ----------------------------------------------------------
// BOUNDARY
// ----------------------------------------------------------

describe('username (boundary)', () => {
  it('rejects username starting with underscore (default boundary)', () => {
    const schema = Username()
    expect(parse(schema, '_user').success).toBe(false)
  })

  it('rejects username ending with underscore (default boundary)', () => {
    const schema = Username()
    expect(parse(schema, 'user_').success).toBe(false)
  })

  it('accepts when boundary is any', () => {
    const schema = Username({ boundary: 'any' })
    expect(parse(schema, '_user_').success).toBe(true)
  })

  it('accepts digit at boundary with alphanumeric', () => {
    const schema = Username({ boundary: 'alphanumeric' })
    expect(parse(schema, '1user1').success).toBe(true)
  })
})

// ----------------------------------------------------------
// CONSECUTIVE
// ----------------------------------------------------------

describe('username (consecutive)', () => {
  it('rejects too many consecutive chars', () => {
    const schema = Username({ consecutive: { max: 2 }, length: { min: 3, max: 30 } })
    expect(parse(schema, 'aaalice').success).toBe(false)
  })

  it('accepts within consecutive limit', () => {
    const schema = Username({ consecutive: { max: 2 }, length: { min: 3, max: 30 } })
    expect(parse(schema, 'aalice').success).toBe(true)
  })
})

// ----------------------------------------------------------
// LENGTH
// ----------------------------------------------------------

describe('username (length)', () => {
  it('rejects too short', () => {
    const schema = Username({ length: { min: 5, max: 20 } })
    expect(parse(schema, 'abc').success).toBe(false)
  })

  it('rejects too long', () => {
    const schema = Username({ length: { min: 3, max: 5 } })
    expect(parse(schema, 'abcdef').success).toBe(false)
  })

  it('accepts within range', () => {
    const schema = Username({ length: { min: 3, max: 10 } })
    expect(parse(schema, 'hello').success).toBe(true)
  })
})

// ----------------------------------------------------------
// NORMALIZATION
// ----------------------------------------------------------

describe('username (normalize)', () => {
  it('lowercases and trims input', () => {
    const schema = Username()
    const result = (schema as z.ZodType).safeParse('  JohnDoe  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('johndoe')
    }
  })
})

// ----------------------------------------------------------
// SECURITY VECTORS
// ----------------------------------------------------------

describe('username (security)', () => {
  const schema = Username()

  it.each([
    'hello<script>',
    'hello\n_world',
    'user; DROP TABLE',
    'user\0name',
    'user\u200Bname',
    '../etc/passwd',
    'u'.repeat(100),
    'admin; rm -rf /',
  ])('rejects malicious input: %s', (value) => {
    expect(parse(schema, value).success).toBe(false)
  })
})
