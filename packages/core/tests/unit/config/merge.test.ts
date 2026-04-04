// ==============================================================================
// CONFIG MERGE TESTS
// Tests the three-tier config merge logic.
// ==============================================================================

import { describe, expect, it } from 'vitest'

import { deepMergeTwo, mergeThreeTiers } from '@config/merge'

describe('deepMergeTwo', () => {
  it('should return base when override is empty', () => {
    const base = { a: 1, b: 2 }
    expect(deepMergeTwo(base, {})).toEqual({ a: 1, b: 2 })
  })

  it('should override scalar values', () => {
    const base = { a: 1, b: 2 }
    const override = { b: 3 }
    expect(deepMergeTwo(base, override)).toEqual({ a: 1, b: 3 })
  })

  it('should add new keys from override', () => {
    const base = { a: 1 }
    const override = { b: 2 }
    expect(deepMergeTwo(base, override)).toEqual({ a: 1, b: 2 })
  })

  it('should remove keys when override has undefined', () => {
    const base = { a: 1, b: 2 }
    const override = { b: undefined }
    const result = deepMergeTwo(base, override)
    expect(result).toEqual({ a: 1 })
    expect(result).not.toHaveProperty('b')
  })

  it('should deep merge nested objects', () => {
    const base = { nested: { a: 1, b: 2 } }
    const override = { nested: { b: 3, c: 4 } }
    expect(deepMergeTwo(base, override)).toEqual({
      nested: { a: 1, b: 3, c: 4 },
    })
  })

  it('should replace arrays entirely', () => {
    const base = { items: [1, 2, 3] }
    const override = { items: [4, 5] }
    expect(deepMergeTwo(base, override)).toEqual({ items: [4, 5] })
  })

  it('should not treat RegExp as a plain object', () => {
    const base = { pattern: /abc/ }
    const override = { pattern: /xyz/ }
    expect(deepMergeTwo(base, override)).toEqual({ pattern: /xyz/ })
  })

  it('should not treat Date as a plain object', () => {
    const date1 = new Date('2024-01-01')
    const date2 = new Date('2025-01-01')
    const base = { date: date1 }
    const override = { date: date2 }
    expect(deepMergeTwo(base, override)).toEqual({ date: date2 })
  })
})

describe('deepMergeTwo (security)', () => {
  it('does not pollute Object.prototype via __proto__ key', () => {
    // SAFETY: JSON.parse to create an object with __proto__ key without triggering linter
    const malicious = JSON.parse('{"__proto__":{"polluted":true}}') as Record<string, unknown>
    deepMergeTwo({}, malicious)
    // The critical check: Object.prototype must not be polluted
    expect(({} as Record<string, unknown>)['polluted']).toBeUndefined()
  })

  it('does not pollute Object.prototype via constructor.prototype', () => {
    // SAFETY: JSON.parse to create nested attack vector
    const malicious = JSON.parse('{"constructor":{"prototype":{"injected":true}}}') as Record<string, unknown>
    deepMergeTwo({}, malicious)
    expect(({} as Record<string, unknown>)['injected']).toBeUndefined()
  })
})

describe('mergeThreeTiers', () => {
  it('should merge defaults → globals → per-call', () => {
    const defaults = { a: 1, b: 2, c: 3 }
    const globals = { b: 20 }
    const perCall = { c: 30 }
    expect(mergeThreeTiers(defaults, globals, perCall)).toEqual({
      a: 1,
      b: 20,
      c: 30,
    })
  })

  it('should allow per-call to remove a global setting with undefined', () => {
    const defaults = { a: 1 }
    const globals = { b: 2 }
    const perCall = { b: undefined }
    const result = mergeThreeTiers(defaults, globals, perCall)
    expect(result).toEqual({ a: 1 })
    expect(result).not.toHaveProperty('b')
  })

  it('should allow per-call to override a global nested value', () => {
    const defaults = { opts: { x: 1, y: 2 } }
    const globals = { opts: { y: 20 } }
    const perCall = { opts: { y: 200 } }
    expect(mergeThreeTiers(defaults, globals, perCall)).toEqual({
      opts: { x: 1, y: 200 },
    })
  })

  it('should inherit defaults when globals and per-call are empty', () => {
    const defaults = { a: 1, b: { c: 2 } }
    expect(mergeThreeTiers(defaults, {}, {})).toEqual({
      a: 1,
      b: { c: 2 },
    })
  })
})
