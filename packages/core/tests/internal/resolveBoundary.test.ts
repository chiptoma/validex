import { describe, expect, it } from 'vitest'
import { checkAsciiBoundary, checkUnicodeBoundary } from '../../src/checks/boundary'
import { resolveBoundary } from '../../src/internal/resolveBoundary'

describe('resolveBoundary', () => {
  it('should return undefined for undefined input', () => {
    expect(resolveBoundary(undefined)).toBeUndefined()
  })

  it('should expand "alpha" to both start and end', () => {
    expect(resolveBoundary('alpha')).toEqual({ start: 'alpha', end: 'alpha' })
  })

  it('should expand "alphanumeric" to both start and end', () => {
    expect(resolveBoundary('alphanumeric')).toEqual({ start: 'alphanumeric', end: 'alphanumeric' })
  })

  it('should expand "any" to both start and end', () => {
    expect(resolveBoundary('any')).toEqual({ start: 'any', end: 'any' })
  })

  it('should pass through object with both start and end', () => {
    expect(resolveBoundary({ start: 'alpha', end: 'alphanumeric' }))
      .toEqual({ start: 'alpha', end: 'alphanumeric' })
  })

  it('should default missing start to "any"', () => {
    expect(resolveBoundary({ end: 'alpha' }))
      .toEqual({ start: 'any', end: 'alpha' })
  })

  it('should default missing end to "any"', () => {
    expect(resolveBoundary({ start: 'alphanumeric' }))
      .toEqual({ start: 'alphanumeric', end: 'any' })
  })

  it('should default both to "any" for empty object', () => {
    expect(resolveBoundary({})).toEqual({ start: 'any', end: 'any' })
  })
})

describe('checkUnicodeBoundary — edge cases', () => {
  it('rejects empty string', () => {
    expect(checkUnicodeBoundary('', { start: 'alpha', end: 'alpha' })).toBe(false)
  })

  it('accepts single unicode letter with alpha boundary', () => {
    expect(checkUnicodeBoundary('A', { start: 'alpha', end: 'alpha' })).toBe(true)
  })

  it('rejects digit-first string with alpha start boundary', () => {
    expect(checkUnicodeBoundary('1abc', { start: 'alpha', end: 'alpha' })).toBe(false)
  })

  it('rejects digit-last string with alpha end boundary', () => {
    expect(checkUnicodeBoundary('abc1', { start: 'alpha', end: 'alpha' })).toBe(false)
  })

  it('accepts digit-first with alphanumeric start boundary', () => {
    expect(checkUnicodeBoundary('1abc', { start: 'alphanumeric', end: 'alpha' })).toBe(true)
  })

  it('accepts any start with any boundary', () => {
    expect(checkUnicodeBoundary('-abc', { start: 'any', end: 'alpha' })).toBe(true)
  })
})

describe('checkAsciiBoundary — edge cases', () => {
  it('rejects empty string', () => {
    expect(checkAsciiBoundary('', { start: 'alpha', end: 'alpha' })).toBe(false)
  })

  it('rejects digit-first string with alpha start boundary', () => {
    expect(checkAsciiBoundary('1user', { start: 'alpha', end: 'alphanumeric' })).toBe(false)
  })

  it('rejects digit-last string with alpha end boundary', () => {
    expect(checkAsciiBoundary('user1', { start: 'alphanumeric', end: 'alpha' })).toBe(false)
  })

  it('accepts lowercase alpha start and end with alpha boundary', () => {
    expect(checkAsciiBoundary('user', { start: 'alpha', end: 'alpha' })).toBe(true)
  })

  it('accepts digit-first with alphanumeric start boundary', () => {
    expect(checkAsciiBoundary('1user', { start: 'alphanumeric', end: 'alpha' })).toBe(true)
  })

  it('accepts any start with any boundary', () => {
    expect(checkAsciiBoundary('-user', { start: 'any', end: 'alpha' })).toBe(true)
  })

  it('rejects uppercase with ascii alpha boundary (case-sensitive)', () => {
    expect(checkAsciiBoundary('User', { start: 'alpha', end: 'alpha' })).toBe(false)
  })
})
