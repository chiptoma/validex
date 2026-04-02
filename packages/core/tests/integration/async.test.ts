// ==============================================================================
// ASYNC INTEGRATION TESTS
// Validates full async flows for password, username, and email rules,
// plus preloadData behavior.
// ==============================================================================

import type { z } from 'zod'
import { beforeEach, describe, expect, it } from 'vitest'
import { preloadData } from '../../src/config'
import { validate } from '../../src/core/validate'
import { clearCommonPasswordsCache, getCommonPasswords } from '../../src/loaders/commonPasswords'
import { clearCountryCodesCache, getCountryCodes } from '../../src/loaders/countryCodes'
import { clearCreditCardPrefixesCache, getCreditCardPrefixes } from '../../src/loaders/creditCardPrefixes'
import { clearCurrencyCodesCache, getCurrencyCodes } from '../../src/loaders/currencyCodes'
import { clearDisposableDomainsCache, getDisposableDomains } from '../../src/loaders/disposableDomains'
import { clearIbanPatternsCache, getIbanPatterns } from '../../src/loaders/ibanPatterns'
import { clearPhoneParserCache, getPhoneParser } from '../../src/loaders/phoneParser'
import { clearPostalCodesCache, getPostalCodes } from '../../src/loaders/postalCodes'
import { getReservedUsernames, resetReservedUsernamesCache } from '../../src/loaders/reservedUsernames'
import { clearVatPatternsCache, getVatPatterns } from '../../src/loaders/vatPatterns'
import { Email } from '../../src/rules/email'
import { Password } from '../../src/rules/password'
import { Username } from '../../src/rules/username'

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

async function parseAsync(
  schema: unknown,
  value: unknown,
): Promise<{ success: boolean }> {
  return (schema as z.ZodType).safeParseAsync(value)
}

// ----------------------------------------------------------
// FULL ASYNC FLOW
// ----------------------------------------------------------

describe('full async flow', () => {
  beforeEach(() => {
    clearCommonPasswordsCache()
    resetReservedUsernamesCache()
  })

  it('blocks common password "password" via parseAsync', async () => {
    const schema = Password({
      blockCommon: true,
      length: { min: 1 },
      uppercase: undefined,
      lowercase: undefined,
      digits: undefined,
      special: undefined,
      consecutive: undefined,
    })

    const result = await parseAsync(schema, 'password')
    expect(result.success).toBe(false)
  })

  it('allows a non-common password via parseAsync', async () => {
    const schema = Password({
      blockCommon: true,
      length: { min: 1 },
      uppercase: undefined,
      lowercase: undefined,
      digits: undefined,
      special: undefined,
      consecutive: undefined,
    })

    const result = await parseAsync(schema, 'xk82mZpQ')
    expect(result.success).toBe(true)
  })

  it('blocks reserved username "admin" via parseAsync', async () => {
    const schema = Username({ blockReserved: true })

    const result = await parseAsync(schema, 'admin')
    expect(result.success).toBe(false)
  })

  it('allows a non-reserved username via parseAsync', async () => {
    const schema = Username({ blockReserved: true })

    const result = await parseAsync(schema, 'johndoe')
    expect(result.success).toBe(true)
  })

  it('blocks disposable email domains via parseAsync', async () => {
    const schema = Email({ blockDisposable: true })

    const result = await parseAsync(schema, 'test@mailinator.com')
    expect(result.success).toBe(false)
  })

  it('allows a legitimate email domain via parseAsync', async () => {
    const schema = Email({ blockDisposable: true })

    const result = await parseAsync(schema, 'user@gmail.com')
    expect(result.success).toBe(true)
  })

  it('validates all three async rules in one schema via validate()', async () => {
    const passwordSchema = Password({
      blockCommon: true,
      length: { min: 1 },
      uppercase: undefined,
      lowercase: undefined,
      digits: undefined,
      special: undefined,
      consecutive: undefined,
    })

    const usernameSchema = Username({ blockReserved: true })
    const emailSchema = Email({ blockDisposable: true })

    const pwResult = await validate(passwordSchema as z.ZodType, 'password')
    expect(pwResult.success).toBe(false)

    const unResult = await validate(usernameSchema as z.ZodType, 'admin')
    expect(unResult.success).toBe(false)

    const emResult = await validate(emailSchema as z.ZodType, 'test@mailinator.com')
    expect(emResult.success).toBe(false)

    const pwOk = await validate(passwordSchema as z.ZodType, 'xk82mZpQ')
    expect(pwOk.success).toBe(true)

    const unOk = await validate(usernameSchema as z.ZodType, 'johndoe')
    expect(unOk.success).toBe(true)

    const emOk = await validate(emailSchema as z.ZodType, 'user@gmail.com')
    expect(emOk.success).toBe(true)
  })
})

// ----------------------------------------------------------
// PRELOAD DATA
// ----------------------------------------------------------

describe('preloadData', () => {
  it('resolves without error when called with disposable option', async () => {
    await expect(preloadData({ disposable: true })).resolves.toBeUndefined()
  })

  it('resolves without error when called with passwords option', async () => {
    await expect(preloadData({ passwords: true })).resolves.toBeUndefined()
  })

  it('resolves without error when called with reserved option', async () => {
    await expect(preloadData({ reserved: true })).resolves.toBeUndefined()
  })

  it('resolves without error when called with all options', async () => {
    await expect(
      preloadData({ disposable: true, passwords: 'strict', reserved: true }),
    ).resolves.toBeUndefined()
  })

  it('is safe to call multiple times', async () => {
    await preloadData({ disposable: true })
    await expect(preloadData({ disposable: true })).resolves.toBeUndefined()
  })
})

