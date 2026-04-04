// ==============================================================================
// BUSINESS NAME RULE TESTS
// Tests for business name validation: companies, boundaries, security.
// ==============================================================================

import type { z } from 'zod'

import { describe, expect, it } from 'vitest'

import { BusinessName } from '@rules/businessName'

import { getErrorCodes, parse } from '../../_support/helpers/parse'
import { testRuleContract } from '../../_support/helpers/testRule'

// ----------------------------------------------------------
// CONTRACT
// ----------------------------------------------------------

testRuleContract(
  'BusinessName',
  BusinessName as (opts?: Record<string, unknown>) => unknown,
  'businessName',
)

// ----------------------------------------------------------
// VALID BUSINESS NAMES
// ----------------------------------------------------------

describe('businessName (valid)', () => {
  const schema = BusinessName()

  it.each([
    'AT&T',
    'Ben & Jerry\'s',
    'H&M',
    '3M',
    'McDonald\'s',
    'Ernst & Young',
    'Johnson & Johnson',
    'Procter & Gamble',
    'Rolls-Royce',
    'Coca-Cola',
    'IKEA',
    'BMW',
    'L.L. Bean',
    'Deloitte',
  ])('accepts valid business name: %s', (value) => {
    expect(parse(schema, value).success).toBe(true)
  })
})

// ----------------------------------------------------------
// INVALID BUSINESS NAMES
// ----------------------------------------------------------

describe('businessName (invalid)', () => {
  const schema = BusinessName()

  it.each([
    'A',
    '-StartDash',
    '&Leading',
    '.Dot First',
    '<script>',
    'Name@Company',
    'Hello#World',
    'Name$Corp',
    'Test+Inc',
    'One=Two',
    'Name{Corp}',
    '',
  ])('rejects invalid business name: %s', (value) => {
    expect(parse(schema, value).success).toBe(false)
  })
})

// ----------------------------------------------------------
// BOUNDARY
// ----------------------------------------------------------

describe('businessName (boundary)', () => {
  it('accepts names starting with a digit', () => {
    const schema = BusinessName()
    expect(parse(schema, '3M').success).toBe(true)
  })

  it('rejects names starting with ampersand', () => {
    const schema = BusinessName()
    expect(parse(schema, '&T').success).toBe(false)
  })

  it('rejects names ending with a dot', () => {
    const schema = BusinessName()
    expect(parse(schema, 'Corp.').success).toBe(false)
  })

  it('accepts names ending with a letter', () => {
    const schema = BusinessName()
    expect(parse(schema, 'Corp Inc').success).toBe(true)
  })
})

// ----------------------------------------------------------
// CONSECUTIVE CHARACTERS
// ----------------------------------------------------------

describe('businessName (consecutive)', () => {
  it('rejects names with more than 4 consecutive identical chars', () => {
    const schema = BusinessName()
    expect(parse(schema, 'Yaaahoo').success).toBe(true)
    expect(parse(schema, 'Yaaaaahoo').success).toBe(false)
  })

  it('allows custom consecutive limit', () => {
    const schema = BusinessName({ consecutive: { max: 2 } })
    expect(parse(schema, 'Yaahoo').success).toBe(true)
    expect(parse(schema, 'Yaaahoo').success).toBe(false)
  })
})

// ----------------------------------------------------------
// LENGTH CONSTRAINTS
// ----------------------------------------------------------

describe('businessName (length)', () => {
  it('rejects names shorter than min', () => {
    const schema = BusinessName({ length: { min: 5 } })
    expect(parse(schema, 'AB').success).toBe(false)
  })

  it('rejects names longer than max', () => {
    const schema = BusinessName({ length: { max: 10 } })
    expect(parse(schema, 'Very Long Business Name Incorporated').success).toBe(false)
  })
})

// ----------------------------------------------------------
// TITLE CASE TRANSFORM
// ----------------------------------------------------------

describe('businessName (titleCase)', () => {
  it('transforms to title case when enabled', () => {
    const schema = BusinessName({ titleCase: true })
    const result = parse(schema, 'acme corp')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('Acme Corp')
    }
  })
})

// ----------------------------------------------------------
// NORMALIZATION
// ----------------------------------------------------------

describe('businessName (normalize)', () => {
  it('trims whitespace by default', () => {
    const schema = BusinessName()
    const result = parse(schema, '  IKEA  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('IKEA')
    }
  })
})

// ----------------------------------------------------------
// REGEX OVERRIDE
// ----------------------------------------------------------

describe('businessName (regex override)', () => {
  it('uses custom regex when provided', () => {
    const schema = BusinessName({ regex: /^[A-Z]+$/ })
    expect(parse(schema, 'ACME').success).toBe(true)
    expect(parse(schema, 'Acme Corp').success).toBe(false)
  })
})

// ----------------------------------------------------------
// SECURITY VECTORS
// ----------------------------------------------------------

