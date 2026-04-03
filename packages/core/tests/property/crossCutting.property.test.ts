// ==============================================================================
// PROPERTY-BASED TESTS — CROSS-CUTTING INVARIANTS
// Validates invariants that apply to all rules: empty string rejection,
// emptyToUndefined behavior, error code format, and getParams structure.
// ==============================================================================

import type { z } from 'zod'

import * as fc from 'fast-check'
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
// CONSTANTS
// ----------------------------------------------------------

const CAMEL_RE = /^[a-z][a-zA-Z0-9]*$/

// ----------------------------------------------------------
// EMPTY STRING INVARIANT — ALL RULES
// ----------------------------------------------------------

describe('all rules — empty string fails', () => {
  const syncRules: ReadonlyArray<{ readonly name: string, readonly factory: () => unknown }> = [
    { name: 'email', factory: () => Email() },
    { name: 'personName', factory: () => PersonName() },
    { name: 'businessName', factory: () => BusinessName() },
    { name: 'password', factory: () => Password() },
    { name: 'passwordConfirmation', factory: () => PasswordConfirmation() },
    { name: 'website', factory: () => Website() },
    { name: 'url', factory: () => Url() },
    { name: 'username', factory: () => Username() },
    { name: 'slug', factory: () => Slug() },
    { name: 'licenseKey', factory: () => LicenseKey({ regex: /^[A-Z0-9]+$/ }) },
    { name: 'uuid', factory: () => Uuid() },
    { name: 'dateTime', factory: () => DateTime() },
    { name: 'token', factory: () => Token({ type: 'hex' }) },
    { name: 'text', factory: () => Text() },
    { name: 'color', factory: () => Color() },
    { name: 'creditCard', factory: () => CreditCard() },
    { name: 'macAddress', factory: () => MacAddress() },
    { name: 'ipAddress', factory: () => IpAddress() },
  ]

  for (const rule of syncRules) {
    it(`${rule.name}: empty string is rejected`, () => {
      const schema = rule.factory() as z.ZodType
      const result = schema.safeParse('')
      expect(result.success).toBe(false)
    })
  }

  const asyncRules: ReadonlyArray<{ readonly name: string, readonly factory: () => unknown }> = [
    { name: 'phone', factory: () => Phone() },
    { name: 'postalCode', factory: () => PostalCode({ country: 'US' }) },
    { name: 'jwt', factory: () => Jwt() },
    { name: 'country', factory: () => Country() },
    { name: 'currency', factory: () => Currency() },
    { name: 'iban', factory: () => Iban() },
    { name: 'vatNumber', factory: () => VatNumber({ country: 'DE' }) },
  ]

  for (const rule of asyncRules) {
    it(`${rule.name}: empty string is rejected`, async () => {
      const schema = rule.factory() as z.ZodType
      const result = await schema.safeParseAsync('')
      expect(result.success).toBe(false)
    })
  }
})

// ----------------------------------------------------------
// CROSS-CUTTING: emptyToUndefined + "" → undefined
// ----------------------------------------------------------

describe('all rules — emptyToUndefined with empty string returns undefined', () => {
  const factories: ReadonlyArray<{ readonly name: string, readonly factory: () => unknown }> = [
    { name: 'email', factory: () => Email({ emptyToUndefined: true }) },
    { name: 'personName', factory: () => PersonName({ emptyToUndefined: true }) },
    { name: 'password', factory: () => Password({ emptyToUndefined: true }) },
    { name: 'slug', factory: () => Slug({ emptyToUndefined: true }) },
    { name: 'uuid', factory: () => Uuid({ emptyToUndefined: true }) },
    { name: 'website', factory: () => Website({ emptyToUndefined: true }) },
    { name: 'url', factory: () => Url({ emptyToUndefined: true }) },
    { name: 'username', factory: () => Username({ emptyToUndefined: true }) },
  ]

  for (const { name, factory } of factories) {
    it(`${name}: emptyToUndefined: true + "" → undefined (required error)`, () => {
      const schema = factory() as z.ZodType
      const result = schema.safeParse('')
      expect(result.success).toBe(false)
    })
  }
})

// ----------------------------------------------------------
// CROSS-CUTTING: error codes are always camelCase
// ----------------------------------------------------------

describe('all rules — error codes are camelCase', () => {
  const factories: ReadonlyArray<{ readonly name: string, readonly factory: () => unknown }> = [
    { name: 'email', factory: () => Email() },
    { name: 'personName', factory: () => PersonName() },
    { name: 'password', factory: () => Password() },
    { name: 'slug', factory: () => Slug() },
    { name: 'uuid', factory: () => Uuid() },
    { name: 'website', factory: () => Website() },
    { name: 'url', factory: () => Url() },
    { name: 'username', factory: () => Username() },
    { name: 'creditCard', factory: () => CreditCard() },
  ]

  for (const { name, factory } of factories) {
    it(`${name}: error codes from getParams are camelCase`, () => {
      const schema = factory() as z.ZodType
      fc.assert(
        fc.property(fc.string(), (input) => {
          const result = schema.safeParse(input)
          if (!result.success) {
            for (const issue of result.error.issues) {
              // SAFETY: Zod issue paths are string|number in practice; symbol keys never appear
              const params = getParams(issue as unknown as Record<string, unknown>)
              expect(params.code).toMatch(CAMEL_RE)
            }
          }
        }),
        { numRuns: 200 },
      )
    })
  }
})

// ----------------------------------------------------------
// CROSS-CUTTING: getParams always returns namespace and code
// ----------------------------------------------------------

describe('all rules — getParams returns namespace and code', () => {
  const factories: ReadonlyArray<{ readonly name: string, readonly factory: () => unknown }> = [
    { name: 'email', factory: () => Email() },
    { name: 'password', factory: () => Password() },
    { name: 'slug', factory: () => Slug() },
    { name: 'website', factory: () => Website() },
    { name: 'url', factory: () => Url() },
    { name: 'creditCard', factory: () => CreditCard() },
  ]

  for (const { name, factory } of factories) {
    it(`${name}: getParams always includes namespace and code`, () => {
      const schema = factory() as z.ZodType
      fc.assert(
        fc.property(fc.string(), (input) => {
          const result = schema.safeParse(input)
          if (!result.success) {
            for (const issue of result.error.issues) {
              // SAFETY: Zod issue paths are string|number in practice; symbol keys never appear
              const params = getParams(issue as unknown as Record<string, unknown>)
              expect(typeof params.namespace).toBe('string')
              expect(params.namespace.length).toBeGreaterThan(0)
              expect(typeof params.code).toBe('string')
              expect(params.code.length).toBeGreaterThan(0)
            }
          }
        }),
        { numRuns: 200 },
      )
    })
  }
})
