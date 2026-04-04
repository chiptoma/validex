// ==============================================================================
// LABEL INTEGRATION TESTS
// Verifies the label option flows through issue params for all 25 rules.
// Tests both standalone and z.object() composed usage.
// ------------------------------------------------------------------------------
// NOTE: label only appears on validex refine errors, not Zod native errors
// (z.string().email(), z.string().min() etc.). Each test triggers a VALIDEX
// refine, not a Zod native check, to verify label propagation.
// ==============================================================================

import type { z as zType } from 'zod'

import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { getParams } from '@core/getParams'
import { validate } from '@core/validate'
import { BusinessName } from '@rules/businessName'
import { Color } from '@rules/color'
import { Country } from '@rules/country'
import { CreditCard } from '@rules/creditCard'
import { Currency } from '@rules/currency'
import { DateTime } from '@rules/dateTime'
import { Email } from '@rules/email'
import { Iban } from '@rules/iban'
import { IpAddress } from '@rules/ipAddress'
import { Jwt } from '@rules/jwt'
import { LicenseKey } from '@rules/licenseKey'
import { MacAddress } from '@rules/macAddress'
import { Password } from '@rules/password'
import { PasswordConfirmation } from '@rules/passwordConfirmation'
import { PersonName } from '@rules/personName'
import { Phone } from '@rules/phone'
import { PostalCode } from '@rules/postalCode'
import { Slug } from '@rules/slug'
import { Text } from '@rules/text'
import { Token } from '@rules/token'
import { Url } from '@rules/url'
import { Username } from '@rules/username'
import { Uuid } from '@rules/uuid'
import { VatNumber } from '@rules/vatNumber'
import { Website } from '@rules/website'

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Find Label In Issues
 * Searches all issues for one where getParams().label matches expected.
 *
 * @param issues - The Zod issues array.
 * @param label  - The expected label.
 * @returns True if any issue has the label.
 */
function hasLabelInIssues(
  issues: ReadonlyArray<unknown>,
  label: string,
): boolean {
  return issues.some((i) => {
    const p = getParams(i as Parameters<typeof getParams>[0])
    return p.label === label
  })
}

/**
 * Assert Label
 * Parses async and asserts at least one issue carries the explicit label.
 *
 * @param schema - The Zod schema.
 * @param value  - Invalid value triggering a validex refine.
 * @param label  - Expected label.
 */
async function assertLabel(
  schema: unknown,
  value: unknown,
  label: string,
): Promise<void> {
  const result = await (schema as zType.ZodType).safeParseAsync(value)
  expect(result.success, `Expected parse to fail for label: ${label}`).toBe(false)
  if (!result.success) {
    expect(
      hasLabelInIssues(result.error.issues, label),
      `No issue has label "${label}". Got labels: ${result.error.issues.map(i => getParams(i as Parameters<typeof getParams>[0]).label).join(', ')}`,
    ).toBe(true)
  }
}

// ----------------------------------------------------------
// STANDALONE — TRIGGER VALIDEX REFINES (not Zod native)
// ----------------------------------------------------------

