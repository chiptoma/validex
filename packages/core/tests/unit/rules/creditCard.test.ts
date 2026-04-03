// ==============================================================================
// CREDIT CARD RULE TESTS
// Tests for credit card validation covering Luhn checksum, issuer detection,
// formatted input, allow/block lists, and security vectors.
// ==============================================================================

import type { z } from 'zod'

import { describe, expect, it } from 'vitest'

import { CreditCard } from '@rules/creditCard'

import { testRuleContract } from '../../_support/helpers/testRule'

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Parse Async
 * Runs safeParseAsync on the given schema and value.
 *
 * @param schema - The Zod schema (from rule factory).
 * @param value  - The value to parse.
 * @returns The safe parse result.
 */
async function parseAsync(
  schema: unknown,
  value: unknown,
): Promise<{ success: boolean, data?: unknown, error?: unknown }> {
  return (schema as z.ZodType).safeParseAsync(value)
}

// ----------------------------------------------------------
// CONTRACT
// ----------------------------------------------------------

testRuleContract(
  'creditCard',
  CreditCard as (opts?: Record<string, unknown>) => unknown,
  'creditCard',
)

// ----------------------------------------------------------
// VALID CARD NUMBERS
// ----------------------------------------------------------

describe('creditCard (valid)', () => {
  const schema = CreditCard()

  it.each([
    '4532015112830366',
    '4916338506082832',
    '4024007198964305',
    '5425233430109903',
    '5105105105105100',
    '371449635398431',
    '378282246310005',
    '6011111111111117',
    '3530111333300000',
    '30569309025904',
  ])('accepts valid card: %s', async (value) => {
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// INVALID CARD NUMBERS
// ----------------------------------------------------------

describe('creditCard (invalid)', () => {
  const schema = CreditCard()

  it.each([
    '1234567890123456',
    'not-a-number',
    '1234',
    '12345678901234567890',
    '',
    '1111111111111111',
    'abcdefghijklmnop',
    '4532015112830367',
    '411111111111112',
    '9999999999999999',
  ])('rejects invalid card: %s', async (value) => {
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// FORMATTED INPUT
// ----------------------------------------------------------

describe('creditCard (formatted input)', () => {
  const schema = CreditCard()

  it('accepts card with spaces', async () => {
    const result = await parseAsync(schema, '4532 0151 1283 0366')
    expect(result.success).toBe(true)
  })

  it('accepts card with dashes', async () => {
    const result = await parseAsync(schema, '4532-0151-1283-0366')
    expect(result.success).toBe(true)
  })

  it('accepts card with mixed formatting', async () => {
    const result = await parseAsync(schema, '  4532-0151 1283-0366  ')
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// ALLOW ISSUERS
// ----------------------------------------------------------

describe('creditCard (allowIssuers)', () => {
  const schema = CreditCard({ allowIssuers: ['visa'] })

  it('accepts Visa when allowed', async () => {
    const result = await parseAsync(schema, '4532015112830366')
    expect(result.success).toBe(true)
  })

  it('rejects Amex when not in allow list', async () => {
    const result = await parseAsync(schema, '371449635398431')
    expect(result.success).toBe(false)
  })

  it('rejects Mastercard when not in allow list', async () => {
    const result = await parseAsync(schema, '5425233430109903')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// BLOCK ISSUERS
// ----------------------------------------------------------

describe('creditCard (blockIssuers)', () => {
  const schema = CreditCard({ blockIssuers: ['amex'] })

  it('rejects blocked Amex', async () => {
    const result = await parseAsync(schema, '371449635398431')
    expect(result.success).toBe(false)
  })

  it('accepts non-blocked Visa', async () => {
    const result = await parseAsync(schema, '4532015112830366')
    expect(result.success).toBe(true)
  })

  it('accepts non-blocked Mastercard', async () => {
    const result = await parseAsync(schema, '5425233430109903')
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// LUHN CHECK
// ----------------------------------------------------------

describe('creditCard (Luhn)', () => {
  it('fails when last digit of valid card is modified', async () => {
    const schema = CreditCard()
    const result = await parseAsync(schema, '4532015112830365')
    expect(result.success).toBe(false)
  })

  it('fails when middle digit is modified', async () => {
    const schema = CreditCard()
    const result = await parseAsync(schema, '4532015112830466')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// EMPTY TO UNDEFINED
// ----------------------------------------------------------

describe('creditCard (emptyToUndefined)', () => {
  it('rejects empty string by default', async () => {
    const schema = CreditCard()
    const result = await parseAsync(schema, '')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// SECURITY VECTORS
// ----------------------------------------------------------

describe('creditCard (security)', () => {
  const schema = CreditCard()

  it.each([
    '4532015112830366<script>alert(1)</script>',
    '4532015112830366\n5105105105105100',
    '4532015112830366; DROP TABLE',
    '4532015112830366\0',
    '4532015112830366\u200B',
    'javascript:void(0)',
    '4'.repeat(200),
    '<img src=x onerror=alert(1)>',
    '../../etc/passwd',
    'null',
    'undefined',
  ])('rejects malicious input: %s', async (value) => {
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(false)
  })
})

describe('creditCard — edge cases', () => {
  it('rejects unrecognized card prefix with allowIssuers constraint', async () => {
    const schema = CreditCard({ allowIssuers: ['visa'] }) as z.ZodType
    // 9999000000000004 passes Luhn but 9999 prefix is not recognized by any issuer
    const result = await schema.safeParseAsync('9999000000000004')
    expect(result.success).toBe(false)
  })

  it('preserves original input when normalize is false', async () => {
    const schema = CreditCard({ normalize: false }) as z.ZodType
    // Without normalization, spaces/dashes are NOT stripped, causing format failure
    const result = await schema.safeParseAsync('4532 0151 1283 0366')
    expect(result.success).toBe(false)
    // Digits-only should still pass
    const ok = await schema.safeParseAsync('4532015112830366')
    expect(ok.success).toBe(true)
  })
})
