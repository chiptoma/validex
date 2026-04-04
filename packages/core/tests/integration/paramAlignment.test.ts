// ==============================================================================
// PARAM MISMATCH TESTS
// Verifies that every .refine() with a parameterized en.json message passes
// the required interpolation parameter (domain, country, protocol, etc.).
// ------------------------------------------------------------------------------
// GUARD 1: Every test also asserts the raw params do NOT contain '{{'.
// ==============================================================================

import { describe, expect, it } from 'vitest'

import { Country } from '@rules/country'
import { CreditCard } from '@rules/creditCard'
import { Currency } from '@rules/currency'
import { Email } from '@rules/email'
import { Iban } from '@rules/iban'
import { Jwt } from '@rules/jwt'
import { Phone } from '@rules/phone'
import { Url } from '@rules/url'
import { Username } from '@rules/username'
import { Website } from '@rules/website'

import { firstParams, firstParamsAsync } from '../_support/helpers/parse'

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Assert No Leaked Placeholders
 * Guard 1: Checks that no param value contains '{{'.
 *
 * @param params - The extracted params object.
 */
function assertNoLeakedPlaceholders(params: Record<string, unknown>): void {
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      expect(value, `Param "${key}" contains leaked placeholder`).not.toContain('{{')
    }
  }
}

// ----------------------------------------------------------
// R1.1 — Email: blockDomains (domain param)
// ----------------------------------------------------------

describe('r1.1 — Email blockDomains passes domain param', () => {
  const schema = Email({ blockDomains: ['evil.com', 'spam.net'] })

  it('includes actual domain in error params', () => {
    const params = firstParams(schema, 'user@evil.com')
    expect(params.code).toBe('domainBlocked')
    expect(params['domain']).toBe('evil.com')
    assertNoLeakedPlaceholders(params)
  })
})

// ----------------------------------------------------------
// R1.2 — Email: allowDomains (domain param)
// ----------------------------------------------------------

describe('r1.2 — Email allowDomains passes domain param', () => {
  const schema = Email({ allowDomains: ['example.com'] })

  it('includes actual domain in error params', () => {
    const params = firstParams(schema, 'user@other.com')
    expect(params.code).toBe('domainNotAllowed')
    expect(params['domain']).toBe('other.com')
    assertNoLeakedPlaceholders(params)
  })
})

// ----------------------------------------------------------
// R1.3 — Phone: allowCountries (country param)
// ----------------------------------------------------------

describe('r1.3 — Phone allowCountries passes country param', () => {
  const schema = Phone({ allowCountries: ['US'] })

  it('includes actual country in error params', async () => {
    const params = await firstParamsAsync(schema, '+4930123456')
    expect(params.code).toBe('countryNotAllowed')
    expect(params['country']).toBe('DE')
    assertNoLeakedPlaceholders(params)
  })
})

// ----------------------------------------------------------
// R1.4 — Phone: blockCountries (country param)
// ----------------------------------------------------------

describe('r1.4 — Phone blockCountries passes country param', () => {
  const schema = Phone({ blockCountries: ['RU'] })

  it('includes actual country in error params', async () => {
    const params = await firstParamsAsync(schema, '+79161234567')
    expect(params.code).toBe('countryBlocked')
    expect(params['country']).toBe('RU')
    assertNoLeakedPlaceholders(params)
  })
})

// ----------------------------------------------------------
// R1.5 — Website: blockDomains (domain param)
// ----------------------------------------------------------

describe('r1.5 — Website blockDomains passes domain param', () => {
  const schema = Website({ blockDomains: ['evil.com'] })

  it('includes actual domain in error params', () => {
    const params = firstParams(schema, 'https://evil.com')
    expect(params.code).toBe('domainBlocked')
    expect(params['domain']).toBe('evil.com')
    assertNoLeakedPlaceholders(params)
  })
})

// ----------------------------------------------------------
// R1.6 — Website: allowDomains (domain param)
// ----------------------------------------------------------

describe('r1.6 — Website allowDomains passes domain param', () => {
  const schema = Website({ allowDomains: ['example.com'] })

  it('includes actual domain in error params', () => {
    const params = firstParams(schema, 'https://other.com')
    expect(params.code).toBe('domainNotAllowed')
    expect(params['domain']).toBe('other.com')
    assertNoLeakedPlaceholders(params)
  })
})

// ----------------------------------------------------------
// R1.7 — URL: protocols (protocol param)
// ----------------------------------------------------------

describe('r1.7 — URL protocols passes protocol param', () => {
  const schema = Url({ protocols: ['https'] })

  it('includes actual protocol in error params', () => {
    const params = firstParams(schema, 'ftp://files.example.com')
    expect(params.code).toBe('protocolNotAllowed')
    expect(params['protocol']).toBe('ftp')
    assertNoLeakedPlaceholders(params)
  })
})

// ----------------------------------------------------------
// R1.8 — URL: blockDomains (domain param)
// ----------------------------------------------------------

