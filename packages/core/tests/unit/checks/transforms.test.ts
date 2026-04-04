// ==============================================================================
// TRANSFORMS CHECK TESTS
// Tests toTitleCase, toSlug, stripHtml, collapseWhitespace, emptyToUndefined.
// ==============================================================================

import { describe, expect, it } from 'vitest'

import {
  collapseWhitespace,
  emptyToUndefined,
  stripHtml,
  toSlug,
  toTitleCase,
} from '@checks/transforms'

describe('emptyToUndefined', () => {
  it('should convert empty string to undefined', () => {
    expect(emptyToUndefined('')).toBeUndefined()
  })

  it('should convert null to undefined', () => {
    expect(emptyToUndefined(null)).toBeUndefined()
  })

  it('should pass through non-empty strings', () => {
    expect(emptyToUndefined('hello')).toBe('hello')
  })

  it('should pass through zero', () => {
    expect(emptyToUndefined(0)).toBe(0)
  })

  it('should pass through false', () => {
    expect(emptyToUndefined(false)).toBe(false)
  })
})

describe('toTitleCase', () => {
  it('should capitalize each word', () => {
    expect(toTitleCase('hello world')).toBe('Hello World')
  })

  it('should handle hyphens', () => {
    expect(toTitleCase('jean-paul')).toBe('Jean-Paul')
  })

  it('should handle apostrophes', () => {
    expect(toTitleCase('o\'brien')).toBe('O\'Brien')
  })

  it('should handle unicode characters', () => {
    expect(toTitleCase('maría garcía')).toBe('María García')
  })

  it('should lowercase then capitalize all-uppercase input', () => {
    expect(toTitleCase('HELLO')).toBe('Hello')
  })
})

describe('toSlug', () => {
  it('should convert to lowercase slug', () => {
    expect(toSlug('Hello World!')).toBe('hello-world')
  })

  it('should collapse whitespace and trim', () => {
    expect(toSlug('  Hello   World  ')).toBe('hello-world')
  })
})

describe('stripHtml', () => {
  it('should remove HTML tags', () => {
    expect(stripHtml('<b>Hello</b>')).toBe('Hello')
  })

  it('should remove script tags but keep content', () => {
    expect(stripHtml('<script>alert(1)</script>')).toBe('alert(1)')
  })
})

describe('collapseWhitespace', () => {
  it('should collapse multiple spaces and trim', () => {
    expect(collapseWhitespace('  hello   world  ')).toBe('hello world')
  })
})

describe('transforms — edge cases', () => {
  it('handles trailing hyphen in toTitleCase producing empty segment', () => {
    const result = toTitleCase('hello-')
    expect(result).toBe('Hello-')
  })

  it('handles consecutive hyphens in toTitleCase', () => {
    const result = toTitleCase('hello--world')
    expect(result).toBe('Hello--World')
  })

  it('handles single character in toTitleCase', () => {
    expect(toTitleCase('a')).toBe('A')
  })

  it('handles empty string in toTitleCase', () => {
    expect(toTitleCase('')).toBe('')
  })

  it('handles whitespace-only string in emptyToUndefined', () => {
    expect(emptyToUndefined('  ')).toBe('  ')
  })

  it('handles empty string in toSlug', () => {
    expect(toSlug('')).toBe('')
  })
})
