// ==============================================================================
// RESTRICTION CHECK TESTS
// Tests onlyAlpha, onlyNumeric, onlyAlphanumeric and related functions.
// ==============================================================================

import { describe, expect, it } from 'vitest'

import {
  onlyAlpha,
  onlyAlphanumeric,
  onlyAlphanumericSpaceHyphen,
  onlyAlphaSpaceHyphen,
  onlyNumeric,
} from '@checks/restriction'

describe('onlyAlpha', () => {
  it('should accept ASCII letters', () => {
    expect(onlyAlpha('Hello')).toBe(true)
  })

  it('should reject strings with digits', () => {
    expect(onlyAlpha('Hello1')).toBe(false)
  })

  it('should accept accented unicode letters', () => {
    expect(onlyAlpha('Müller')).toBe(true)
  })

  it('should accept CJK characters', () => {
    expect(onlyAlpha('李明')).toBe(true)
  })

  it('should reject empty string', () => {
    expect(onlyAlpha('')).toBe(false)
  })
})

describe('onlyNumeric', () => {
  it('should accept digit-only strings', () => {
    expect(onlyNumeric('12345')).toBe(true)
  })

  it('should reject strings with letters', () => {
    expect(onlyNumeric('123a')).toBe(false)
  })

  it('should reject empty string', () => {
    expect(onlyNumeric('')).toBe(false)
  })
})

describe('onlyAlphanumeric', () => {
  it('should accept mixed letters and digits', () => {
    expect(onlyAlphanumeric('Hello123')).toBe(true)
  })

  it('should reject strings with spaces', () => {
    expect(onlyAlphanumeric('Hello 123')).toBe(false)
  })
})

describe('onlyAlphanumericSpaceHyphen', () => {
  it('should accept letters, digits, and spaces', () => {
    expect(onlyAlphanumericSpaceHyphen('Hello 123')).toBe(true)
  })

  it('should accept letters, digits, spaces, and hyphens', () => {
    expect(onlyAlphanumericSpaceHyphen('Hello-World 1')).toBe(true)
  })

  it('should reject special characters', () => {
    expect(onlyAlphanumericSpaceHyphen('Hello!')).toBe(false)
  })
})

describe('onlyAlphaSpaceHyphen', () => {
  it('should accept hyphenated names', () => {
    expect(onlyAlphaSpaceHyphen('Jean-Paul')).toBe(true)
  })

  it('should accept names with spaces', () => {
    expect(onlyAlphaSpaceHyphen('O Brien')).toBe(true)
  })

  it('should reject strings with digits', () => {
    expect(onlyAlphaSpaceHyphen('Jean1')).toBe(false)
  })
})