describe('r1.8 — URL blockDomains passes domain param', () => {
  const schema = Url({ blockDomains: ['evil.com'] })

  it('includes actual domain in error params', () => {
    const params = firstParams(schema, 'https://evil.com')
    expect(params.code).toBe('domainBlocked')
    expect(params['domain']).toBe('evil.com')
    assertNoLeakedPlaceholders(params)
  })
})

// ----------------------------------------------------------
// R1.9 — URL: allowDomains (domain param)
// ----------------------------------------------------------

describe('r1.9 — URL allowDomains passes domain param', () => {
  const schema = Url({ allowDomains: ['example.com'] })

  it('includes actual domain in error params', () => {
    const params = firstParams(schema, 'https://other.com')
    expect(params.code).toBe('domainNotAllowed')
    expect(params['domain']).toBe('other.com')
    assertNoLeakedPlaceholders(params)
  })
})

// ----------------------------------------------------------
// R1.10 — Username: reservedBlocked (value param)
// ----------------------------------------------------------

describe('r1.10 — Username reservedBlocked passes value param', () => {
  const schema = Username({ blockReserved: true })

  it('includes actual value in error params', async () => {
    const params = await firstParamsAsync(schema, 'admin')
    expect(params.code).toBe('reservedBlocked')
    expect(params['value']).toBe('admin')
    assertNoLeakedPlaceholders(params)
  })
})

// ----------------------------------------------------------
// R1.11 — Country: allowCountries (country param)
// ----------------------------------------------------------

describe('r1.11 — Country allowCountries passes country param', () => {
  const schema = Country({ allowCountries: ['US', 'GB'] })

  it('includes actual country in error params', async () => {
    const params = await firstParamsAsync(schema, 'FR')
    expect(params.code).toBe('notAllowed')
    expect(params['country']).toBe('FR')
    assertNoLeakedPlaceholders(params)
  })
})

// ----------------------------------------------------------
// R1.12 — Country: blockCountries (country param)
// ----------------------------------------------------------

describe('r1.12 — Country blockCountries passes country param', () => {
  const schema = Country({ blockCountries: ['RU'] })

  it('includes actual country in error params', async () => {
    const params = await firstParamsAsync(schema, 'RU')
    expect(params.code).toBe('blocked')
    expect(params['country']).toBe('RU')
    assertNoLeakedPlaceholders(params)
  })
})

// ----------------------------------------------------------
// R1.13 — Currency: allowCurrencies (currency param)
// ----------------------------------------------------------

describe('r1.13 — Currency allowCurrencies passes currency param', () => {
  const schema = Currency({ allowCurrencies: ['USD', 'EUR'] })

  it('includes actual currency in error params', async () => {
    const params = await firstParamsAsync(schema, 'GBP')
    expect(params.code).toBe('notAllowed')
    expect(params['currency']).toBe('GBP')
    assertNoLeakedPlaceholders(params)
  })
})

// ----------------------------------------------------------
// R1.14 — Currency: blockCurrencies (currency param)
// ----------------------------------------------------------

describe('r1.14 — Currency blockCurrencies passes currency param', () => {
  const schema = Currency({ blockCurrencies: ['RUB'] })

  it('includes actual currency in error params', async () => {
    const params = await firstParamsAsync(schema, 'RUB')
    expect(params.code).toBe('blocked')
    expect(params['currency']).toBe('RUB')
    assertNoLeakedPlaceholders(params)
  })
})

// ----------------------------------------------------------
// R1.15 — CreditCard: allowIssuers (issuer param)
// ----------------------------------------------------------

describe('r1.15 — CreditCard allowIssuers passes issuer param', () => {
  const schema = CreditCard({ allowIssuers: ['visa'] })

  it('includes actual issuer in error params', async () => {
    const params = await firstParamsAsync(schema, '371449635398431')
    expect(params.code).toBe('issuerNotAllowed')
    expect(params['issuer']).toBe('amex')
    assertNoLeakedPlaceholders(params)
  })
})

// ----------------------------------------------------------
// R1.16 — CreditCard: blockIssuers (issuer param)
// ----------------------------------------------------------

describe('r1.16 — CreditCard blockIssuers passes issuer param', () => {
  const schema = CreditCard({ blockIssuers: ['amex'] })

  it('includes actual issuer in error params', async () => {
    const params = await firstParamsAsync(schema, '371449635398431')
    expect(params.code).toBe('issuerBlocked')
    expect(params['issuer']).toBe('amex')
    assertNoLeakedPlaceholders(params)
  })
})

// ----------------------------------------------------------
// R1.17 — IBAN: allowCountries (country param)
// ----------------------------------------------------------

describe('r1.17 — IBAN allowCountries passes country param', () => {
  const schema = Iban({ allowCountries: ['DE', 'GB'] })

  it('includes actual country in error params', async () => {
    const params = await firstParamsAsync(schema, 'FR7630006000011234567890189')
    expect(params.code).toBe('countryNotAllowed')
    expect(params['country']).toBe('FR')
    assertNoLeakedPlaceholders(params)
  })
})

