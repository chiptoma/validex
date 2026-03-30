// ==============================================================================
// PROPERTY-BASED TESTS — RULE INVARIANTS
// Validates mathematical invariants across random inputs using fast-check.
// ------------------------------------------------------------------------------
// NOTE: All rules use default options (no async features) so safeParse works.
// ==============================================================================

import type { z } from 'zod'
import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { creditCard } from '../../src/rules/creditCard'
import { email } from '../../src/rules/email'
import { password } from '../../src/rules/password'
import { PersonName } from '../../src/rules/personName'
import { Slug } from '../../src/rules/slug'
import { uuid } from '../../src/rules/uuid'

// ----------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------

const NUM_RUNS = 1000

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/
const VERSION_NIBBLE_INDEX = 14

/**
 * Verify Luhn
 * Validates a digit string using the Luhn algorithm.
 *
 * @param digits - A string of digits to validate.
 * @returns True if the Luhn checksum is valid.
 */
function verifyLuhn(digits: string): boolean {
  let sum = 0
  let alternate = false
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i])
    if (alternate) {
      n *= 2
      if (n > 9)
        n -= 9
    }
    sum += n
    alternate = !alternate
  }
  return sum % 10 === 0
}

// ----------------------------------------------------------
// EMAIL INVARIANTS
// ----------------------------------------------------------

describe('email — property-based', () => {
  const schema = email() as z.ZodType

  it('accepted emails always contain exactly one @', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = schema.safeParse(input)
        if (result.success) {
          const data = result.data as string
          expect(data.split('@').length).toBe(2)
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })

  it('accepted emails are always trimmed', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = schema.safeParse(input)
        if (result.success) {
          const data = result.data as string
          expect(data).toBe(data.trim())
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })

  it('accepted emails are always lowercase', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = schema.safeParse(input)
        if (result.success) {
          const data = result.data as string
          expect(data).toBe(data.toLowerCase())
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })
})

// ----------------------------------------------------------
// PERSON NAME INVARIANTS
// ----------------------------------------------------------

describe('personName — property-based', () => {
  const schema = PersonName() as z.ZodType

  it('accepted names have length between 2 and 50', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = schema.safeParse(input)
        if (result.success) {
          const data = result.data as string
          expect(data.length).toBeGreaterThanOrEqual(2)
          expect(data.length).toBeLessThanOrEqual(50)
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })

  it('accepted names never contain < or >', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = schema.safeParse(input)
        if (result.success) {
          expect(result.data).not.toContain('<')
          expect(result.data).not.toContain('>')
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })

  it('accepted names start and end with an alpha character', () => {
    const alphaRe = /^\p{L}$/u

    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = schema.safeParse(input)
        if (result.success) {
          const chars = Array.from(result.data as string)
          const first = chars.at(0) ?? ''
          const last = chars.at(-1) ?? ''
          expect(alphaRe.test(first)).toBe(true)
          expect(alphaRe.test(last)).toBe(true)
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })
})

// ----------------------------------------------------------
// PASSWORD INVARIANTS
// ----------------------------------------------------------

describe('password — property-based', () => {
  const schema = password() as z.ZodType

  it('accepted passwords have length between 8 and 128', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = schema.safeParse(input)
        if (result.success) {
          const data = result.data as string
          expect(data.length).toBeGreaterThanOrEqual(8)
          expect(data.length).toBeLessThanOrEqual(128)
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })

  it('accepted passwords contain at least one uppercase letter', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = schema.safeParse(input)
        if (result.success) {
          expect(result.data).toMatch(/[A-Z]/)
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })

  it('accepted passwords contain at least one lowercase letter', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = schema.safeParse(input)
        if (result.success) {
          expect(result.data).toMatch(/[a-z]/)
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })

  it('accepted passwords contain at least one digit', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = schema.safeParse(input)
        if (result.success) {
          expect(result.data).toMatch(/\d/)
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })

  it('accepted passwords contain at least one special character', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = schema.safeParse(input)
        if (result.success) {
          expect(result.data).toMatch(/[^a-z0-9]/i)
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })
})

// ----------------------------------------------------------
// SLUG INVARIANTS
// ----------------------------------------------------------

describe('slug — property-based', () => {
  const schema = Slug() as z.ZodType

  it('accepted slugs match ^[a-z0-9]+(-[a-z0-9]+)*$', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = schema.safeParse(input)
        if (result.success) {
          expect(result.data).toMatch(SLUG_REGEX)
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })

  it('accepted slugs have length between 3 and 100', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = schema.safeParse(input)
        if (result.success) {
          const data = result.data as string
          expect(data.length).toBeGreaterThanOrEqual(3)
          expect(data.length).toBeLessThanOrEqual(100)
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })
})

// ----------------------------------------------------------
// UUID INVARIANTS
// ----------------------------------------------------------

describe('uUID — property-based', () => {
  const schema = uuid() as z.ZodType

  it('accepted UUIDs match the UUID format', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = schema.safeParse(input)
        if (result.success) {
          expect(result.data).toMatch(UUID_REGEX)
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })

  it('accepted UUIDs are lowercase and trimmed', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = schema.safeParse(input)
        if (result.success) {
          const data = result.data as string
          expect(data).toBe(data.toLowerCase())
          expect(data).toBe(data.trim())
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })

  it('version-specific UUID has correct version nibble', () => {
    for (const version of [1, 3, 4, 5, 7] as const) {
      const versionSchema = uuid({ version }) as z.ZodType

      fc.assert(
        fc.property(fc.string(), (input) => {
          const result = versionSchema.safeParse(input)
          if (result.success) {
            const data = result.data as string
            expect(data.charAt(VERSION_NIBBLE_INDEX)).toBe(String(version))
          }
        }),
        { numRuns: NUM_RUNS },
      )
    }
  })
})

// ----------------------------------------------------------
// EMPTY STRING INVARIANT — ALL RULES
// ----------------------------------------------------------

describe('all rules — empty string fails', () => {
  const rules: ReadonlyArray<{ readonly name: string, readonly factory: () => unknown }> = [
    { name: 'email', factory: () => email() },
    { name: 'PersonName', factory: () => PersonName() },
    { name: 'password', factory: () => password() },
    { name: 'Slug', factory: () => Slug() },
    { name: 'uuid', factory: () => uuid() },
    { name: 'creditCard', factory: () => creditCard() },
  ]

  for (const rule of rules) {
    it(`${rule.name}: empty string is rejected (emptyToUndefined)`, () => {
      const schema = rule.factory() as z.ZodType
      const result = schema.safeParse('')
      expect(result.success).toBe(false)
    })
  }
})

// ----------------------------------------------------------
// CREDIT CARD INVARIANTS
// ----------------------------------------------------------

describe('creditCard — property-based', () => {
  const schema = creditCard() as z.ZodType

  it('accepted card numbers contain only digits', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = schema.safeParse(input)
        if (result.success) {
          expect(result.data).toMatch(/^\d+$/)
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })

  it('accepted card numbers have length between 13 and 19', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = schema.safeParse(input)
        if (result.success) {
          const data = result.data as string
          expect(data.length).toBeGreaterThanOrEqual(13)
          expect(data.length).toBeLessThanOrEqual(19)
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })

  it('accepted card numbers pass Luhn algorithm', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = schema.safeParse(input)
        if (result.success) {
          expect(verifyLuhn(result.data as string)).toBe(true)
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })
})
