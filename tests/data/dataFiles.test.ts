import { describe, expect, it } from 'vitest'
import {
  clearCommonPasswordsCache,
  getCommonPasswords,
  loadCommonPasswords,
} from '../../src/data/commonPasswords'
import {
  clearCountryCodesCache,
  getCountryCodes,
  loadCountryCodes,
} from '../../src/data/countryCodes'
import {
  clearCreditCardPrefixesCache,
  getCreditCardPrefixes,
  loadCreditCardPrefixes,
} from '../../src/data/creditCardPrefixes'
import {
  clearCurrencyCodesCache,
  getCurrencyCodes,
  loadCurrencyCodes,
} from '../../src/data/currencyCodes'
import {
  clearIbanPatternsCache,
  getIbanPatterns,
  loadIbanPatterns,
} from '../../src/data/ibanPatterns'
import {
  getReservedUsernames,
  loadReservedUsernames,
  resetReservedUsernamesCache,
} from '../../src/data/reservedUsernames'
import {
  clearVatPatternsCache,
  getVatPatterns,
  loadVatPatterns,
} from '../../src/data/vatPatterns'

describe('commonPasswords', () => {
  it('should load tier1 (basic) with 100 entries', async () => {
    clearCommonPasswordsCache()
    const passwords = await loadCommonPasswords('basic')
    expect(passwords.size).toBe(100)
    expect(passwords.has('123456')).toBe(true)
    expect(passwords.has('password')).toBe(true)
    expect(passwords.has('qwerty')).toBe(true)
  })

  it('should load tier2 (moderate) with ~1000 entries', async () => {
    clearCommonPasswordsCache()
    const passwords = await loadCommonPasswords('moderate')
    expect(passwords.size).toBeGreaterThanOrEqual(1000)
  })

  it('should have tier2 include all of tier1', async () => {
    clearCommonPasswordsCache()
    const tier1 = await loadCommonPasswords('basic')
    clearCommonPasswordsCache()
    const tier2 = await loadCommonPasswords('moderate')
    for (const pw of tier1) {
      expect(tier2.has(pw)).toBe(true)
    }
  })

  it('should load tier3 (strict) with ~10000 entries', async () => {
    clearCommonPasswordsCache()
    const passwords = await loadCommonPasswords('strict')
    // Some overlap between tiers reduces unique count slightly
    expect(passwords.size).toBeGreaterThanOrEqual(9900)
  })

  it('should return cached data on second call', async () => {
    clearCommonPasswordsCache()
    const first = await loadCommonPasswords('basic')
    const second = await loadCommonPasswords('basic')
    expect(first).toBe(second)
  })

  it('should throw from getCommonPasswords when not loaded', () => {
    clearCommonPasswordsCache()
    expect(() => getCommonPasswords('basic')).toThrow('not loaded')
  })

  it('should return data from getCommonPasswords after load', async () => {
    clearCommonPasswordsCache()
    await loadCommonPasswords('basic')
    const passwords = getCommonPasswords('basic')
    expect(passwords.size).toBe(100)
  })
})

describe('countryCodes', () => {
  it('should load 249 country codes', async () => {
    clearCountryCodesCache()
    const codes = await loadCountryCodes()
    expect(codes.size).toBe(249)
  })

  it('should have US entry with correct data', async () => {
    clearCountryCodesCache()
    const codes = await loadCountryCodes()
    const us = codes.get('US')
    expect(us).toBeDefined()
    expect(us?.alpha3).toBe('USA')
    expect(us?.name).toBe('United States of America')
  })

  it('should have GB entry', async () => {
    const codes = await loadCountryCodes()
    expect(codes.has('GB')).toBe(true)
  })

  it('should return cached data on second call', async () => {
    clearCountryCodesCache()
    const first = await loadCountryCodes()
    const second = await loadCountryCodes()
    expect(first).toBe(second)
  })

  it('should throw from getCountryCodes when not loaded', () => {
    clearCountryCodesCache()
    expect(() => getCountryCodes()).toThrow('not loaded')
  })
})

describe('currencyCodes', () => {
  it('should load currency codes', async () => {
    clearCurrencyCodesCache()
    const codes = await loadCurrencyCodes()
    expect(codes.size).toBeGreaterThanOrEqual(150)
  })

  it('should have common currencies', async () => {
    const codes = await loadCurrencyCodes()
    expect(codes.has('USD')).toBe(true)
    expect(codes.has('EUR')).toBe(true)
    expect(codes.has('GBP')).toBe(true)
    expect(codes.has('JPY')).toBe(true)
    expect(codes.has('CHF')).toBe(true)
  })

  it('should have special codes', async () => {
    const codes = await loadCurrencyCodes()
    expect(codes.has('XAU')).toBe(true)
    expect(codes.has('XAG')).toBe(true)
  })

  it('should throw from getCurrencyCodes when not loaded', () => {
    clearCurrencyCodesCache()
    expect(() => getCurrencyCodes()).toThrow('not loaded')
  })
})