// ----------------------------------------------------------
// R1.18 — IBAN: blockCountries (country param)
// ----------------------------------------------------------

describe('r1.18 — IBAN blockCountries passes country param', () => {
  const schema = Iban({ blockCountries: ['ES'] })

  it('includes actual country in error params', async () => {
    const params = await firstParamsAsync(schema, 'ES9121000418450200051332')
    expect(params.code).toBe('countryBlocked')
    expect(params['country']).toBe('ES')
    assertNoLeakedPlaceholders(params)
  })
})

// ==============================================================================
// R3 — GENERIC CODE REPLACEMENTS
// Verifies each option now produces a specific error code instead of 'invalid'.
// ==============================================================================

// ----------------------------------------------------------
// R3.1 — Website: requireWww -> wwwRequired
// ----------------------------------------------------------

describe('r3.1 — website requireWww produces wwwRequired code', () => {
  it('produces wwwRequired instead of invalid', () => {
    const schema = Website({ requireWww: true })
    const params = firstParams(schema, 'https://example.com')
    expect(params.code).toBe('wwwRequired')
  })
})

// ----------------------------------------------------------
// R3.2 — Website: requireHttps -> httpsRequired
// ----------------------------------------------------------

describe('r3.2 — website requireHttps produces httpsRequired code', () => {
  it('produces httpsRequired instead of invalid', () => {
    const schema = Website({ requireHttps: true })
    const params = firstParams(schema, 'http://example.com')
    expect(params.code).toBe('httpsRequired')
  })
})

// ----------------------------------------------------------
// R3.3 — Website: allowPath -> pathNotAllowed
// ----------------------------------------------------------

describe('r3.3 — website allowPath produces pathNotAllowed code', () => {
  it('produces pathNotAllowed instead of invalid', () => {
    const schema = Website({ allowPath: false })
    const params = firstParams(schema, 'https://example.com/page')
    expect(params.code).toBe('pathNotAllowed')
  })
})

// ----------------------------------------------------------
// R3.4 — Website: allowQuery -> queryNotAllowed
// ----------------------------------------------------------

describe('r3.4 — website allowQuery produces queryNotAllowed code', () => {
  it('produces queryNotAllowed instead of invalid', () => {
    const schema = Website()
    const params = firstParams(schema, 'https://example.com?q=1')
    expect(params.code).toBe('queryNotAllowed')
  })
})

// ----------------------------------------------------------
// R3.5 — Phone: requireCountryCode -> countryCodeRequired
// ----------------------------------------------------------

describe('r3.5 — phone requireCountryCode produces countryCodeRequired code', () => {
  it('produces countryCodeRequired instead of invalid', async () => {
    const schema = Phone({ requireCountryCode: true, country: 'US' })
    const params = await firstParamsAsync(schema, '2125551234')
    expect(params.code).toBe('countryCodeRequired')
  })
})

// ----------------------------------------------------------
// R3.6 — URL: requireTLD -> tldRequired
// ----------------------------------------------------------

describe('r3.6 — url requireTLD produces tldRequired code', () => {
  it('produces tldRequired instead of invalid', () => {
    const schema = Url()
    const params = firstParams(schema, 'http://localhost')
    expect(params.code).toBe('tldRequired')
  })
})

// ----------------------------------------------------------
// R3.7 — URL: allowQuery -> queryNotAllowed
// ----------------------------------------------------------

describe('r3.7 — url allowQuery produces queryNotAllowed code', () => {
  it('produces queryNotAllowed instead of invalid', () => {
    const schema = Url({ allowQuery: false })
    const params = firstParams(schema, 'https://example.com?q=1')
    expect(params.code).toBe('queryNotAllowed')
  })
})

// ----------------------------------------------------------
// R3.8 — URL: allowAuth -> authNotAllowed
// ----------------------------------------------------------

describe('r3.8 — url allowAuth produces authNotAllowed code', () => {
  it('produces authNotAllowed instead of invalid', () => {
    const schema = Url({ requireTLD: false })
    const params = firstParams(schema, 'http://user:pass@host.com')
    expect(params.code).toBe('authNotAllowed')
  })
})

// ----------------------------------------------------------
// R3.9 — JWT: requireExpiry -> expiryRequired
// ----------------------------------------------------------

describe('r3.9 — jwt requireExpiry produces expiryRequired code', () => {
  it('produces expiryRequired instead of invalid', async () => {
    const header = btoa(JSON.stringify({ alg: 'HS256' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    const payload = btoa(JSON.stringify({ sub: 'user' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    const token = `${header}.${payload}.signature`
    const schema = Jwt({ requireExpiry: true })
    const params = await firstParamsAsync(schema, token)
    expect(params.code).toBe('expiryRequired')
  })
})
