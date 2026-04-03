// ==============================================================================
// TEXT RULE TESTS
// Tests for the text validation rule covering content detection, word limits,
// consecutive character checks, regex override, and security vectors.
// ==============================================================================

import type { z } from 'zod'

import { describe, expect, it } from 'vitest'

import { getParams } from '@core/getParams'
import { Text } from '@rules/text'

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

// ----------------------------------------------------------
// CONTRACT
// ----------------------------------------------------------

testRuleContract(
  'text',
  Text as (opts?: Record<string, unknown>) => unknown,
  'text',
)

// ----------------------------------------------------------
// VALID TEXT
// ----------------------------------------------------------

describe('text (valid)', () => {
  const schema = Text()

  it.each([
    'Hello world',
    'This is a simple text string',
    'Numbers 123 are fine',
    'Special chars: !@#$%^&*()',
    'Multi-word sentence with punctuation.',
    'UPPERCASE TEXT',
    'lowercase text',
    'Mixed Case Text',
    'Short',
    'A',
    'Text with\nnewlines',
    'Accented characters: cafe, resume, naive',
  ])('accepts: %s', (value) => {
    expect(parse(schema, value).success).toBe(true)
  })
})

// ----------------------------------------------------------
// INVALID TEXT
// ----------------------------------------------------------

describe('text (invalid)', () => {
  const schema = Text()

  it('rejects empty string', () => {
    expect(parse(schema, '').success).toBe(false)
  })

  it('rejects non-string types', () => {
    expect(parse(schema, 12345).success).toBe(false)
    expect(parse(schema, null).success).toBe(false)
    expect(parse(schema, true).success).toBe(false)
  })
})

// ----------------------------------------------------------
// LENGTH CONSTRAINTS
// ----------------------------------------------------------

describe('text (length)', () => {
  it('rejects text shorter than min length', () => {
    const schema = Text({ length: { min: 5 } })
    expect(parse(schema, 'Hi').success).toBe(false)
  })

  it('accepts text at min length', () => {
    const schema = Text({ length: { min: 5 } })
    expect(parse(schema, 'Hello').success).toBe(true)
  })

  it('rejects text longer than max length', () => {
    const schema = Text({ length: { max: 10 } })
    expect(parse(schema, 'This is way too long').success).toBe(false)
  })

  it('accepts text at max length', () => {
    const schema = Text({ length: { max: 10 } })
    expect(parse(schema, '1234567890').success).toBe(true)
  })
})

// ----------------------------------------------------------
// CONTENT DETECTION: NO EMAILS
// ----------------------------------------------------------

describe('text (noEmails)', () => {
  const schema = Text({ noEmails: true })

  it('rejects text containing email address', () => {
    const result = parse(schema, 'contact test@example.com for info')
    expect(result.success).toBe(false)
    expect(getErrorCodes(schema, 'contact test@example.com for info'))
      .toContain('noEmails')
  })

  it('accepts text without email address', () => {
    expect(parse(schema, 'contact us for info').success).toBe(true)
  })
})

// ----------------------------------------------------------
// CONTENT DETECTION: NO URLS
// ----------------------------------------------------------

describe('text (noUrls)', () => {
  const schema = Text({ noUrls: true })

  it('rejects text containing URL', () => {
    const result = parse(schema, 'visit https://example.com today')
    expect(result.success).toBe(false)
    expect(getErrorCodes(schema, 'visit https://example.com today'))
      .toContain('noUrls')
  })

  it('rejects text containing www URL', () => {
    expect(parse(schema, 'visit www.example.com today').success).toBe(false)
  })

  it('accepts text without URL', () => {
    expect(parse(schema, 'visit our office today').success).toBe(true)
  })
})

// ----------------------------------------------------------
// CONTENT DETECTION: NO HTML
// ----------------------------------------------------------

describe('text (noHtml)', () => {
  const schema = Text({ noHtml: true })

  it('rejects text containing HTML tags', () => {
    const result = parse(schema, 'this is <b>bold</b> text')
    expect(result.success).toBe(false)
    expect(getErrorCodes(schema, 'this is <b>bold</b> text'))
      .toContain('noHtml')
  })

  it('rejects text containing script tags', () => {
    expect(parse(schema, '<script>alert(1)</script>').success).toBe(false)
  })

  it('accepts text without HTML', () => {
    expect(parse(schema, 'plain text content').success).toBe(true)
  })
})

// ----------------------------------------------------------
// CONTENT DETECTION: NO PHONE NUMBERS
// ----------------------------------------------------------

