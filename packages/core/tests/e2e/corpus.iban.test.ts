// ==============================================================================
// EXTERNAL IBAN VALIDATION TESTS
// Regression tests using published IBAN test numbers from IBAN.com and
// banking documentation, covering valid IBANs, normalization, and rejection
// of structurally or checksum-invalid inputs.
// ------------------------------------------------------------------------------
// NOTE: These are permanent regression tests. If a case fails, investigate
//   whether the rule or the expectation needs updating, not both.
// ==============================================================================

import { describe, expect, it } from 'vitest'

import { Iban } from '@rules/iban'

import { parseAsync } from '../_support/helpers/parse'

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Corrupt Digit
 * Flips a single digit in an IBAN string to break the MOD-97 checksum.
 * Targets the last numeric character in the string.
 *
 * @param ibanStr - A valid IBAN string.
 * @returns A corrupted IBAN that should fail mod-97 validation.
 */
function corruptDigit(ibanStr: string): string {
  const chars = [...ibanStr]

  for (let i = chars.length - 1; i >= 0; i--) {
    const ch = chars[i]
    if (ch !== undefined && ch >= '0' && ch <= '9') {
      chars[i] = ch === '9' ? '0' : String(Number(ch) + 1)
      break
    }
  }

  return chars.join('')
}

// ----------------------------------------------------------
// TEST DATA
// ----------------------------------------------------------

/**
 * Published IBAN test numbers from IBAN.com and banking documentation.
 * Each entry is [IBAN, country description].
 */
const VALID_IBANS: ReadonlyArray<readonly [string, string]> = [
  ['GB82WEST12345698765432', 'United Kingdom'],
  ['DE89370400440532013000', 'Germany'],
  ['FR7630006000011234567890189', 'France'],
  ['ES9121000418450200051332', 'Spain'],
  ['IT60X0542811101000000123456', 'Italy'],
  ['NL91ABNA0417164300', 'Netherlands'],
  ['CH9300762011623852957', 'Switzerland'],
  ['AT611904300234573201', 'Austria'],
  ['BE68539007547034', 'Belgium'],
  ['PT50000201231234567890154', 'Portugal'],
  ['SE4550000000058398257466', 'Sweden'],
  ['NO9386011117947', 'Norway'],
  ['DK5000400440116243', 'Denmark'],
  ['FI2112345600000785', 'Finland'],
  ['PL61109010140000071219812874', 'Poland'],
  ['CZ6508000000192000145399', 'Czech Republic'],
  ['IE29AIBK93115212345678', 'Ireland'],
  ['LU280019400644750000', 'Luxembourg'],
]

// ----------------------------------------------------------
// VALID IBANS
// ----------------------------------------------------------

describe('external IBAN corpus — valid IBANs', () => {
  const schema = Iban()

  it.each(VALID_IBANS)(
    'accepts valid IBAN: %s (%s)',
    async (value: string, _country: string) => {
      const result = await parseAsync(schema, value)
      expect(result.success).toBe(true)
    },
  )
})

// ----------------------------------------------------------
// NORMALIZATION — SPACES
// ----------------------------------------------------------

describe('external IBAN corpus — space normalization', () => {
  const schema = Iban()

  const spacedIbans: ReadonlyArray<readonly [string, string, string]> = [
    ['GB82 WEST 1234 5698 7654 32', 'GB82WEST12345698765432', 'UK with spaces'],
    ['DE89 3704 0044 0532 0130 00', 'DE89370400440532013000', 'Germany with spaces'],
    ['FR76 3000 6000 0112 3456 7890 189', 'FR7630006000011234567890189', 'France with spaces'],
    ['NL91 ABNA 0417 1643 00', 'NL91ABNA0417164300', 'Netherlands with spaces'],
    ['BE68 5390 0754 7034', 'BE68539007547034', 'Belgium with spaces'],
    ['NO93 8601 1117 947', 'NO9386011117947', 'Norway with spaces'],
  ]

  it.each(spacedIbans)(
    'normalizes spaced IBAN: %s → %s (%s)',
    async (input: string, expected: string, _label: string) => {
      const result = await parseAsync(schema, input)
      expect(result.success).toBe(true)
      expect(result.data).toBe(expected)
    },
  )
})

