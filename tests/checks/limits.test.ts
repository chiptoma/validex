import { describe, expect, it } from 'vitest'
import { maxConsecutive, maxWords, noSpaces } from '../../src/checks/limits'

describe('maxWords', () => {
  it('should return true when word count equals max', () => {
    expect(maxWords('one two three', 3)).toBe(true)
  })

  it('should return false when word count exceeds max', () => {
    expect(maxWords('one two three', 2)).toBe(false)
  })

  it('should return true for empty string with max=0', () => {
    expect(maxWords('', 0)).toBe(true)
  })

  it('should return true for single word with max=1', () => {
    expect(maxWords('word', 1)).toBe(true)
  })
})

describe('maxConsecutive', () => {
  it('should return true when consecutive count equals max', () => {
    expect(maxConsecutive('aaab', 3)).toBe(true)
  })

  it('should return false when consecutive count exceeds max', () => {
    expect(maxConsecutive('aaaab', 3)).toBe(false)
  })

  it('should return true when no character repeats', () => {
    expect(maxConsecutive('abc', 1)).toBe(true)
  })

  it('should return true for pairs with max=2', () => {
    expect(maxConsecutive('aabb', 2)).toBe(true)
  })

  it('should return true for empty string', () => {
    expect(maxConsecutive('', 1)).toBe(true)
  })
})

describe('noSpaces', () => {
  it('should return true for string without whitespace', () => {
    expect(noSpaces('hello')).toBe(true)
  })

  it('should return false for string with space', () => {
    expect(noSpaces('hello world')).toBe(false)
  })

  it('should return false for string with tab', () => {
    expect(noSpaces('hello\t')).toBe(false)
  })
})
