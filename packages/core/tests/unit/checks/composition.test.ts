import { describe, expect, it } from 'vitest'

import {
  hasDigits,
  hasLowercase,
  hasSpecial,
  hasUppercase,
} from '@checks/composition'

describe('hasUppercase', () => {
  it('should return true when ASCII uppercase count meets min', () => {
    expect(hasUppercase('HeLLo', 2)).toBe(true)
  })

  it('should return false when no uppercase letters exist', () => {
    expect(hasUppercase('hello', 1)).toBe(false)
  })

  it('should handle unicode uppercase (Ü)', () => {
    expect(hasUppercase('Ü', 1)).toBe(true)
  })

  it('should handle unicode uppercase (MÜLLER)', () => {
    expect(hasUppercase('MÜLLER', 1)).toBe(true)
  })

  it('should count Vietnamese uppercase letters (NGUYỄN)', () => {
    expect(hasUppercase('NGUYỄN', 1)).toBe(true)
    expect(hasUppercase('NGUYỄN', 5)).toBe(true)
  })

  it('should return false when count exceeds max', () => {
    expect(hasUppercase('ABC', 1, 2)).toBe(false)
  })

  it('should return true when count is within min and max', () => {
    expect(hasUppercase('ABc', 1, 2)).toBe(true)
  })

  it('should return false for empty string with min >= 1', () => {
    expect(hasUppercase('', 1)).toBe(false)
  })

  it('should return true for empty string with min = 0', () => {
    expect(hasUppercase('', 0)).toBe(true)
  })
})

describe('hasLowercase', () => {
  it('should return true when lowercase count meets min', () => {
    expect(hasLowercase('HeLLo', 2)).toBe(true)
  })

  it('should return false when no lowercase letters exist', () => {
    expect(hasLowercase('HELLO', 1)).toBe(false)
  })

  it('should handle unicode lowercase (ü)', () => {
    expect(hasLowercase('ü', 1)).toBe(true)
  })

  it('should return false when count exceeds max', () => {
    expect(hasLowercase('abc', 1, 2)).toBe(false)
  })

  it('should return false for empty string with min >= 1', () => {
    expect(hasLowercase('', 1)).toBe(false)
  })
})

describe('hasDigits', () => {
  it('should return true when digit count meets min', () => {
    expect(hasDigits('abc123', 3)).toBe(true)
  })

  it('should return false when no digits exist', () => {
    expect(hasDigits('abc', 1)).toBe(false)
  })

  it('should respect max bound', () => {
    expect(hasDigits('abc123', 1, 2)).toBe(false)
  })

  it('should return true when count is within bounds', () => {
    expect(hasDigits('a1b2', 1, 3)).toBe(true)
  })

  it('should return false for empty string with min >= 1', () => {
    expect(hasDigits('', 1)).toBe(false)
  })
})

describe('hasSpecial', () => {
  it('should return true when special character count meets min', () => {
    expect(hasSpecial('p@ss!', 2)).toBe(true)
  })

  it('should return false when no special characters exist', () => {
    expect(hasSpecial('hello', 1)).toBe(false)
  })

  it('should not count letters as special', () => {
    expect(hasSpecial('abcXYZ', 1)).toBe(false)
  })

  it('should not count digits as special', () => {
    expect(hasSpecial('123', 1)).toBe(false)
  })

  it('should not count whitespace as special', () => {
    expect(hasSpecial('hello world', 1)).toBe(false)
  })

  it('should respect max bound', () => {
    expect(hasSpecial('@#$%', 1, 2)).toBe(false)
  })

  it('should return false for empty string with min >= 1', () => {
    expect(hasSpecial('', 1)).toBe(false)
  })
})