describe('label option — standalone', () => {
  it('email', async () => {
    await assertLabel(Email({ label: 'Work Email', blockPlusAlias: true }), 'user+tag@example.com', 'Work Email')
  })

  it('personName', async () => {
    await assertLabel(PersonName({ label: 'Full Name' }), 'John@Doe', 'Full Name')
  })

  it('businessName', async () => {
    await assertLabel(BusinessName({ label: 'Company' }), 'Acme<Corp', 'Company')
  })

  it('password', async () => {
    await assertLabel(Password({ label: 'Secret' }), 'password1!', 'Secret')
  })

  it('passwordConfirmation', async () => {
    await assertLabel(PasswordConfirmation({ label: 'Confirm' }), 'password1!', 'Confirm')
  })

  it('phone', async () => {
    await assertLabel(Phone({ label: 'Mobile', requireCountryCode: true, country: 'US' }), '2125551234', 'Mobile')
  })

  it('website', async () => {
    await assertLabel(Website({ label: 'Homepage' }), 'https://example.com?q=1', 'Homepage')
  })

  it('url', async () => {
    await assertLabel(Url({ label: 'Link' }), 'http://localhost', 'Link')
  })

  it('username', async () => {
    await assertLabel(Username({ label: 'Handle' }), 'user@name', 'Handle')
  })

  it('slug', async () => {
    await assertLabel(Slug({ label: 'URL Slug' }), 'BAD SLUG', 'URL Slug')
  })

  it('postalCode', async () => {
    await assertLabel(PostalCode({ country: 'US', label: 'ZIP' }), 'ABCDE', 'ZIP')
  })

  it('licenseKey', async () => {
    await assertLabel(LicenseKey({ label: 'Key' }), 'bad-key', 'Key')
  })

  it('uuid', async () => {
    await assertLabel(Uuid({ label: 'ID', version: 4 }), '6ba7b810-9dad-11d1-80b4-00c04fd430c8', 'ID')
  })

  it('jwt', async () => {
    const h = btoa(JSON.stringify({ alg: 'HS256' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    const p = btoa(JSON.stringify({ sub: 'u' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    await assertLabel(Jwt({ label: 'Auth Token', requireExpiry: true }), `${h}.${p}.sig`, 'Auth Token')
  })

  it('dateTime', async () => {
    await assertLabel(DateTime({ label: 'Start Date', allowFuture: false }), '2099-01-01T00:00:00Z', 'Start Date')
  })

  it('token', async () => {
    await assertLabel(Token({ type: 'nanoid', label: 'Session' }), 'V1StGXR8.Z5jdHi6B.myT', 'Session')
  })

  it('text', async () => {
    await assertLabel(Text({ label: 'Bio', noEmails: true }), 'contact me at test@example.com', 'Bio')
  })

  it('country', async () => {
    await assertLabel(Country({ label: 'Nation', allowCountries: ['US'] }), 'FR', 'Nation')
  })

  it('currency', async () => {
    await assertLabel(Currency({ label: 'Money', allowCurrencies: ['USD'] }), 'GBP', 'Money')
  })

  it('color', async () => {
    await assertLabel(Color({ label: 'Theme Color' }), 'red', 'Theme Color')
  })

  it('creditCard', async () => {
    await assertLabel(CreditCard({ label: 'Card' }), '1234567890123456', 'Card')
  })

  it('iban', async () => {
    await assertLabel(Iban({ label: 'Bank Account' }), 'XX00000000000000', 'Bank Account')
  })

  it('vatNumber', async () => {
    await assertLabel(VatNumber({ label: 'VAT' }), 'XX000', 'VAT')
  })

  it('macAddress', async () => {
    await assertLabel(MacAddress({ label: 'MAC' }), 'bad-mac', 'MAC')
  })

  it('ipAddress', async () => {
    await assertLabel(IpAddress({ label: 'Server IP', version: 'v4', allowPrivate: false }), '192.168.1.1', 'Server IP')
  })
})

// ----------------------------------------------------------
// COMPOSED HELPER
// ----------------------------------------------------------

/**
 * Composed
 * Wraps a rule in z.object, triggers a failure, asserts label.
 *
 * @param field  - Object field name.
 * @param schema - Rule schema with label.
 * @param value  - Invalid value.
 * @param label  - Expected label.
 */
async function composed(field: string, schema: unknown, value: unknown, label: string): Promise<void> {
  const obj = z.object({ [field]: schema as zType.ZodType })
  const result = await validate(obj, { [field]: value })
  expect(result.success, `Expected failure for ${label} in z.object`).toBe(false)
  expect(hasLabelInIssues(result.issues, label), `Label "${label}" not found in composed issues`).toBe(true)
}

// ----------------------------------------------------------
// COMPOSED IN z.object() — label overrides path derivation
// ----------------------------------------------------------

describe('label option — composed in z.object()', () => {
  it('email', async () => {
    await composed('e', Email({ label: 'Correo', blockPlusAlias: true }), 'user+tag@example.com', 'Correo')
  })
  it('personName', async () => {
    await composed('n', PersonName({ label: 'Nombre' }), 'John@Doe', 'Nombre')
  })
  it('businessName', async () => {
    await composed('b', BusinessName({ label: 'Empresa' }), 'Acme<Corp', 'Empresa')
  })
  it('password', async () => {
    await composed('p', Password({ label: 'Clave' }), 'password1!', 'Clave')
  })
  it('passwordConfirmation', async () => {
    await composed('pc', PasswordConfirmation({ label: 'Confirmar' }), 'password1!', 'Confirmar')
  })
  it('phone', async () => {
    await composed('t', Phone({ label: 'Telefono', requireCountryCode: true, country: 'US' }), '2125551234', 'Telefono')
  })
  it('website', async () => {
    await composed('w', Website({ label: 'Sitio' }), 'https://example.com?q=1', 'Sitio')
  })
  it('url', async () => {
    await composed('u', Url({ label: 'Enlace' }), 'http://localhost', 'Enlace')
  })
  it('username', async () => {
    await composed('un', Username({ label: 'Usuario' }), 'user@name', 'Usuario')
  })
  it('slug', async () => {
    await composed('s', Slug({ label: 'Slug' }), 'BAD SLUG', 'Slug')
  })
  it('postalCode', async () => {
    await composed('z', PostalCode({ country: 'US', label: 'Codigo' }), 'ABCDE', 'Codigo')
  })
  it('licenseKey', async () => {
    await composed('lk', LicenseKey({ label: 'Llave' }), 'bad-key', 'Llave')
  })
  it('uuid', async () => {
    await composed('id', Uuid({ label: 'Identificador' }), 'not-uuid', 'Identificador')
  })
  it('jwt', async () => {
    await composed('tk', Jwt({ label: 'Token' }), 'bad.jwt.here', 'Token')
  })
  it('dateTime', async () => {
    await composed('dt', DateTime({ label: 'Fecha', allowFuture: false }), '2099-01-01T00:00:00Z', 'Fecha')
  })
  it('token', async () => {
    await composed('tok', Token({ type: 'nanoid', label: 'Sesion' }), 'V1StGXR8.Z5jdHi6B.myT', 'Sesion')
  })
  it('text', async () => {
    await composed('txt', Text({ label: 'Texto', noEmails: true }), 'email test@x.com here', 'Texto')
  })
  it('country', async () => {
    await composed('co', Country({ label: 'Pais', allowCountries: ['US'] }), 'FR', 'Pais')
  })
  it('currency', async () => {
    await composed('cu', Currency({ label: 'Moneda', allowCurrencies: ['USD'] }), 'GBP', 'Moneda')
  })
  it('color', async () => {
    await composed('cl', Color({ label: 'Color' }), 'red', 'Color')
  })
  it('creditCard', async () => {
    await composed('cc', CreditCard({ label: 'Tarjeta' }), '1234567890123456', 'Tarjeta')
  })
  it('iban', async () => {
    await composed('ib', Iban({ label: 'Cuenta' }), 'XX00000000000000', 'Cuenta')
  })
  it('vatNumber', async () => {
    await composed('vat', VatNumber({ label: 'IVA' }), 'XX000', 'IVA')
  })
  it('macAddress', async () => {
    await composed('mac', MacAddress({ label: 'MAC' }), 'bad-mac', 'MAC')
  })
  it('ipAddress', async () => {
    await composed('ip', IpAddress({ label: 'IP', version: 'v4', allowPrivate: false }), '192.168.1.1', 'IP')
  })
})

// ----------------------------------------------------------
// COMPOSED — EMPTY TO UNDEFINED (all 25 rules)
// ----------------------------------------------------------

describe('label option — emptyToUndefined in z.object()', () => {
  it('email', async () => {
    await composed('e', Email({ label: 'Correo' }), '', 'Correo')
  })
  it('personName', async () => {
    await composed('n', PersonName({ label: 'Nombre' }), '', 'Nombre')
  })
  it('businessName', async () => {
    await composed('b', BusinessName({ label: 'Empresa' }), '', 'Empresa')
  })
  it('password', async () => {
    await composed('p', Password({ label: 'Clave' }), '', 'Clave')
  })
  it('passwordConfirmation', async () => {
    await composed('pc', PasswordConfirmation({ label: 'Confirmar' }), '', 'Confirmar')
  })
  it('phone', async () => {
    await composed('t', Phone({ label: 'Telefono' }), '', 'Telefono')
  })
  it('website', async () => {
    await composed('w', Website({ label: 'Sitio' }), '', 'Sitio')
  })
  it('url', async () => {
    await composed('u', Url({ label: 'Enlace' }), '', 'Enlace')
  })
  it('username', async () => {
    await composed('un', Username({ label: 'Usuario' }), '', 'Usuario')
  })
  it('slug', async () => {
    await composed('s', Slug({ label: 'Slug' }), '', 'Slug')
  })
  it('postalCode', async () => {
    await composed('z', PostalCode({ country: 'US', label: 'Codigo' }), '', 'Codigo')
  })
  it('licenseKey', async () => {
    await composed('lk', LicenseKey({ label: 'Llave' }), '', 'Llave')
  })
  it('uuid', async () => {
    await composed('id', Uuid({ label: 'ID' }), '', 'ID')
  })
  it('jwt', async () => {
    await composed('tk', Jwt({ label: 'Token' }), '', 'Token')
  })
  it('dateTime', async () => {
    await composed('dt', DateTime({ label: 'Fecha' }), '', 'Fecha')
  })
  it('token', async () => {
    await composed('tok', Token({ type: 'nanoid', label: 'Sesion' }), '', 'Sesion')
  })
  it('text', async () => {
    await composed('txt', Text({ label: 'Texto' }), '', 'Texto')
  })
  it('country', async () => {
    await composed('co', Country({ label: 'Pais' }), '', 'Pais')
  })
  it('currency', async () => {
    await composed('cu', Currency({ label: 'Moneda' }), '', 'Moneda')
  })
  it('color', async () => {
    await composed('cl', Color({ label: 'Color' }), '', 'Color')
  })
  it('creditCard', async () => {
    await composed('cc', CreditCard({ label: 'Tarjeta' }), '', 'Tarjeta')
  })
  it('iban', async () => {
    await composed('ib', Iban({ label: 'Cuenta' }), '', 'Cuenta')
  })
  it('vatNumber', async () => {
    await composed('vat', VatNumber({ label: 'IVA' }), '', 'IVA')
  })
  it('macAddress', async () => {
    await composed('mac', MacAddress({ label: 'MAC' }), '', 'MAC')
  })
  it('ipAddress', async () => {
    await composed('ip', IpAddress({ label: 'IP' }), '', 'IP')
  })
})

// ----------------------------------------------------------
// COMPOSED — LENGTH ERRORS (10 rules with length option)
// ----------------------------------------------------------

describe('label option — length error in z.object()', () => {
  it('email min', async () => {
    await composed('e', Email({ label: 'Correo', length: { min: 30 } }), 'a@b.cc', 'Correo')
  })
  it('personName min', async () => {
    await composed('n', PersonName({ label: 'Nombre', length: { min: 10 } }), 'Jo', 'Nombre')
  })
  it('businessName min', async () => {
    await composed('b', BusinessName({ label: 'Empresa', length: { min: 10 } }), 'AB', 'Empresa')
  })
  it('password min', async () => {
    await composed('p', Password({ label: 'Clave', length: { min: 20 } }), 'P@ssw0rd!', 'Clave')
  })
  it('username min', async () => {
    await composed('un', Username({ label: 'Usuario', length: { min: 10, max: 20 } }), 'ab', 'Usuario')
  })
  it('slug min', async () => {
    await composed('s', Slug({ label: 'Slug', length: { min: 10, max: 100 } }), 'ab', 'Slug')
  })
  it('token min', async () => {
    await composed('tok', Token({ type: 'hex', label: 'Sesion', length: { min: 20, max: 40 } }), 'abcdef', 'Sesion')
  })
  it('text min', async () => {
    await composed('txt', Text({ label: 'Texto', length: { min: 20 } }), 'short', 'Texto')
  })
  it('website max', async () => {
    await composed('w', Website({ label: 'Sitio', length: { max: 10 } }), 'https://example.com', 'Sitio')
  })
  it('url max', async () => {
    await composed('u', Url({ label: 'Enlace', length: { max: 10 } }), 'https://example.com', 'Enlace')
  })
})
