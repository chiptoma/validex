// ==============================================================================
// COLOR RULE TESTS
// Tests for the color validation rule covering hex, rgb, hsl, and any format.
// ==============================================================================

import type { z } from 'zod'

import { describe, expect, it } from 'vitest'

import { Color } from '@rules/color'

import { testRuleContract } from '../../_support/helpers/testRule'

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

function parse(schema: unknown, value: unknown): { success: boolean } {
  return (schema as z.ZodType).safeParse(value)
}

// ----------------------------------------------------------
// CONTRACT
// ----------------------------------------------------------

testRuleContract('Color', Color as (opts?: Record<string, unknown>) => unknown, 'color')

// ----------------------------------------------------------
// HEX FORMAT
// ----------------------------------------------------------

describe('color (hex)', () => {
  const schema = Color({ format: 'hex', alpha: true })

  it.each([
    '#fff',
    '#FFF',
    '#ffffff',
    '#FF0000',
    '#00ff00ff',
    '#aaa',
    '#AbCdEf',
    '#123',
    '#1234',
    '#12345678',
  ])('accepts valid hex color: %s', (value) => {
    expect(parse(schema, value).success).toBe(true)
  })

  it.each([
    'fff',
    '#gg0000',
    '#12345',
    'red',
    '#',
    '#1',
    '#12',
    'rgb(255,0,0)',
    '#1234567890',
    '##ffffff',
  ])('rejects invalid hex color: %s', (value) => {
    expect(parse(schema, value).success).toBe(false)
  })
})

// ----------------------------------------------------------
// HEX ALPHA DISABLED
// ----------------------------------------------------------

describe('color (hex, alpha: false)', () => {
  const schema = Color({ format: 'hex', alpha: false })

  it('accepts 3-char hex', () => {
    expect(parse(schema, '#fff').success).toBe(true)
  })

  it('accepts 6-char hex', () => {
    expect(parse(schema, '#ffffff').success).toBe(true)
  })

  it('rejects 4-char hex (alpha)', () => {
    expect(parse(schema, '#ffff').success).toBe(false)
  })

  it('rejects 8-char hex (alpha)', () => {
    expect(parse(schema, '#ffffffff').success).toBe(false)
  })
})

// ----------------------------------------------------------
// RGB FORMAT
// ----------------------------------------------------------

describe('color (rgb)', () => {
  it('accepts valid rgb', () => {
    const schema = Color({ format: 'rgb', alpha: true })
    expect(parse(schema, 'rgb(255, 0, 0)').success).toBe(true)
  })

  it('accepts rgba with alpha', () => {
    const schema = Color({ format: 'rgb', alpha: true })
    expect(parse(schema, 'rgba(255, 0, 0, 0.5)').success).toBe(true)
  })

  it('accepts rgb without spaces', () => {
    const schema = Color({ format: 'rgb', alpha: true })
    expect(parse(schema, 'rgb(0,0,0)').success).toBe(true)
  })

  it('rejects rgba when alpha is false', () => {
    const schema = Color({ format: 'rgb', alpha: false })
    expect(parse(schema, 'rgba(255, 0, 0, 0.5)').success).toBe(false)
  })

  it('accepts rgb when alpha is false', () => {
    const schema = Color({ format: 'rgb', alpha: false })
    expect(parse(schema, 'rgb(255, 0, 0)').success).toBe(true)
  })
})

// ----------------------------------------------------------
// HSL FORMAT
// ----------------------------------------------------------

describe('color (hsl)', () => {
  it('accepts valid hsl', () => {
    const schema = Color({ format: 'hsl', alpha: true })
    expect(parse(schema, 'hsl(0, 100%, 50%)').success).toBe(true)
  })

  it('accepts hsla with alpha', () => {
    const schema = Color({ format: 'hsl', alpha: true })
    expect(parse(schema, 'hsla(0, 100%, 50%, 0.5)').success).toBe(true)
  })

  it('rejects hsla when alpha is false', () => {
    const schema = Color({ format: 'hsl', alpha: false })
    expect(parse(schema, 'hsla(0, 100%, 50%, 0.5)').success).toBe(false)
  })

  it('accepts hsl when alpha is false', () => {
    const schema = Color({ format: 'hsl', alpha: false })
    expect(parse(schema, 'hsl(0, 100%, 50%)').success).toBe(true)
  })
})

// ----------------------------------------------------------
// ANY FORMAT
// ----------------------------------------------------------

describe('color (any)', () => {
  const schema = Color({ format: 'any', alpha: true })

  it('accepts hex in any mode', () => {
    expect(parse(schema, '#ff0000').success).toBe(true)
  })

  it('accepts rgb in any mode', () => {
    expect(parse(schema, 'rgb(255, 0, 0)').success).toBe(true)
  })

  it('accepts hsl in any mode', () => {
    expect(parse(schema, 'hsl(0, 100%, 50%)').success).toBe(true)
  })

  it('rejects named colors in any mode', () => {
    expect(parse(schema, 'red').success).toBe(false)
  })
})

// ----------------------------------------------------------
// NORMALIZATION
// ----------------------------------------------------------

describe('color (normalize)', () => {
  it('lowercases and trims input', () => {
    const schema = Color({ format: 'hex' })
    const result = (schema as z.ZodType).safeParse('  #FF0000  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('#ff0000')
    }
  })
})

// ----------------------------------------------------------
// SECURITY VECTORS
// ----------------------------------------------------------

describe('color (security)', () => {
  const schema = Color({ format: 'hex' })

  it.each([
    '#ffffff<script>',
    '#ffffff\n#000000',
    '#ffffff; DROP TABLE',
    '#fff\0',
    '#fff\u200B',
    'javascript:void(0)',
    '#ffffff'.repeat(100),
  ])('rejects malicious input: %s', (value) => {
    expect(parse(schema, value).success).toBe(false)
  })
})

describe('color — edge cases', () => {
  it('uses hex format fallback when format is cleared', () => {
    // Clearing format triggers ?? 'hex' fallback
    const schema = Color({ format: undefined }) as z.ZodType
    expect(schema.safeParse('#ff0000').success).toBe(true)
  })

  it('disables alpha channel validation when alpha is false', () => {
    // alpha: false means alpha !== false is false — exercising the false branch
    const schema = Color({ alpha: false }) as z.ZodType
    // #ff000080 has alpha — should be rejected when alpha is disabled
    expect(schema.safeParse('#ff000080').success).toBe(false)
    expect(schema.safeParse('#ff0000').success).toBe(true)
  })

  it('rejects leading whitespace when normalize is false', () => {
    const schema = Color({ normalize: false }) as z.ZodType
    // Without normalization, leading/trailing spaces are not trimmed
    expect(schema.safeParse(' #ff0000 ').success).toBe(false)
    expect(schema.safeParse('#ff0000').success).toBe(true)
  })
})
