// ==============================================================================
// CHECKS USAGE — INTEGRATION TESTS
// Verifies check functions work standalone, composable with Zod, and
// composable with validex rules.
// ==============================================================================

import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  containsEmail,
  containsPhoneNumber,
  containsUrl,
  hasUppercase,
  maxWords,
  minWords,
  noSpaces,
  toSlug,
  toTitleCase,
} from '../../src/checks'
import { Email } from '../../src/rules/email'

// ----------------------------------------------------------
// STANDALONE USAGE
// ----------------------------------------------------------

describe('checks — standalone usage', () => {
  it('hasUppercase("Hello", 1) returns true', () => {
    expect(hasUppercase('Hello', 1)).toBe(true)
  })

  it('hasUppercase("hello", 1) returns false', () => {
    expect(hasUppercase('hello', 1)).toBe(false)
  })

  it('containsEmail detects email in text', () => {
    expect(containsEmail('email me at test@x.com please')).toBe(true)
  })

  it('containsPhoneNumber detects phone number in text', async () => {
    expect(await containsPhoneNumber('call +34612345678')).toBe(true)
  })

  it('containsPhoneNumber rejects text without phone number', async () => {
    expect(await containsPhoneNumber('no phone here')).toBe(false)
  })

  it('noSpaces("hello world") returns false', () => {
    expect(noSpaces('hello world')).toBe(false)
  })

  it('noSpaces("hello") returns true', () => {
    expect(noSpaces('hello')).toBe(true)
  })

  it('maxWords("one two three", 2) returns false', () => {
    expect(maxWords('one two three', 2)).toBe(false)
  })

  it('maxWords("one two", 2) returns true', () => {
    expect(maxWords('one two', 2)).toBe(true)
  })

  it('minWords("one two three", 2) returns true', () => {
    expect(minWords('one two three', 2)).toBe(true)
  })

  it('minWords("one", 2) returns false', () => {
    expect(minWords('one', 2)).toBe(false)
  })

  it('toTitleCase("hello world") returns "Hello World"', () => {
    expect(toTitleCase('hello world')).toBe('Hello World')
  })

  it('toSlug("Hello World") returns "hello-world"', () => {
    expect(toSlug('Hello World')).toBe('hello-world')
  })
})

// ----------------------------------------------------------
// COMPOSABLE WITH ZOD
// ----------------------------------------------------------

describe('checks — composable with Zod', () => {
  it('z.string().refine(hasUppercase) rejects lowercase-only', () => {
    const schema = z.string().refine(v => hasUppercase(v, 1))
    const result = schema.safeParse('hello')
    expect(result.success).toBe(false)
  })

  it('z.string().refine(!containsEmail) passes clean text', () => {
    const schema = z.string().refine(v => !containsEmail(v))
    const result = schema.safeParse('no emails here')
    expect(result.success).toBe(true)
  })

  it('z.string().refine(!containsEmail) rejects text with email', () => {
    const schema = z.string().refine(v => !containsEmail(v))
    const result = schema.safeParse('reach me at test@example.com')
    expect(result.success).toBe(false)
  })

  it('z.string().transform(toTitleCase) transforms correctly', () => {
    const schema = z.string().transform(v => toTitleCase(v))
    const result = schema.parse('hello world')
    expect(result).toBe('Hello World')
  })

  it('z.string().transform(toSlug) transforms correctly', () => {
    const schema = z.string().transform(v => toSlug(v))
    const result = schema.parse('Hello World')
    expect(result).toBe('hello-world')
  })
})

// ----------------------------------------------------------
// COMPOSABLE WITH VALIDEX RULES
// ----------------------------------------------------------

describe('checks — composable with validex rules', () => {
  it('email().pipe(z.string().refine(!containsUrl)) chains after rule', () => {
    const schema = (Email() as z.ZodType<string, string>).pipe(
      z.string().refine(v => !containsUrl(v)),
    )
    const valid = schema.safeParse('test@example.com')
    expect(valid.success).toBe(true)
  })
})