describe('text (noPhoneNumbers)', () => {
  const schema = Text({ noPhoneNumbers: true }) as z.ZodType

  it('rejects text containing phone number', async () => {
    const result = await schema.safeParseAsync('call +34 612 345 678 today')
    expect(result.success).toBe(false)
  })

  it('accepts text without phone number', async () => {
    const result = await schema.safeParseAsync('call our office today')
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// WORD LIMITS
// ----------------------------------------------------------

describe('text (words)', () => {
  it('rejects text exceeding max words', () => {
    const schema = Text({ words: { max: 2 } })
    const result = parse(schema, 'one two three')
    expect(result.success).toBe(false)
    expect(getErrorCodes(schema, 'one two three')).toContain('maxWords')
  })

  it('accepts text within max words', () => {
    const schema = Text({ words: { max: 3 } })
    expect(parse(schema, 'one two three').success).toBe(true)
  })
})

// ----------------------------------------------------------
// WORD MIN LIMITS
// ----------------------------------------------------------

describe('text (words min)', () => {
  it('rejects text with too few words', () => {
    const schema = Text({ words: { min: 3 } })
    expect(parse(schema, 'one two').success).toBe(false)
    expect(getErrorCodes(schema, 'one two')).toContain('minWords')
  })

  it('accepts text with enough words', () => {
    const schema = Text({ words: { min: 3 } })
    expect(parse(schema, 'one two three').success).toBe(true)
  })

  it('accepts text when no min is set', () => {
    const schema = Text({ words: { max: 10 } })
    expect(parse(schema, 'one').success).toBe(true)
  })
})

// ----------------------------------------------------------
// CONSECUTIVE CHARACTER LIMITS
// ----------------------------------------------------------

describe('text (consecutive)', () => {
  it('rejects text with too many consecutive characters', () => {
    const schema = Text({ consecutive: { max: 3 } })
    const result = parse(schema, 'aaaa text')
    expect(result.success).toBe(false)
    expect(getErrorCodes(schema, 'aaaa text')).toContain('maxConsecutive')
  })

  it('accepts text within consecutive limit', () => {
    const schema = Text({ consecutive: { max: 3 } })
    expect(parse(schema, 'aaa text').success).toBe(true)
  })
})

// ----------------------------------------------------------
// COMBINED OPTIONS
// ----------------------------------------------------------

describe('text (combined)', () => {
  it('rejects email when both noEmails and noUrls are enabled', () => {
    const schema = Text({ noEmails: true, noUrls: true })
    expect(parse(schema, 'email me at test@example.com').success).toBe(false)
  })

  it('rejects URL when both noEmails and noUrls are enabled', () => {
    const schema = Text({ noEmails: true, noUrls: true })
    expect(parse(schema, 'visit https://example.com').success).toBe(false)
  })

  it('accepts clean text when both noEmails and noUrls are enabled', () => {
    const schema = Text({ noEmails: true, noUrls: true })
    expect(parse(schema, 'clean text here').success).toBe(true)
  })
})

// ----------------------------------------------------------
// REGEX OVERRIDE
// ----------------------------------------------------------

describe('text (regex)', () => {
  it('validates against custom regex', () => {
    const schema = Text({ regex: /^[A-Z]+$/ })
    expect(parse(schema, 'HELLO').success).toBe(true)
    expect(parse(schema, 'hello').success).toBe(false)
  })

  it('applies regex in addition to length', () => {
    const schema = Text({ regex: /^[a-z]+$/, length: { max: 5 } })
    expect(parse(schema, 'hi').success).toBe(true)
    expect(parse(schema, 'toolong').success).toBe(false)
    expect(parse(schema, 'HI').success).toBe(false)
  })
})

// ----------------------------------------------------------
// SECURITY VECTORS
// ----------------------------------------------------------

describe('text (security)', () => {
  const schema = Text({ noHtml: true, noUrls: true })

  it.each([
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    '<iframe src="javascript:alert(1)"></iframe>',
    'https://evil.com/steal?cookie=abc',
    'http://malware.site/payload',
  ])('rejects payload: %s', (value) => {
    expect(parse(schema, value).success).toBe(false)
  })
})

describe('text — edge cases', () => {
  it('preserves whitespace when normalize is false', () => {
    const schema = Text({ normalize: false }) as z.ZodType
    const result = schema.safeParse('  hello world  ')
    expect(result.success).toBe(true)
    if (result.success)
      expect(result.data).toBe('  hello world  ')
  })
})
