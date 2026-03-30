// ==============================================================================
// PERSON NAME RULE TESTS
// Tests for person name validation: international names, boundaries, security.
// ==============================================================================

import type { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { PersonName } from '../../src/rules/personName'
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

testRuleContract(
  'PersonName',
  PersonName as (opts?: Record<string, unknown>) => unknown,
  'personName',
)

// ----------------------------------------------------------
// VALID NAMES
// ----------------------------------------------------------

describe('personName (valid)', () => {
  const schema = PersonName()

  it.each([
    'John',
    'Jane Doe',
    'Jean-Paul',
    'O\'Brien',
    'D\'Angelo',
    'Sinéad O\'Connor',
    'María García',
    'Nguyễn Thị Thanh',
    '李明',
    'Müller',
    'al-Rashid',
    'Björk',
    'Åsa',
    'José',
    'François',
    'Zoë',
    'Ana María',
  ])('accepts valid name: %s', (value) => {
    expect(parse(schema, value).success).toBe(true)
  })
})

// ----------------------------------------------------------
// INVALID NAMES
// ----------------------------------------------------------

describe('personName (invalid)', () => {
  const schema = PersonName()

  it.each([
    '-John',
    'John-',
    '\'Smith',
    '123',
    '<script>',
    'J',
    '12345',
    'John@Doe',
    'Jane!Smith',
    'Hello#World',
    'Name$here',
    'Test+Name',
    'One=Two',
    'John_Doe',
    'A',
  ])('rejects invalid name: %s', (value) => {
    expect(parse(schema, value).success).toBe(false)
  })
})

// ----------------------------------------------------------
// CONSECUTIVE CHARACTERS
// ----------------------------------------------------------

describe('personName (consecutive)', () => {
  it('rejects names with more than 3 consecutive identical chars', () => {
    const schema = PersonName()
    expect(parse(schema, 'Allle').success).toBe(true)
    expect(parse(schema, 'Alllle').success).toBe(false)
  })

  it('allows custom consecutive limit', () => {
    const schema = PersonName({ consecutive: { max: 2 } })
    expect(parse(schema, 'Alle').success).toBe(true)
    expect(parse(schema, 'Allle').success).toBe(false)
  })
})

// ----------------------------------------------------------
// WORD LIMITS
// ----------------------------------------------------------

describe('personName (words)', () => {
  it('rejects names exceeding max word count', () => {
    const schema = PersonName({ words: { max: 2 } })
    expect(parse(schema, 'John Michael Doe').success).toBe(false)
  })

  it('accepts names within word limit', () => {
    const schema = PersonName({ words: { max: 3 } })
    expect(parse(schema, 'John Michael Doe').success).toBe(true)
  })
})

// ----------------------------------------------------------
// BOUNDARY
// ----------------------------------------------------------

describe('personName (boundary)', () => {
  it('rejects names starting with hyphen', () => {
    const schema = PersonName()
    expect(parse(schema, '-John').success).toBe(false)
  })

  it('rejects names ending with apostrophe', () => {
    const schema = PersonName()
    expect(parse(schema, 'John\'').success).toBe(false)
  })

  it('accepts names starting with unicode letter', () => {
    const schema = PersonName()
    expect(parse(schema, 'Ürgen').success).toBe(true)
  })
})

// ----------------------------------------------------------
// LENGTH CONSTRAINTS
// ----------------------------------------------------------

describe('personName (length)', () => {
  it('rejects names shorter than min', () => {
    const schema = PersonName({ length: { min: 5 } })
    expect(parse(schema, 'Joe').success).toBe(false)
  })

  it('rejects names longer than max', () => {
    const schema = PersonName({ length: { max: 10 } })
    expect(parse(schema, 'John Michael William Smith').success).toBe(false)
  })
})

// ----------------------------------------------------------
// UNICODE MODE
// ----------------------------------------------------------

describe('personName (allowUnicode: false)', () => {
  it('rejects unicode letters when disabled', () => {
    const schema = PersonName({ allowUnicode: false })
    expect(parse(schema, 'María').success).toBe(false)
  })

  it('accepts ASCII-only names', () => {
    const schema = PersonName({ allowUnicode: false })
    expect(parse(schema, 'John Doe').success).toBe(true)
  })
})

// ----------------------------------------------------------
// TITLE CASE TRANSFORM
// ----------------------------------------------------------

describe('personName (titleCase)', () => {
  it('transforms to title case when enabled', () => {
    const schema = PersonName({ titleCase: true })
    const result = parse(schema, 'john doe')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('John Doe')
    }
  })
})

// ----------------------------------------------------------
// NORMALIZATION
// ----------------------------------------------------------

describe('personName (normalize)', () => {
  it('trims whitespace by default', () => {
    const schema = PersonName()
    const result = parse(schema, '  Jane Doe  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('Jane Doe')
    }
  })
})

// ----------------------------------------------------------
// REGEX OVERRIDE
// ----------------------------------------------------------

describe('personName (regex override)', () => {
  it('uses custom regex when provided', () => {
    const schema = PersonName({ regex: /^[A-Z][a-z]+$/ })
    expect(parse(schema, 'John').success).toBe(true)
    expect(parse(schema, 'john').success).toBe(false)
  })
})

// ----------------------------------------------------------
// SECURITY VECTORS
// ----------------------------------------------------------

describe('personName (security)', () => {
  const schema = PersonName()

  it.each([
    '<script>alert(1)</script>',
    'John\n Doe',
    'John; DROP TABLE',
    'John\0Doe',
    'John\u200BDoe',
    '../etc/passwd',
    'a'.repeat(100),
    'Robert"); DROP TABLE Students;--',
    'John<img src=x onerror=alert(1)>',
  ])('rejects malicious input: %s', (value) => {
    expect(parse(schema, value).success).toBe(false)
  })
})