// ----------------------------------------------------------
// NORMALIZATION — LOWERCASE
// ----------------------------------------------------------

describe('external IBAN corpus — lowercase normalization', () => {
  const schema = Iban()

  const lowercaseIbans: ReadonlyArray<readonly [string, string, string]> = [
    ['gb82west12345698765432', 'GB82WEST12345698765432', 'UK lowercase'],
    ['de89370400440532013000', 'DE89370400440532013000', 'Germany lowercase'],
    ['nl91abna0417164300', 'NL91ABNA0417164300', 'Netherlands lowercase'],
    ['ie29aibk93115212345678', 'IE29AIBK93115212345678', 'Ireland lowercase'],
    ['ch9300762011623852957', 'CH9300762011623852957', 'Switzerland lowercase'],
  ]

  it.each(lowercaseIbans)(
    'normalizes lowercase IBAN: %s → %s (%s)',
    async (input: string, expected: string, _label: string) => {
      const result = await parseAsync(schema, input)
      expect(result.success).toBe(true)
      expect(result.data).toBe(expected)
    },
  )
})

// ----------------------------------------------------------
// CHECKSUM VALIDATION — CORRUPTED DIGIT
// ----------------------------------------------------------

describe('external IBAN corpus — corrupted checksum', () => {
  const schema = Iban()

  it.each(VALID_IBANS)(
    'rejects corrupted IBAN derived from: %s (%s)',
    async (value: string, _country: string) => {
      const corrupted = corruptDigit(value)
      const result = await parseAsync(schema, corrupted)
      expect(result.success).toBe(false)
    },
  )
})

// ----------------------------------------------------------
// WRONG LENGTH FOR COUNTRY
// ----------------------------------------------------------

describe('external IBAN corpus — wrong length for country', () => {
  const schema = Iban()

  const wrongLengthCases: ReadonlyArray<readonly [string, string]> = [
    ['GB82WEST1234569876543', 'UK too short (removed last char)'],
    ['GB82WEST123456987654321', 'UK too long (added digit)'],
    ['DE8937040044053201300', 'Germany too short'],
    ['DE893704004405320130001', 'Germany too long'],
    ['NL91ABNA041716430', 'Netherlands too short'],
    ['NL91ABNA04171643001', 'Netherlands too long'],
    ['BE6853900754703', 'Belgium too short'],
    ['BE685390075470341', 'Belgium too long'],
  ]

  it.each(wrongLengthCases)(
    'rejects wrong-length IBAN: %s (%s)',
    async (value: string, _label: string) => {
      const result = await parseAsync(schema, value)
      expect(result.success).toBe(false)
    },
  )
})

// ----------------------------------------------------------
// UNKNOWN COUNTRY CODE
// ----------------------------------------------------------

describe('external IBAN corpus — unknown country code', () => {
  const schema = Iban()

  const unknownCountryCases: ReadonlyArray<readonly [string, string]> = [
    ['XX82WEST12345698765432', 'XX is not a valid country code'],
    ['ZZ89370400440532013000', 'ZZ is not a valid country code'],
    ['QQ91ABNA0417164300', 'QQ is not a valid country code'],
    ['AA68539007547034', 'AA is not a valid country code'],
  ]

  it.each(unknownCountryCases)(
    'rejects unknown country code: %s (%s)',
    async (value: string, _label: string) => {
      const result = await parseAsync(schema, value)
      expect(result.success).toBe(false)
    },
  )
})

// ----------------------------------------------------------
// STRUCTURAL REJECTIONS
// ----------------------------------------------------------

describe('external IBAN corpus — structural rejections', () => {
  const schema = Iban()

  const structuralCases: ReadonlyArray<readonly [string, string]> = [
    ['', 'empty string'],
    ['NOTANIBAN', 'random text'],
    ['12345678901234567890', 'digits only, no country code'],
    ['GB', 'country code only'],
    ['GB82', 'country code and check digits only'],
  ]

  it.each(structuralCases)(
    'rejects structurally invalid: %s (%s)',
    async (value: string, _label: string) => {
      const result = await parseAsync(schema, value)
      expect(result.success).toBe(false)
    },
  )
})