// ----------------------------------------------------------
// PRELOAD DATA — BEHAVIORAL VERIFICATION
// ----------------------------------------------------------

describe('preloadData — behavioral verification', () => {
  beforeEach(() => {
    clearCommonPasswordsCache()
    clearDisposableDomainsCache()
    clearPhoneParserCache()
    clearCountryCodesCache()
    clearCurrencyCodesCache()
    clearIbanPatternsCache()
    clearVatPatternsCache()
    clearCreditCardPrefixesCache()
    clearPostalCodesCache()
    resetReservedUsernamesCache()
  })

  it('passwords: preloaded tier is accessible synchronously via getCommonPasswords', async () => {
    await preloadData({ passwords: 'strict' })
    const passwords = getCommonPasswords('strict')
    expect(passwords.size).toBe(9999)
    expect(passwords.has('password')).toBe(true)
  })

  it('passwords: Password({ blockCommon }) rejects "password" after preload', async () => {
    await preloadData({ passwords: true })
    const schema = Password({
      blockCommon: true,
      length: { min: 1 },
      uppercase: undefined,
      lowercase: undefined,
      digits: undefined,
      special: undefined,
      consecutive: undefined,
    })
    const result = await (schema as z.ZodType).safeParseAsync('password')
    expect(result.success).toBe(false)
  })

  it('disposable: domains are cached after preload', async () => {
    expect(() => getDisposableDomains()).toThrow()
    await preloadData({ disposable: true })
    const domains = getDisposableDomains()
    expect(domains).toBeDefined()
    expect(domains.has('mailinator.com')).toBe(true)
  })

  it('disposable: Email({ blockDisposable }) uses preloaded cache', async () => {
    await preloadData({ disposable: true })
    const schema = Email({ blockDisposable: true })
    const result = await (schema as z.ZodType).safeParseAsync('test@mailinator.com')
    expect(result.success).toBe(false)
  })

  it('phone: parser is cached after preload', async () => {
    expect(() => getPhoneParser('mobile')).toThrow()
    await preloadData({ phone: 'mobile' })
    const parser = getPhoneParser('mobile')
    expect(parser).toBeDefined()
    expect(typeof parser).toBe('function')
  })

  it('phone: preloaded min parser can parse a phone number', async () => {
    await preloadData({ phone: 'min' })
    const parser = getPhoneParser('min')
    expect(parser).toBeDefined()
    const parsed = parser('+14155552671')
    expect(parsed.isValid()).toBe(true)
  })

  it('countryCodes + currencyCodes: both cached after parallel preload', async () => {
    await preloadData({ countryCodes: true, currencyCodes: true })
    const countries = getCountryCodes()
    const currencies = getCurrencyCodes()
    expect(countries.size).toBe(249)
    expect(currencies.has('USD')).toBe(true)
    expect(currencies.has('EUR')).toBe(true)
  })

  it('reserved: usernames are cached after preload', async () => {
    await preloadData({ reserved: true })
    const reserved = getReservedUsernames()
    expect(reserved.has('admin')).toBe(true)
    expect(reserved.has('root')).toBe(true)
  })

  it('ibanPatterns: patterns are cached after preload', async () => {
    await preloadData({ ibanPatterns: true })
    const patterns = getIbanPatterns()
    expect(patterns.size).toBeGreaterThanOrEqual(70)
    expect(patterns.has('DE')).toBe(true)
  })

  it('vatPatterns: patterns are cached after preload', async () => {
    await preloadData({ vatPatterns: true })
    const patterns = getVatPatterns()
    expect(patterns.size).toBeGreaterThanOrEqual(28)
    expect(patterns.has('GB')).toBe(true)
  })

  it('creditCardPrefixes: issuers are cached after preload', async () => {
    await preloadData({ creditCardPrefixes: true })
    const issuers = getCreditCardPrefixes()
    expect(issuers.size).toBe(7)
    expect(issuers.has('visa')).toBe(true)
  })

  it('postalCodes: module is cached after preload', async () => {
    await preloadData({ postalCodes: true })
    const mod = getPostalCodes()
    expect(mod).toBeDefined()
    expect(typeof mod?.postcodeValidator).toBe('function')
  })

  it('all 10 options preload together without error', async () => {
    await preloadData({
      disposable: true,
      passwords: 'moderate',
      reserved: true,
      phone: 'min',
      countryCodes: true,
      currencyCodes: true,
      ibanPatterns: true,
      vatPatterns: true,
      creditCardPrefixes: true,
      postalCodes: true,
    })
    expect(getDisposableDomains()).toBeDefined()
    expect(getCommonPasswords('moderate').size).toBe(999)
    expect(getReservedUsernames().has('admin')).toBe(true)
    expect(getPhoneParser('min')).toBeDefined()
    expect(getCountryCodes().size).toBe(249)
    expect(getCurrencyCodes().has('USD')).toBe(true)
    expect(getIbanPatterns().has('DE')).toBe(true)
    expect(getVatPatterns().has('GB')).toBe(true)
    expect(getCreditCardPrefixes().has('visa')).toBe(true)
    expect(getPostalCodes()).toBeDefined()
  })
})
