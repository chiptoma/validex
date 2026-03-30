// ==============================================================================
// EXTERNAL CREDIT CARD VALIDATION TESTS
// Regression tests using Stripe and PayPal published test card numbers.
// ------------------------------------------------------------------------------
// NOTE: These are permanent regression tests. All card numbers are public
//   test values from Stripe docs (https://docs.stripe.com/testing).
// ==============================================================================

import type { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { creditCard } from '../../src/rules/creditCard'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

interface TestCard {
  readonly number: string
  readonly issuer: string
  readonly label: string
}

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Parse Async
 * Runs safeParseAsync on the given schema and value.
 *
 * @param schema - The Zod schema from the credit card rule factory.
 * @param value  - The value to parse.
 * @returns The safe parse result.
 */
async function parseAsync(
  schema: unknown,
  value: unknown,
): Promise<{ success: boolean, data?: unknown, error?: unknown }> {
  return (schema as z.ZodType).safeParseAsync(value)
}

/**
 * Format With Spaces
 * Inserts spaces into a card number at 4-digit intervals.
 *
 * @param num - Raw card number string.
 * @returns The formatted string with spaces.
 */
function formatWithSpaces(num: string): string {
  return num.replace(/(.{4})/g, '$1 ').trim()
}

/**
 * Format With Hyphens
 * Inserts hyphens into a card number at 4-digit intervals.
 *
 * @param num - Raw card number string.
 * @returns The formatted string with hyphens.
 */
function formatWithHyphens(num: string): string {
  return num.replace(/(.{4})/g, '$1-').replace(/-$/, '')
}

/**
 * Break Luhn
 * Changes the last digit of a card number to invalidate the Luhn checksum.
 *
 * @param num - A valid card number string.
 * @returns A card number with a broken Luhn checksum.
 */
function breakLuhn(num: string): string {
  const lastChar = num[num.length - 1] ?? '0'
  const lastDigit = Number.parseInt(lastChar, 10)
  const newDigit = (lastDigit + 1) % 10
  return num.slice(0, -1) + String(newDigit)
}

// ----------------------------------------------------------
// TEST CARD DATA (Stripe / PayPal published test numbers)
// ----------------------------------------------------------

const TEST_CARDS: ReadonlyArray<TestCard> = [
  // Visa - starts with 4, 16 digits
  { number: '4242424242424242', issuer: 'visa', label: 'Visa (standard)' },
  { number: '4000056655665556', issuer: 'visa', label: 'Visa (debit)' },

  // Mastercard - starts with 51-55 or 2221-2720, 16 digits
  { number: '5555555555554444', issuer: 'mastercard', label: 'Mastercard (standard)' },
  { number: '2223003122003222', issuer: 'mastercard', label: 'Mastercard (2-series)' },
  { number: '5200828282828210', issuer: 'mastercard', label: 'Mastercard (debit)' },

  // American Express - starts with 34 or 37, 15 digits
  { number: '378282246310005', issuer: 'amex', label: 'Amex (standard)' },
  { number: '371449635398431', issuer: 'amex', label: 'Amex (corporate)' },

  // Discover - starts with 6011, 622126-622925, 644-649, or 65, 16 digits
  { number: '6011111111111117', issuer: 'discover', label: 'Discover (standard)' },
  { number: '6011000990139424', issuer: 'discover', label: 'Discover (variant)' },

  // Diners Club - starts with 300-305 or 36/38, 14 digits
  { number: '30569309025904', issuer: 'diners', label: 'Diners Club (Carte Blanche)' },
  { number: '38520000023237', issuer: 'diners', label: 'Diners Club (International)' },

  // JCB - starts with 3528-3589, 16 digits
  { number: '3530111333300000', issuer: 'jcb', label: 'JCB (standard)' },
  { number: '3566002020360505', issuer: 'jcb', label: 'JCB (variant)' },

  // UnionPay - starts with 62, 16-19 digits
  { number: '6200000000000005', issuer: 'unionpay', label: 'UnionPay (standard)' },
]

// ----------------------------------------------------------
// RAW CARD NUMBER VALIDATION
// ----------------------------------------------------------

describe('external credit card corpus - raw numbers', () => {
  const schema = creditCard()

  it.each(
    TEST_CARDS.map(c => [c.number, c.label] as const),
  )('accepts valid card %s (%s)', async (number: string, _label: string) => {
    const result = await parseAsync(schema, number)
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// FORMATTED INPUT (spaces)
// ----------------------------------------------------------

describe('external credit card corpus - space-formatted input', () => {
  const schema = creditCard()

  it.each(
    TEST_CARDS.map(c => [formatWithSpaces(c.number), c.label] as const),
  )('accepts space-formatted card %s (%s)', async (formatted: string, _label: string) => {
    const result = await parseAsync(schema, formatted)
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// FORMATTED INPUT (hyphens)
// ----------------------------------------------------------

describe('external credit card corpus - hyphen-formatted input', () => {
  const schema = creditCard()

  it.each(
    TEST_CARDS.map(c => [formatWithHyphens(c.number), c.label] as const),
  )('accepts hyphen-formatted card %s (%s)', async (formatted: string, _label: string) => {
    const result = await parseAsync(schema, formatted)
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// BROKEN LUHN (last digit changed)
// ----------------------------------------------------------

describe('external credit card corpus - broken Luhn checksum', () => {
  const schema = creditCard()

  it.each(
    TEST_CARDS.map(c => [breakLuhn(c.number), c.label] as const),
  )('rejects Luhn-broken card %s (%s)', async (broken: string, _label: string) => {
    const result = await parseAsync(schema, broken)
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// ISSUER DETECTION (allowIssuers filtering)
// ----------------------------------------------------------

describe('external credit card corpus - issuer detection', () => {
  it.each(
    TEST_CARDS.map(c => [c.number, c.issuer, c.label] as const),
  )(
    'card %s is detected as %s (%s)',
    async (number: string, issuer: string, _label: string) => {
      // Create a schema that only allows this specific issuer
      const allowSchema = creditCard({
        allowIssuers: [issuer as Parameters<typeof creditCard>[0] extends
        { allowIssuers?: infer T } ? (T extends ReadonlyArray<infer U> ? U : never) : never],
      })

      const result = await parseAsync(allowSchema, number)
      expect(result.success).toBe(true)
    },
  )

  it.each(
    TEST_CARDS.map(c => [c.number, c.issuer, c.label] as const),
  )(
    'card %s is rejected when %s is not in allow list (%s)',
    async (number: string, issuer: string, _label: string) => {
      // Pick an issuer that differs from the card's actual issuer
      const otherIssuer = issuer === 'visa' ? 'mastercard' : 'visa'
      const blockSchema = creditCard({
        allowIssuers: [otherIssuer],
      })

      const result = await parseAsync(blockSchema, number)
      expect(result.success).toBe(false)
    },
  )
})