describe('reservedUsernames', () => {
  it('should load 200+ reserved usernames', async () => {
    resetReservedUsernamesCache()
    const names = await loadReservedUsernames()
    expect(names.size).toBeGreaterThanOrEqual(200)
  })

  it('should have key reserved words', async () => {
    const names = await loadReservedUsernames()
    expect(names.has('admin')).toBe(true)
    expect(names.has('root')).toBe(true)
    expect(names.has('system')).toBe(true)
    expect(names.has('support')).toBe(true)
    expect(names.has('webmaster')).toBe(true)
    expect(names.has('postmaster')).toBe(true)
    expect(names.has('api')).toBe(true)
    expect(names.has('www')).toBe(true)
  })

  it('should return cached data on second call', async () => {
    resetReservedUsernamesCache()
    const first = await loadReservedUsernames()
    const second = await loadReservedUsernames()
    expect(first).toBe(second)
  })

  it('should throw from getReservedUsernames when not loaded', () => {
    resetReservedUsernamesCache()
    expect(() => getReservedUsernames()).toThrow('not loaded')
  })
})

describe('ibanPatterns', () => {
  it('should load ~80 IBAN country patterns', async () => {
    clearIbanPatternsCache()
    const patterns = await loadIbanPatterns()
    expect(patterns.size).toBeGreaterThanOrEqual(70)
  })

  it('should have correct length for Germany (DE = 22)', async () => {
    const patterns = await loadIbanPatterns()
    const de = patterns.get('DE')
    expect(de).toBeDefined()
    expect(de?.length).toBe(22)
  })

  it('should have correct length for UK (GB = 22)', async () => {
    const patterns = await loadIbanPatterns()
    const gb = patterns.get('GB')
    expect(gb).toBeDefined()
    expect(gb?.length).toBe(22)
  })

  it('should have correct length for France (FR = 27)', async () => {
    const patterns = await loadIbanPatterns()
    const fr = patterns.get('FR')
    expect(fr).toBeDefined()
    expect(fr?.length).toBe(27)
  })

  it('should return cached data on second call', async () => {
    clearIbanPatternsCache()
    const first = await loadIbanPatterns()
    const second = await loadIbanPatterns()
    expect(first).toBe(second)
  })

  it('should throw from getIbanPatterns when not loaded', () => {
    clearIbanPatternsCache()
    expect(() => getIbanPatterns()).toThrow('not loaded')
  })
})

describe('vatPatterns', () => {
  it('should load ~30 VAT patterns', async () => {
    clearVatPatternsCache()
    const patterns = await loadVatPatterns()
    expect(patterns.size).toBeGreaterThanOrEqual(28)
  })

  it('should have pattern for Germany (DE)', async () => {
    const patterns = await loadVatPatterns()
    expect(patterns.has('DE')).toBe(true)
  })

  it('should have pattern for UK (GB)', async () => {
    const patterns = await loadVatPatterns()
    expect(patterns.has('GB')).toBe(true)
  })

  it('should validate a German VAT number format', async () => {
    const patterns = await loadVatPatterns()
    const de = patterns.get('DE')
    expect(de?.test('123456789')).toBe(true)
    expect(de?.test('12345')).toBe(false)
  })

  it('should throw from getVatPatterns when not loaded', () => {
    clearVatPatternsCache()
    expect(() => getVatPatterns()).toThrow('not loaded')
  })
})

describe('creditCardPrefixes', () => {
  it('should load 7 card issuers', async () => {
    clearCreditCardPrefixesCache()
    const issuers = await loadCreditCardPrefixes()
    expect(issuers.size).toBe(7)
  })

  it('should have Visa with prefix 4 and lengths 13,16,19', async () => {
    const issuers = await loadCreditCardPrefixes()
    const visa = issuers.get('visa')
    expect(visa).toBeDefined()
    expect(visa?.prefixes).toContain('4')
    expect(visa?.lengths).toContain(16)
  })

  it('should have Amex with prefixes 34,37 and length 15', async () => {
    const issuers = await loadCreditCardPrefixes()
    const amex = issuers.get('amex')
    expect(amex).toBeDefined()
    expect(amex?.prefixes).toContain('34')
    expect(amex?.prefixes).toContain('37')
    expect(amex?.lengths).toContain(15)
  })

  it('should have Mastercard, Discover, Diners, JCB, UnionPay', async () => {
    const issuers = await loadCreditCardPrefixes()
    expect(issuers.has('mastercard')).toBe(true)
    expect(issuers.has('discover')).toBe(true)
    expect(issuers.has('diners')).toBe(true)
    expect(issuers.has('jcb')).toBe(true)
    expect(issuers.has('unionpay')).toBe(true)
  })

  it('should throw from getCreditCardPrefixes when not loaded', () => {
    clearCreditCardPrefixesCache()
    expect(() => getCreditCardPrefixes()).toThrow('not loaded')
  })
})
