// ==============================================================================
// COUNTRY RULE TESTS
// Tests for the country code validation rule covering alpha-2, alpha-3,
// allow/block lists, normalization, and security vectors.
// ==============================================================================

import { describe, expect, it } from 'vitest'

import { Country } from '@rules/country'

import { firstParamsAsync, parseAsync } from '../../_support/helpers/parse'
import { testRuleContract } from '../../_support/helpers/testRule'

// ----------------------------------------------------------
// CONTRACT TESTS
// ----------------------------------------------------------

testRuleContract('Country', Country as (opts?: Record<string, unknown>) => unknown, 'country')

// ----------------------------------------------------------
// VALID ALPHA-2 CODES
// ----------------------------------------------------------

describe('country (alpha2)', () => {
  const schema = Country({ format: 'alpha2' })

  it.each([
    'US',
    'GB',
    'FR',
    'DE',
    'JP',
    'CN',
    'AU',
    'CA',
    'BR',
    'IN',
    'ES',
    'IT',
  ])('accepts valid alpha-2 code: %s', async (value) => {
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(true)
  })

  it.each([
    'XX',
    'ZZ',
    '12',
    'USA',
    'abc',
    'A',
    '1A',
    'A1',
    '!!',
    'QQ',
    'ZX',
  ])('rejects invalid alpha-2 code: %s', async (value) => {
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// VALID ALPHA-3 CODES
// ----------------------------------------------------------

describe('country (alpha3)', () => {
  const schema = Country({ format: 'alpha3' })

  it.each([
    'USA',
    'GBR',
    'FRA',
    'DEU',
    'JPN',
    'CHN',
    'AUS',
    'CAN',
    'BRA',
    'IND',
  ])('accepts valid alpha-3 code: %s', async (value) => {
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(true)
  })

  it.each([
    'US',
    'XX',
    'ZZZ',
    '123',
    'AAA',
  ])('rejects invalid alpha-3 code: %s', async (value) => {
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// NORMALIZATION
// ----------------------------------------------------------

describe('country (normalization)', () => {
  it('normalizes lowercase to uppercase', async () => {
    const schema = Country({ format: 'alpha2' })
    const result = await parseAsync(schema, 'us')
    expect(result.success).toBe(true)
  })

  it('trims whitespace', async () => {
    const schema = Country({ format: 'alpha2' })
    const result = await parseAsync(schema, '  US  ')
    expect(result.success).toBe(true)
  })

  it('rejects lowercase without normalization', async () => {
    const schema = Country({ format: 'alpha2', normalize: false })
    const result = await parseAsync(schema, 'us')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// ALLOW COUNTRIES
// ----------------------------------------------------------

describe('country (allowCountries)', () => {
  const schema = Country({
    format: 'alpha2',
    allowCountries: ['US', 'GB'],
  })

  it('accepts allowed country', async () => {
    const result = await parseAsync(schema, 'US')
    expect(result.success).toBe(true)
  })

  it('accepts second allowed country', async () => {
    const result = await parseAsync(schema, 'GB')
    expect(result.success).toBe(true)
  })

  it('rejects non-allowed valid country', async () => {
    const result = await parseAsync(schema, 'FR')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// BLOCK COUNTRIES
// ----------------------------------------------------------

describe('country (blockCountries)', () => {
  const schema = Country({
    format: 'alpha2',
    blockCountries: ['RU'],
  })

  it('rejects blocked country', async () => {
    const result = await parseAsync(schema, 'RU')
    expect(result.success).toBe(false)
  })

  it('accepts non-blocked country', async () => {
    const result = await parseAsync(schema, 'US')
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// EMPTY TO UNDEFINED
// ----------------------------------------------------------

describe('country (emptyToUndefined)', () => {
  it('rejects empty string by default', async () => {
    const schema = Country()
    const result = await parseAsync(schema, '')
    expect(result.success).toBe(false)
  })
})

// ----------------------------------------------------------
// SECURITY VECTORS
// ----------------------------------------------------------

// ----------------------------------------------------------
// LABEL IN ERROR PARAMS
// ----------------------------------------------------------

describe('country (label)', () => {
  it('includes label in error params', async () => {
    const schema = Country({ label: 'Country Code' })
    const params = await firstParamsAsync(schema, 'invalid!!!')
    expect(params.label).toBe('Country Code')
  })
})

// ----------------------------------------------------------
// SECURITY VECTORS
// ----------------------------------------------------------

describe('country (security)', () => {
  const schema = Country({ format: 'alpha2' })

  it.each([
    'US<script>alert(1)</script>',
    'US\nGB',
    'US; DROP TABLE',
    'US\0',
    'US\u200B',
    'javascript:void(0)',
    'US'.repeat(100),
    '<img src=x onerror=alert(1)>',
    '../../etc/passwd',
    'null',
    'undefined',
  ])('rejects malicious input: %s', async (value) => {
    const result = await parseAsync(schema, value)
    expect(result.success).toBe(false)
  })
})