describe('businessName (security)', () => {
  const schema = BusinessName()

  it.each([
    '<script>alert(1)</script>',
    'Corp\nInc',
    'Corp; DROP TABLE',
    'Corp\0Inc',
    'Corp\u200BInc',
    '../etc/passwd',
    'a'.repeat(200),
    'Robert"); DROP TABLE Companies;--',
  ])('rejects malicious input: %s', (value) => {
    expect(parse(schema, value).success).toBe(false)
  })
})

// ----------------------------------------------------------
// EXTRA CHARS
// ----------------------------------------------------------

describe('businessName (extraChars)', () => {
  it('allows slash when extraChars includes /', () => {
    const schema = BusinessName({ extraChars: '/' })
    expect(parse(schema, 'A/B Corp').success).toBe(true)
  })

  it('allows plus when extraChars includes +', () => {
    const schema = BusinessName({ extraChars: '+' })
    expect(parse(schema, 'C++ Labs').success).toBe(true)
  })

  it('preserves default chars (ampersand) when extraChars is set', () => {
    const schema = BusinessName({ extraChars: '/' })
    expect(parse(schema, 'AT&T').success).toBe(true)
  })

  it('rejects slash without extraChars and returns invalid code', () => {
    const schema = BusinessName()
    expect(parse(schema, 'A/B Corp').success).toBe(false)
    expect(getErrorCodes(schema, 'A/B Corp')).toContain('invalid')
  })

  it('rejects at-sign even with slash in extraChars and returns invalid code', () => {
    const schema = BusinessName({ extraChars: '/' })
    expect(parse(schema, 'Name@Corp').success).toBe(false)
    expect(getErrorCodes(schema, 'Name@Corp')).toContain('invalid')
  })

  it('rejects equals even with plus in extraChars and returns invalid code', () => {
    const schema = BusinessName({ extraChars: '+' })
    expect(parse(schema, 'Name=Corp').success).toBe(false)
    expect(getErrorCodes(schema, 'Name=Corp')).toContain('invalid')
  })
})

// ----------------------------------------------------------
// DISALLOW CHARS
// ----------------------------------------------------------

describe('businessName (disallowChars)', () => {
  it('accepts name without ampersand when ampersand is disallowed', () => {
    const schema = BusinessName({ disallowChars: '&' })
    expect(parse(schema, 'Acme Corp').success).toBe(true)
  })

  it('accepts name without dot when dot is disallowed', () => {
    const schema = BusinessName({ disallowChars: '.' })
    expect(parse(schema, 'Acme Inc').success).toBe(true)
  })

  it('accepts name without parens when parens are disallowed', () => {
    const schema = BusinessName({ disallowChars: '()' })
    expect(parse(schema, 'Acme Corp').success).toBe(true)
  })

  it('rejects ampersand when disallowed and returns invalid code', () => {
    const schema = BusinessName({ disallowChars: '&' })
    expect(parse(schema, 'AT&T').success).toBe(false)
    expect(getErrorCodes(schema, 'AT&T')).toContain('invalid')
  })

  it('rejects dot when disallowed and returns invalid code', () => {
    const schema = BusinessName({ disallowChars: '.' })
    expect(parse(schema, 'L.L. Bean').success).toBe(false)
    expect(getErrorCodes(schema, 'L.L. Bean')).toContain('invalid')
  })

  it('rejects open paren when disallowed and returns invalid code', () => {
    const schema = BusinessName({ disallowChars: '(' })
    expect(parse(schema, 'Corp (UK)').success).toBe(false)
    expect(getErrorCodes(schema, 'Corp (UK)')).toContain('invalid')
  })
})

describe('businessName — edge cases', () => {
  it('preserves inner text without trimming when normalize is false', async () => {
    const schema = BusinessName({ normalize: false }) as z.ZodType
    const result = await schema.safeParseAsync('Acme Corp')
    expect(result.success).toBe(true)
    if (result.success)
      expect(result.data).toBe('Acme Corp')
  })

  it('rejects leading whitespace when normalize is false due to boundary check', async () => {
    const schema = BusinessName({ normalize: false }) as z.ZodType
    const result = await schema.safeParseAsync('  Acme Corp  ')
    expect(result.success).toBe(false)
  })

  it('rejects consecutive identical characters exceeding max (case-sensitive)', async () => {
    const schema = BusinessName({ consecutive: { max: 2 } }) as z.ZodType
    // 'aaa' has 3 consecutive identical lowercase 'a' chars
    const result = await schema.safeParseAsync('Baaab Corp')
    expect(result.success).toBe(false)
  })

  it('accepts consecutive characters within max', async () => {
    const schema = BusinessName({ consecutive: { max: 3 } }) as z.ZodType
    const result = await schema.safeParseAsync('Aardvark Inc')
    expect(result.success).toBe(true)
  })
})
