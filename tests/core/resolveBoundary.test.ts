import { describe, expect, it } from 'vitest'
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
