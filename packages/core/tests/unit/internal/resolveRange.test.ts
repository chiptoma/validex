import { describe, expect, it } from 'vitest'
import { resolveRange } from '../../../src/internal/resolveRange'

describe('resolveRange', () => {
  it('should return undefined for undefined input', () => {
    expect(resolveRange(undefined)).toBeUndefined()
  })

  it('should convert a number to exact range (min = max)', () => {
    expect(resolveRange(8)).toEqual({ min: 8, max: 8 })
  })

  it('should convert zero to exact range', () => {
    expect(resolveRange(0)).toEqual({ min: 0, max: 0 })
  })

  it('should pass through an object with both min and max', () => {
    expect(resolveRange({ min: 8, max: 128 })).toEqual({ min: 8, max: 128 })
  })

  it('should pass through an object with only min', () => {
    const result = resolveRange({ min: 8 })
    expect(result).toEqual({ min: 8 })
    expect(result).not.toHaveProperty('max')
  })

  it('should pass through an object with only max', () => {
    const result = resolveRange({ max: 128 })
    expect(result).toEqual({ max: 128 })
    expect(result).not.toHaveProperty('min')
  })

  it('should handle empty object', () => {
    const result = resolveRange({})
    expect(result).toEqual({})
  })
})
