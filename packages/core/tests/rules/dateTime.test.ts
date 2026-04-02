// ==============================================================================
// DATE/TIME RULE TESTS
// Validates ISO datetime, date, time parsing, range constraints, and security.
// ==============================================================================

import type { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { DateTime } from '../../src/rules/dateTime'
import { testRuleContract } from '../helpers/testRule'

// ----------------------------------------------------------
// CONTRACT TESTS
// ----------------------------------------------------------

testRuleContract('dateTime', DateTime as (opts?: Record<string, unknown>) => unknown, 'dateTime')

// ----------------------------------------------------------
// VALID ISO DATETIMES
// ----------------------------------------------------------

describe('dateTime (valid ISO)', () => {
  const schema = DateTime() as z.ZodType

  const validValues: ReadonlyArray<string> = [
    '2025-03-29T14:30:00Z',
    '2025-03-29T14:30:00+02:00',
    '2025-03-29T14:30:00.123Z',
    '2025-01-01T00:00:00Z',
    '1999-12-31T23:59:59Z',
    '2025-03-29T14:30:00-05:00',
    '2025-03-29T14:30:00.000Z',
  ]

  it.each(validValues)('accepts: %s', (value) => {
    const result = schema.safeParse(value)
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// INVALID ISO DATETIMES
// ----------------------------------------------------------

describe('dateTime (invalid ISO)', () => {
  const schema = DateTime() as z.ZodType

  const invalidValues: ReadonlyArray<string> = [
    'not-a-date',
    '2025-13-01T00:00:00Z',
    '25-03-29T14:30:00Z',
    '2025-03-29',
    '14:30:00',
    '2025/03/29T14:30:00Z',
    'Mar 29, 2025',
    '2025-03-29T25:00:00Z',
    '2025-03-29T14:60:00Z',
  ]

  it.each(invalidValues)('rejects: %s', (value) => {
    const result = schema.safeParse(value)
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// DATE FORMAT
// ----------------------------------------------------------

describe('dateTime (date format)', () => {
  const schema = DateTime({ format: 'date' }) as z.ZodType

  it('accepts valid date', () => {
    expect(schema.safeParse('2025-03-29').success).toBe(true)
  })

  it('accepts boundary dates', () => {
    expect(schema.safeParse('2000-01-01').success).toBe(true)
    expect(schema.safeParse('1999-12-31').success).toBe(true)
  })

  it('rejects full datetime', () => {
    expect(schema.safeParse('2025-03-29T14:30:00Z').success).toBe(false)
  })

  it('rejects invalid month', () => {
    expect(schema.safeParse('2025-13-01').success).toBe(false)
  })

  it('rejects wrong format', () => {
    expect(schema.safeParse('03/29/2025').success).toBe(false)
  })
})

// ----------------------------------------------------------
// TIME FORMAT
// ----------------------------------------------------------

describe('dateTime (time format)', () => {
  const schema = DateTime({ format: 'time' }) as z.ZodType

  it('accepts valid time', () => {
    expect(schema.safeParse('14:30:00').success).toBe(true)
  })

  it('accepts midnight', () => {
    expect(schema.safeParse('00:00:00').success).toBe(true)
  })

  it('rejects full datetime', () => {
    expect(schema.safeParse('2025-03-29T14:30:00Z').success).toBe(false)
  })

  it('rejects invalid hour', () => {
    expect(schema.safeParse('25:00:00').success).toBe(false)
  })
})

// ----------------------------------------------------------
// PRECISION
// ----------------------------------------------------------

describe('dateTime (precision)', () => {
  it('accepts datetime with matching precision', () => {
    const schema = DateTime({ precision: 3 }) as z.ZodType
    expect(schema.safeParse('2025-03-29T14:30:00.123Z').success).toBe(true)
  })

  it('rejects datetime with wrong precision', () => {
    const schema = DateTime({ precision: 3 }) as z.ZodType
    expect(schema.safeParse('2025-03-29T14:30:00Z').success).toBe(false)
  })

  it('accepts time with matching precision', () => {
    const schema = DateTime({ format: 'time', precision: 3 }) as z.ZodType
    expect(schema.safeParse('14:30:00.123').success).toBe(true)
  })
})

// ----------------------------------------------------------
// OFFSET AND LOCAL
// ----------------------------------------------------------

describe('dateTime (offset and local)', () => {
  it('accepts offset datetime by default', () => {
    const schema = DateTime() as z.ZodType
    expect(schema.safeParse('2025-03-29T14:30:00+02:00').success).toBe(true)
  })

  it('rejects local datetime by default', () => {
    const schema = DateTime() as z.ZodType
    expect(schema.safeParse('2025-03-29T14:30:00').success).toBe(false)
  })

  it('accepts local datetime when allowLocal is true', () => {
    const schema = DateTime({ allowLocal: true }) as z.ZodType
    expect(schema.safeParse('2025-03-29T14:30:00').success).toBe(true)
  })

  it('rejects offset when allowOffset is false', () => {
    const schema = DateTime({ allowOffset: false }) as z.ZodType
    expect(schema.safeParse('2025-03-29T14:30:00+02:00').success).toBe(false)
  })
})

// ----------------------------------------------------------
// ALLOW FUTURE / ALLOW PAST
// ----------------------------------------------------------

describe('dateTime (future/past)', () => {
  it('rejects future date when allowFuture is false', () => {
    const schema = DateTime({ allowFuture: false }) as z.ZodType
    const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    expect(schema.safeParse(futureDate).success).toBe(false)
  })

  it('accepts past date when allowFuture is false', () => {
    const schema = DateTime({ allowFuture: false }) as z.ZodType
    expect(schema.safeParse('2020-01-01T00:00:00Z').success).toBe(true)
  })

  it('rejects past date when allowPast is false', () => {
    const schema = DateTime({ allowPast: false }) as z.ZodType
    expect(schema.safeParse('2020-01-01T00:00:00Z').success).toBe(false)
  })

  it('accepts future date when allowPast is false', () => {
    const schema = DateTime({ allowPast: false }) as z.ZodType
    const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    expect(schema.safeParse(futureDate).success).toBe(true)
  })
})

// ----------------------------------------------------------
// MIN / MAX CONSTRAINTS
// ----------------------------------------------------------

describe('dateTime (min/max)', () => {
  it('accepts date at minimum boundary', () => {
    const schema = DateTime({ min: '2025-01-01T00:00:00Z' }) as z.ZodType
    expect(schema.safeParse('2025-01-01T00:00:00Z').success).toBe(true)
  })

  it('rejects date before minimum', () => {
    const schema = DateTime({ min: '2025-01-01T00:00:00Z' }) as z.ZodType
    expect(schema.safeParse('2024-12-31T23:59:59Z').success).toBe(false)
  })

  it('accepts date at maximum boundary', () => {
    const schema = DateTime({ max: '2025-12-31T23:59:59Z' }) as z.ZodType
    expect(schema.safeParse('2025-12-31T23:59:59Z').success).toBe(true)
  })

  it('rejects date after maximum', () => {
    const schema = DateTime({ max: '2025-12-31T23:59:59Z' }) as z.ZodType
    expect(schema.safeParse('2026-01-01T00:00:00Z').success).toBe(false)
  })

  it('accepts date within min/max range', () => {
    const schema = DateTime({
      min: '2025-01-01T00:00:00Z',
      max: '2025-12-31T23:59:59Z',
    }) as z.ZodType
    expect(schema.safeParse('2025-06-15T12:00:00Z').success).toBe(true)
  })

  it('accepts Date objects as min/max', () => {
    const schema = DateTime({
      min: new Date('2025-01-01T00:00:00Z'),
      max: new Date('2025-12-31T23:59:59Z'),
    }) as z.ZodType
    expect(schema.safeParse('2025-06-15T12:00:00Z').success).toBe(true)
  })
})

// ----------------------------------------------------------
// NORMALIZATION
// ----------------------------------------------------------

describe('dateTime (normalization)', () => {
  it('trims whitespace', () => {
    const schema = DateTime() as z.ZodType
    const result = schema.safeParse('  2025-03-29T14:30:00Z  ')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('2025-03-29T14:30:00Z')
    }
  })
})

// ----------------------------------------------------------
// SECURITY
// ----------------------------------------------------------

describe('dateTime (security)', () => {
  const schema = DateTime() as z.ZodType

  const payloads: ReadonlyArray<string> = [
    '<script>alert("xss")</script>',
    '\'; DROP TABLE users; --',
    '2025-03-29T14:30:00Z\x00injected',
    '../../../etc/passwd',
    // eslint-disable-next-line no-template-curly-in-string -- REASON: XSS/injection test payload contains template literal syntax
    '${7*7}',
    '{{constructor.constructor("return this")()}}',
    '%00%00%00%00-%00%00-%00%00-%00%00-%00%00%00%00%00%00',
  ]

  it.each(payloads)('rejects payload: %s', (value) => {
    const result = schema.safeParse(value)
    expect(result.success).toBe(false)
  })
})

describe('dateTime — edge cases', () => {
  it('validates ISO datetime with default options (no custom format flags)', () => {
    const schema = DateTime() as z.ZodType
    expect(schema.safeParse('2024-01-15T10:30:00Z').success).toBe(true)
    expect(schema.safeParse('not-a-date').success).toBe(false)
  })
})
