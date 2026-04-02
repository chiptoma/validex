// ==============================================================================
// CURRENCY RULE TESTS
// Tests for the currency code validation rule covering valid/invalid codes,
// allow/block lists, normalization, and security vectors.
// ==============================================================================

import type { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { Currency } from '../../../src/rules/currency'

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
// VALID CURRENCY CODES
// ----------------------------------------------------------

describe('currency (valid codes)', () => {
  const schema = Currency()

  it.each([
    'USD',
    'EUR',
    'GBP',
    'JPY',
    'CHF',
    'CAD',
    'AUD',
    'CNY',
    'SEK',
    'NOK',
    'INR',
    'BRL',
  ])('accepts valid currency code: %s', async (value) => {
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(true)
  })

  it.each([
    'ABC',
    '123',
    '',
    'ABCD',
    'U',
    'US',
    '!@#',
    'ZZZ',
    'AAA',
    'XYZ',
  ])('rejects invalid currency code: %s', async (value) => {
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// SPECIAL CODES
// ----------------------------------------------------------

describe('currency (special ISO 4217 codes)', () => {
  const schema = Currency()

  it.each([
    'XAU',
    'XAG',
    'XPT',
    'XPD',
    'XDR',
  ])('accepts special code: %s', async (value) => {
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// NORMALIZATION
// ----------------------------------------------------------

describe('currency (normalization)', () => {
  it('normalizes lowercase to uppercase', async () => {
    const schema = Currency()
    const result = await parseAsync(schema, 'usd')
    expect(result.success).toBe(true)
  })

  it('trims whitespace', async () => {
    const schema = Currency()
    const result = await parseAsync(schema, '  EUR  ')
    expect(result.success).toBe(true)
  })

  it('rejects lowercase without normalization', async () => {
    const schema = Currency({ normalize: false })
    const result = await parseAsync(schema, 'usd')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// ALLOW CURRENCIES
// ----------------------------------------------------------

describe('currency (allowCurrencies)', () => {
  const schema = Currency({
    allowCurrencies: ['USD', 'EUR'],
  })

  it('accepts allowed currency', async () => {
    const result = await parseAsync(schema, 'USD')
    expect(result.success).toBe(true)
  })

  it('accepts second allowed currency', async () => {
    const result = await parseAsync(schema, 'EUR')
    expect(result.success).toBe(true)
  })

  it('rejects non-allowed valid currency', async () => {
    const result = await parseAsync(schema, 'GBP')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// BLOCK CURRENCIES
// ----------------------------------------------------------

describe('currency (blockCurrencies)', () => {
  const schema = Currency({
    blockCurrencies: ['RUB'],
  })

  it('rejects blocked currency', async () => {
    const result = await parseAsync(schema, 'RUB')
    expect(result.success).toBe(false)
  })

  it('accepts non-blocked currency', async () => {
    const result = await parseAsync(schema, 'USD')
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// EMPTY TO UNDEFINED
// ----------------------------------------------------------

describe('currency (emptyToUndefined)', () => {
  it('rejects empty string by default', async () => {
    const schema = Currency()
    const result = await parseAsync(schema, '')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// SECURITY VECTORS
// ----------------------------------------------------------

describe('currency (security)', () => {
  const schema = Currency()

  it.each([
    'USD<script>alert(1)</script>',
    'USD\nEUR',
    'USD; DROP TABLE',
    'USD\0',
    'USD\u200B',
    'javascript:void(0)',
    'USD'.repeat(100),
    '<img src=x onerror=alert(1)>',
    '../../etc/passwd',
    'null',
    'undefined',
  ])('rejects malicious input: %s', async (value) => {
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(false)
  })
})
