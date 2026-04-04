// ==============================================================================
// PROPERTY-BASED TESTS — RULE INVARIANTS
// Validates mathematical invariants across random inputs using fast-check.
// ------------------------------------------------------------------------------
// NOTE: All rules use default options (no async features) so safeParse works.
//       Phone, Username (blockReserved), and IBAN require safeParseAsync.
// ==============================================================================

import type { z } from 'zod'

import * as fc from 'fast-check'
import { describe, expect, it } from 'vitest'

import { CreditCard } from '@rules/creditCard'
import { Email } from '@rules/email'
import { Iban } from '@rules/iban'
import { Password } from '@rules/password'
import { PersonName } from '@rules/personName'
import { Phone } from '@rules/phone'
import { Slug } from '@rules/slug'
import { Url } from '@rules/url'
import { Username } from '@rules/username'
import { Uuid } from '@rules/uuid'
import { Website } from '@rules/website'

// ----------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------

const NUM_RUNS = 1000

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/
const VERSION_NIBBLE_INDEX = 14

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

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
  const schema = Email() as z.ZodType

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
  const schema = Password() as z.ZodType

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

describe('uuid — property-based', () => {
  const schema = Uuid() as z.ZodType

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
      const versionSchema = Uuid({ version }) as z.ZodType

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
// CREDIT CARD INVARIANTS
// ----------------------------------------------------------

describe('creditCard — property-based', () => {
  const schema = CreditCard() as z.ZodType

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

// ----------------------------------------------------------
// WEBSITE INVARIANTS
// ----------------------------------------------------------

describe('website — property-based', () => {
  const schema = Website() as z.ZodType

  it('accepted websites start with http:// or https://', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = schema.safeParse(input)
        if (result.success) {
          const data = result.data as string
          expect(data.startsWith('http://') || data.startsWith('https://')).toBe(true)
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })

  it('accepted websites are trimmed and lowercased', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = schema.safeParse(input)
        if (result.success) {
          const data = result.data as string
          expect(data).toBe(data.trim())
          expect(data).toBe(data.toLowerCase())
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })
})

// ----------------------------------------------------------
// URL INVARIANTS
// ----------------------------------------------------------

describe('url — property-based', () => {
  const schema = Url() as z.ZodType

  it('accepted URLs have protocol in the default protocols list', () => {
    const allowed = ['http:', 'https:']
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = schema.safeParse(input)
        if (result.success) {
          try {
            const parsed = new URL(result.data as string)
            expect(allowed).toContain(parsed.protocol)
          }
          catch {
            // URL parse failure on accepted value — should not happen
            expect.unreachable('Accepted URL should be parseable')
          }
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })

  it('accepted URLs are trimmed', () => {
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
})

// ----------------------------------------------------------
// PHONE INVARIANTS (async — requires safeParseAsync)
// ----------------------------------------------------------

describe('phone — property-based', () => {
  const schema = Phone() as z.ZodType

  it('accepted phones start with + when requireCountryCode is default', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async (input) => {
        const result = await schema.safeParseAsync(input)
        if (result.success) {
          const data = result.data as string
          expect(data.startsWith('+')).toBe(true)
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })
})

// ----------------------------------------------------------
// USERNAME INVARIANTS
// ----------------------------------------------------------

describe('username — property-based', () => {
  const schema = Username() as z.ZodType

  it('accepted usernames have alphanumeric boundary characters', () => {
    const alnumRe = /^[a-z0-9]$/i
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = schema.safeParse(input)
        if (result.success) {
          const data = result.data as string
          if (data.length > 0) {
            expect(alnumRe.test(data.charAt(0))).toBe(true)
            expect(alnumRe.test(data.charAt(data.length - 1))).toBe(true)
          }
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })

  it('accepted usernames are trimmed and lowercased', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = schema.safeParse(input)
        if (result.success) {
          const data = result.data as string
          expect(data).toBe(data.trim())
          expect(data).toBe(data.toLowerCase())
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })
})

// ----------------------------------------------------------
// IBAN INVARIANTS (async — requires safeParseAsync)
// ----------------------------------------------------------

describe('iban — property-based', () => {
  const schema = Iban() as z.ZodType

  it('accepted IBANs pass mod-97 checksum', async () => {
    await fc.assert(
      fc.asyncProperty(fc.string(), async (input) => {
        const result = await schema.safeParseAsync(input)
        if (result.success) {
          const data = result.data as string
          // Rearrange: move first 4 chars to end, convert letters to numbers
          const rearranged = data.slice(4) + data.slice(0, 4)
          let numeric = ''
          for (const ch of rearranged) {
            const code = ch.charCodeAt(0)
            numeric += code >= 65 && code <= 90 ? String(code - 55) : ch
          }
          // Compute mod-97 iteratively
          let remainder = 0
          for (const digit of numeric) {
            remainder = (remainder * 10 + Number(digit)) % 97
          }
          expect(remainder).toBe(1)
        }
      }),
      { numRuns: NUM_RUNS },
    )
  })
})
