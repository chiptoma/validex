// ==============================================================================
// SLUG RULE TESTS
// Tests for the slug validation rule covering format, length, and extra chars.
// ==============================================================================

import type { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { Slug } from '../../src/rules/slug'
import { testRuleContract } from '../helpers/testRule'

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

function parse(schema: unknown, value: unknown): { success: boolean } {
  return (schema as z.ZodType).safeParse(value)
}

// ----------------------------------------------------------
// CONTRACT
// ----------------------------------------------------------

testRuleContract('Slug', Slug as (opts?: Record<string, unknown>) => unknown, 'slug')

// ----------------------------------------------------------
// VALID SLUGS
// ----------------------------------------------------------

describe('slug (valid)', () => {
  const schema = Slug()

  it.each([
    'hello-world',
    'my-slug',
    'abc',
    'test123',
    'hello-world-123',
    'foo',
    'bar-baz',
    'a-b-c',
    'post-about-typescript',
    'version-2-release',
    'simple',
    'one-two-three-four',
  ])('accepts valid slug: %s', (value) => {
    expect(parse(schema, value).success).toBe(true)
  })
})

// ----------------------------------------------------------
// INVALID SLUGS
// ----------------------------------------------------------

describe('slug (invalid)', () => {
  const schema = Slug()

  it.each([
    '-hello',
    'hello-',
    'hello--world',
    'hello world',
    'ab',
    'hello_world',
    'hello.world',
    'hello/world',
    '',
    '-',
    '--',
    'hello@world',
    'hello!slug',
  ])('rejects invalid slug: %s', (value) => {
    expect(parse(schema, value).success).toBe(false)
  })
})

// ----------------------------------------------------------
// EXTRA CHARS
// ----------------------------------------------------------

describe('slug (extraChars)', () => {
  it('allows underscores when extraChars includes _', () => {
    const schema = Slug({ extraChars: '_' })
    expect(parse(schema, 'hello_world').success).toBe(true)
  })

  it('allows dots when extraChars includes .', () => {
    const schema = Slug({ extraChars: '.' })
    expect(parse(schema, 'hello.world').success).toBe(true)
  })

  it('still validates default pattern chars', () => {
    const schema = Slug({ extraChars: '_' })
    expect(parse(schema, 'hello-world').success).toBe(true)
  })

  it('rejects characters not in extraChars', () => {
    const schema = Slug({ extraChars: '_' })
    expect(parse(schema, 'hello world').success).toBe(false)
  })
})

// ----------------------------------------------------------
// LENGTH CONSTRAINTS
// ----------------------------------------------------------

describe('slug (length)', () => {
  it('rejects slugs shorter than min', () => {
    const schema = Slug({ length: { min: 5, max: 100 } })
    expect(parse(schema, 'abc').success).toBe(false)
  })

  it('rejects slugs longer than max', () => {
    const schema = Slug({ length: { min: 3, max: 10 } })
    expect(parse(schema, 'this-is-a-very-long-slug').success).toBe(false)
  })

  it('accepts slugs within range', () => {
    const schema = Slug({ length: { min: 3, max: 20 } })
    expect(parse(schema, 'hello-world').success).toBe(true)
  })

  it('supports exact length via number', () => {
    const schema = Slug({ length: 5 })
    expect(parse(schema, 'abcde').success).toBe(true)
    expect(parse(schema, 'abcd').success).toBe(false)
    expect(parse(schema, 'abcdef').success).toBe(false)
  })
})

// ----------------------------------------------------------
// REGEX OVERRIDE
// ----------------------------------------------------------

describe('slug (regex override)', () => {
  it('uses custom regex when provided', () => {
    const schema = Slug({ regex: /^[a-z]+$/ })
    expect(parse(schema, 'hello').success).toBe(true)
    expect(parse(schema, 'hello-world').success).toBe(false)
  })
})

// ----------------------------------------------------------
// NORMALIZATION
// ----------------------------------------------------------

describe('slug (normalize)', () => {
  it('lowercases and trims input', () => {
    const schema = Slug()
    const result = (schema as z.ZodType).safeParse('  Hello-World  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('hello-world')
    }
  })

  it('normalizes uppercase to valid slug', () => {
    const schema = Slug()
    expect(parse(schema, 'HELLO-WORLD').success).toBe(true)
  })
})

// ----------------------------------------------------------
// SECURITY VECTORS
// ----------------------------------------------------------

describe('slug (security)', () => {
  const schema = Slug()

  it.each([
    'hello<script>',
    'hello\n-world',
    'hello; DROP TABLE',
    'hello\0world',
    'hello\u200Bworld',
    '../etc/passwd',
    'slug'.repeat(100),
    'hello world; rm -rf /',
  ])('rejects malicious input: %s', (value) => {
    expect(parse(schema, value).success).toBe(false)
  })
})
