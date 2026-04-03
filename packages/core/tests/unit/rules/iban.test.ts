// ==============================================================================
// IBAN RULE TESTS
// Tests for IBAN validation covering MOD-97 checksum, country patterns,
// formatted input, allow/block lists, and security vectors.
// ==============================================================================

import type { z } from 'zod'

import { describe, expect, it } from 'vitest'

import { Iban } from '@rules/iban'

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
  'iban',
  Iban as (opts?: Record<string, unknown>) => unknown,
  'iban',
)

// ----------------------------------------------------------
// VALID IBANS
// ----------------------------------------------------------

describe('iban (valid)', () => {
  const schema = Iban()

  it.each([
    'DE89370400440532013000',
    'GB29NWBK60161331926819',
    'FR7630006000011234567890189',
    'ES9121000418450200051332',
    'IT60X0542811101000000123456',
    'NL91ABNA0417164300',
    'CH9300762011623852957',
    'AT611904300234573201',
    'BE68539007547034',
    'PT50000201231234567890154',
  ])('accepts valid IBAN: %s', async (value) => {
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// INVALID IBANS
// ----------------------------------------------------------

describe('iban (invalid)', () => {
  const schema = Iban()

  it.each([
    'DE00370400440532013000',
    'XX89370400440532013000',
    'DE893704004405320130001234',
    'DE8937040044053201300',
    '1234567890',
    'INVALIDIBAN',
    '',
    'DE89 3704 XXXX 0532 0130 00',
    'de89370400440532013000EXTRA',
    'AB12',
    '!@#$%^&*()',
  ])('rejects invalid IBAN: %s', async (value) => {
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// FORMATTED INPUT
// ----------------------------------------------------------

describe('iban (formatted input)', () => {
  const schema = Iban()

  it('accepts IBAN with spaces', async () => {
    const result = await parseAsync(schema, 'DE89 3704 0044 0532 0130 00')
    expect(result.success).toBe(true)
  })

  it('accepts lowercase IBAN (normalized)', async () => {
    const result = await parseAsync(schema, 'de89370400440532013000')
    expect(result.success).toBe(true)
  })

  it('accepts IBAN with leading/trailing spaces', async () => {
    const result = await parseAsync(schema, '  GB29NWBK60161331926819  ')
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// ALLOW COUNTRIES
// ----------------------------------------------------------

describe('iban (allowCountries)', () => {
  const schema = Iban({ allowCountries: ['DE', 'GB'] })

  it('accepts allowed country DE', async () => {
    const result = await parseAsync(schema, 'DE89370400440532013000')
    expect(result.success).toBe(true)
  })

  it('accepts allowed country GB', async () => {
    const result = await parseAsync(schema, 'GB29NWBK60161331926819')
    expect(result.success).toBe(true)
  })

  it('rejects non-allowed country FR', async () => {
    const result = await parseAsync(schema, 'FR7630006000011234567890189')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// BLOCK COUNTRIES
// ----------------------------------------------------------

describe('iban (blockCountries)', () => {
  const schema = Iban({ blockCountries: ['ES'] })

  it('rejects blocked country ES', async () => {
    const result = await parseAsync(schema, 'ES9121000418450200051332')
    expect(result.success).toBe(false)
  })

  it('accepts non-blocked country DE', async () => {
    const result = await parseAsync(schema, 'DE89370400440532013000')
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// MOD-97 CHECKSUM
// ----------------------------------------------------------

describe('iban (MOD-97)', () => {
  it('fails when a digit is modified', async () => {
    const schema = Iban()
    const result = await parseAsync(schema, 'DE89370400440532013001')
    expect(result.success).toBe(false)
  })

  it('fails when check digits are wrong', async () => {
    const schema = Iban()
    const result = await parseAsync(schema, 'DE00370400440532013000')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// EMPTY TO UNDEFINED
// ----------------------------------------------------------

describe('iban (emptyToUndefined)', () => {
  it('rejects empty string by default', async () => {
    const schema = Iban()
    const result = await parseAsync(schema, '')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// SECURITY VECTORS
// ----------------------------------------------------------

describe('iban (security)', () => {
  const schema = Iban()

  it.each([
    'DE89370400440532013000<script>alert(1)</script>',
    'DE89370400440532013000\nGB29NWBK60161331926819',
    'DE89370400440532013000; DROP TABLE',
    'DE89370400440532013000\0',
    'DE89370400440532013000\u200B',
    'javascript:void(0)',
    'DE'.repeat(100),
    '<img src=x onerror=alert(1)>',
    '../../etc/passwd',
    'null',
    'undefined',
  ])('rejects malicious input: %s', async (value) => {
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(false)
  })
})

describe('iban — edge cases', () => {
  it('preserves case when normalize is false', async () => {
    const schema = Iban({ normalize: false }) as z.ZodType
    const result = await schema.safeParseAsync('DE89370400440532013000')
    expect(result.success).toBe(true)
    if (result.success)
      expect(result.data).toBe('DE89370400440532013000')
  })

  it('uses empty array fallback when country constraints are cleared', async () => {
    // Passing undefined clears three-tier defaults, triggering ?? [] fallback
    const schema = Iban({ allowCountries: undefined, blockCountries: undefined }) as z.ZodType
    const result = await schema.safeParseAsync('DE89370400440532013000')
    expect(result.success).toBe(true)
  })
})
