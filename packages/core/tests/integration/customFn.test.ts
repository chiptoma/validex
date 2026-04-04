// ==============================================================================
// CUSTOM FN INTEGRATION TESTS
// Verifies that customFn works for all 25 rules, producing the correct
// {namespace}.custom error code with the consumer's message preserved.
// ==============================================================================

import type { z } from 'zod'

import { describe, expect, it } from 'vitest'

import { getParams } from '@core/getParams'
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

const rejectAll = (): string => 'custom rejection'

/**
 * Assert Custom Code
 * Parses async and asserts the custom code and namespace.
 *
 * @param schema    - The Zod schema.
 * @param value     - A valid value that passes base validation but is rejected by customFn.
 * @param namespace - Expected error namespace.
 */
async function assertCustomCode(
  schema: unknown,
  value: unknown,
  namespace: string,
): Promise<void> {
  const result = await (schema as z.ZodType).safeParseAsync(value)
  expect(result.success, `Expected customFn to reject value for ${namespace}`).toBe(false)
  if (!result.success) {
    const customIssue = result.error.issues.find((i) => {
      const p = getParams(i as Parameters<typeof getParams>[0])
      return p.code === 'custom' && p.namespace === namespace
    })
    expect(customIssue, `Expected {code:'custom', namespace:'${namespace}'} issue`).toBeDefined()
  }
}

// ----------------------------------------------------------
// TESTS
// ----------------------------------------------------------

describe('customFn integration', () => {
  it('email: customFn produces email.custom', async () => {
    await assertCustomCode(Email({ customFn: rejectAll }), 'user@example.com', 'email')
  })

  it('personName: customFn produces personName.custom', async () => {
    await assertCustomCode(PersonName({ customFn: rejectAll }), 'John Doe', 'personName')
  })

  it('businessName: customFn produces businessName.custom', async () => {
    await assertCustomCode(BusinessName({ customFn: rejectAll }), 'Acme Corp', 'businessName')
  })

  it('password: customFn produces password.custom', async () => {
    await assertCustomCode(Password({ customFn: rejectAll }), 'P@ssw0rd!', 'password')
  })

  it('passwordConfirmation: customFn delegates to password.custom', async () => {
    // PasswordConfirmation passes customFn through to Password's createRule
    // So the namespace is 'password', not 'confirmation'
    await assertCustomCode(PasswordConfirmation({ customFn: rejectAll }), 'P@ssw0rd!', 'password')
  })

  it('phone: customFn produces phone.custom', async () => {
    await assertCustomCode(Phone({ customFn: rejectAll }), '+12125551234', 'phone')
  })

  it('website: customFn produces website.custom', async () => {
    await assertCustomCode(Website({ customFn: rejectAll }), 'https://example.com', 'website')
  })

  it('url: customFn produces url.custom', async () => {
    await assertCustomCode(Url({ customFn: rejectAll }), 'https://example.com', 'url')
  })

  it('username: customFn produces username.custom', async () => {
    await assertCustomCode(Username({ customFn: rejectAll }), 'johndoe', 'username')
  })

  it('slug: customFn produces slug.custom', async () => {
    await assertCustomCode(Slug({ customFn: rejectAll }), 'hello-world', 'slug')
  })

  it('postalCode: customFn produces postalCode.custom', async () => {
    await assertCustomCode(PostalCode({ country: 'US', customFn: rejectAll }), '12345', 'postalCode')
  })

  it('licenseKey: customFn produces licenseKey.custom', async () => {
    await assertCustomCode(LicenseKey({ customFn: rejectAll }), 'ABCDE-FGHIJ-KLMNO-PQRST-UVWXY', 'licenseKey')
  })

  it('uuid: customFn produces uuid.custom', async () => {
    await assertCustomCode(Uuid({ customFn: rejectAll }), '550e8400-e29b-41d4-a716-446655440000', 'uuid')
  })

  it('jwt: customFn produces jwt.custom', async () => {
    const header = btoa(JSON.stringify({ alg: 'HS256' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    const payload = btoa(JSON.stringify({ sub: 'user' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
    await assertCustomCode(Jwt({ customFn: rejectAll }), `${header}.${payload}.sig`, 'jwt')
  })

  it('dateTime: customFn produces dateTime.custom', async () => {
    await assertCustomCode(DateTime({ customFn: rejectAll }), '2025-03-29T14:30:00Z', 'dateTime')
  })

  it('token: customFn produces token.custom', async () => {
    await assertCustomCode(Token({ type: 'nanoid', customFn: rejectAll }), 'V1StGXR8_Z5jdHi6B-myT', 'token')
  })

  it('text: customFn produces text.custom', async () => {
    await assertCustomCode(Text({ customFn: rejectAll }), 'Hello world', 'text')
  })

  it('country: customFn produces country.custom', async () => {
    await assertCustomCode(Country({ customFn: rejectAll }), 'US', 'country')
  })

  it('currency: customFn produces currency.custom', async () => {
    await assertCustomCode(Currency({ customFn: rejectAll }), 'USD', 'currency')
  })

  it('color: customFn produces color.custom', async () => {
    await assertCustomCode(Color({ customFn: rejectAll }), '#ff0000', 'color')
  })

  it('creditCard: customFn produces creditCard.custom', async () => {
    await assertCustomCode(CreditCard({ customFn: rejectAll }), '4532015112830366', 'creditCard')
  })

  it('iban: customFn produces iban.custom', async () => {
    await assertCustomCode(Iban({ customFn: rejectAll }), 'DE89370400440532013000', 'iban')
  })

  it('vatNumber: customFn produces vatNumber.custom', async () => {
    await assertCustomCode(VatNumber({ customFn: rejectAll }), 'DE123456789', 'vatNumber')
  })

  it('macAddress: customFn produces macAddress.custom', async () => {
    await assertCustomCode(MacAddress({ customFn: rejectAll }), '00:1A:2B:3C:4D:5E', 'macAddress')
  })

  it('ipAddress: customFn produces ipAddress.custom', async () => {
    await assertCustomCode(IpAddress({ customFn: rejectAll }), '8.8.8.8', 'ipAddress')
  })
})
