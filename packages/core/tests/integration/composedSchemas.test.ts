// ==============================================================================
// COMPOSED SCHEMAS — INTEGRATION TESTS
// Validates multi-rule z.object() schemas through the validate() entry point.
// ------------------------------------------------------------------------------
// Each section models a real-world form and asserts both success and structured
// error output (errors, firstErrors, nestedErrors).
// ==============================================================================

import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { validate } from '@core/validate'
import { Country } from '@rules/country'
import { CreditCard } from '@rules/creditCard'
import { Email } from '@rules/email'
import { Jwt } from '@rules/jwt'
import { Password } from '@rules/password'
import { PersonName } from '@rules/personName'
import { Phone } from '@rules/phone'
import { PostalCode } from '@rules/postalCode'
import { Text } from '@rules/text'
import { Username } from '@rules/username'
import { Website } from '@rules/website'

import { makeJwt, nowSeconds } from '../_support/helpers/jwt'

// ----------------------------------------------------------
// 6.1 — REGISTER FORM
// ----------------------------------------------------------

describe('composed: register form', () => {
  const registerSchema = z.object({
    email: Email() as z.ZodType,
    password: Password() as z.ZodType,
    username: Username() as z.ZodType,
  })

  it('accepts valid registration data', async () => {
    const result = await validate(registerSchema, {
      email: 'user@example.com',
      password: 'Str0ng!Pass',
      username: 'testuser',
    })

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
    expect(result.errors).toEqual({})
    expect(result.firstErrors).toEqual({})
    expect(result.nestedErrors).toEqual({})
  })

  it('rejects empty data with errors for each field', async () => {
    const result = await validate(registerSchema, {
      email: '',
      password: '',
      username: '',
    })

    expect(result.success).toBe(false)
    expect(result.errors['email']).toBeDefined()
    expect(result.errors['password']).toBeDefined()
    expect(result.errors['username']).toBeDefined()
  })

  it('reports only email error when email is invalid and others are valid', async () => {
    const result = await validate(registerSchema, {
      email: 'not-an-email',
      password: 'Str0ng!Pass',
      username: 'testuser',
    })

    expect(result.success).toBe(false)
    expect(result.errors['email']).toBeDefined()
    expect(result.errors['password']).toBeUndefined()
    expect(result.errors['username']).toBeUndefined()
  })

  it('reports errors for all fields when all are invalid', async () => {
    const result = await validate(registerSchema, {
      email: 'bad',
      password: 'x',
      username: '!!',
    })

    expect(result.success).toBe(false)
    expect(Object.keys(result.errors).length).toBeGreaterThanOrEqual(3)
    expect(result.errors['email']).toBeDefined()
    expect(result.errors['password']).toBeDefined()
    expect(result.errors['username']).toBeDefined()
  })

  it('produces correct ValidationResult shape', async () => {
    const result = await validate(registerSchema, {
      email: 'bad',
      password: 'x',
      username: '!!',
    })

    expect(result.success).toBe(false)
    expect(result).toHaveProperty('errors')
    expect(result).toHaveProperty('firstErrors')
    expect(result).toHaveProperty('nestedErrors')
    expect(result).toHaveProperty('issues')

    // errors is a Record<string, string[]>
    for (const key of Object.keys(result.errors)) {
      expect(Array.isArray(result.errors[key])).toBe(true)
    }

    // firstErrors is a Record<string, string>
    for (const key of Object.keys(result.firstErrors)) {
      expect(typeof result.firstErrors[key]).toBe('string')
    }

    // nestedErrors mirrors schema shape
    expect(typeof result.nestedErrors).toBe('object')
  })
})

// ----------------------------------------------------------
// 6.2 — LOGIN FORM
// ----------------------------------------------------------

describe('composed: login form', () => {
  const loginSchema = z.object({
    email: Email() as z.ZodType,
    password: Password() as z.ZodType,
  })

  it('accepts valid login credentials', async () => {
    const result = await validate(loginSchema, {
      email: 'user@example.com',
      password: 'Str0ng!Pass',
    })

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
  })

  it('rejects missing email', async () => {
    const result = await validate(loginSchema, {
      email: '',
      password: 'Str0ng!Pass',
    })

    expect(result.success).toBe(false)
    expect(result.errors['email']).toBeDefined()
    expect(result.errors['password']).toBeUndefined()
  })

  it('rejects missing password', async () => {
    const result = await validate(loginSchema, {
      email: 'user@example.com',
      password: '',
    })

    expect(result.success).toBe(false)
    expect(result.errors['password']).toBeDefined()
    expect(result.errors['email']).toBeUndefined()
  })

  it('rejects both fields empty', async () => {
    const result = await validate(loginSchema, {
      email: '',
      password: '',
    })

    expect(result.success).toBe(false)
    expect(result.errors['email']).toBeDefined()
    expect(result.errors['password']).toBeDefined()
  })
})

// ----------------------------------------------------------
// 6.3 — PROFILE FORM
// ----------------------------------------------------------

describe('composed: profile form', () => {
  const profileSchema = z.object({
    name: PersonName() as z.ZodType,
    phone: (Phone() as z.ZodType).optional(),
    website: (Website() as z.ZodType).optional(),
    bio: (Text({ noHtml: true }) as z.ZodType).optional(),
  })

  it('accepts valid profile with all fields', async () => {
    const result = await validate(profileSchema, {
      name: 'John Doe',
      phone: '+12125551234',
      website: 'https://example.com',
      bio: 'A short biography without any HTML.',
    })

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
  })

  it('accepts valid profile with only required fields', async () => {
    const result = await validate(profileSchema, {
      name: 'Jane Smith',
    })

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
  })

  it('reports only name error when name is invalid and rest are valid', async () => {
    const result = await validate(profileSchema, {
      name: '',
      phone: '+12125551234',
      website: 'https://example.com',
    })

    expect(result.success).toBe(false)
    expect(result.errors['name']).toBeDefined()
    expect(result.errors['phone']).toBeUndefined()
    expect(result.errors['website']).toBeUndefined()
  })

  it('rejects bio containing HTML', async () => {
    const result = await validate(profileSchema, {
      name: 'John Doe',
      bio: 'Hello <script>alert("xss")</script>',
    })

    expect(result.success).toBe(false)
    expect(result.errors['bio']).toBeDefined()
  })

  it('rejects invalid phone number', async () => {
    const result = await validate(profileSchema, {
      name: 'John Doe',
      phone: 'not-a-phone',
    })

    expect(result.success).toBe(false)
    expect(result.errors['phone']).toBeDefined()
  })
})

// ----------------------------------------------------------
// 6.4 — PAYMENT FORM
// ----------------------------------------------------------

describe('composed: payment form', () => {
  const paymentSchema = z.object({
    cardNumber: CreditCard() as z.ZodType,
    postalCode: PostalCode({ country: 'US' }) as z.ZodType,
    country: Country() as z.ZodType,
  })

  it('accepts valid payment data', async () => {
    const result = await validate(paymentSchema, {
      cardNumber: '4532015112830366',
      postalCode: '10001',
      country: 'US',
    })

    expect(result.success).toBe(true)
    expect(result.data).toBeDefined()
  })

  it('rejects invalid card number', async () => {
    const result = await validate(paymentSchema, {
      cardNumber: '1234567890123456',
      postalCode: '10001',
      country: 'US',
    })

    expect(result.success).toBe(false)
    expect(result.errors['cardNumber']).toBeDefined()
  })

  it('rejects invalid postal code', async () => {
    const result = await validate(paymentSchema, {
      cardNumber: '4532015112830366',
      postalCode: 'XXXXX',
      country: 'US',
    })

    expect(result.success).toBe(false)
    expect(result.errors['postalCode']).toBeDefined()
  })

  it('reports errors on each invalid field', async () => {
    const result = await validate(paymentSchema, {
      cardNumber: '0000',
      postalCode: 'ZZ',
      country: 'XX',
    })

    expect(result.success).toBe(false)
    expect(result.errors['cardNumber']).toBeDefined()
    expect(result.errors['postalCode']).toBeDefined()
    expect(result.errors['country']).toBeDefined()
  })
})

// ----------------------------------------------------------
// 6.5 — AUTH TOKEN (JWT)
// ----------------------------------------------------------

describe('composed: auth token (JWT)', () => {
  const tokenSchema = Jwt({
    checkExpiry: true,
    requireClaims: ['sub', 'iss'],
    allowAlgorithms: ['HS256', 'RS256'],
  }) as z.ZodType

  it('accepts valid JWT with all claims and allowed algorithm', async () => {
    const token = makeJwt(
      { alg: 'HS256', typ: 'JWT' },
      { sub: 'user123', iss: 'auth-server', exp: nowSeconds() + 3600 },
    )
    const result = await tokenSchema.safeParseAsync(token)

    expect(result.success).toBe(true)
  })

  it('rejects expired JWT', async () => {
    const token = makeJwt(
      { alg: 'HS256', typ: 'JWT' },
      { sub: 'user123', iss: 'auth-server', exp: nowSeconds() - 3600 },
    )
    const result = await tokenSchema.safeParseAsync(token)

    expect(result.success).toBe(false)
  })

  it('rejects JWT missing required claim', async () => {
    const token = makeJwt(
      { alg: 'HS256', typ: 'JWT' },
      { sub: 'user123', exp: nowSeconds() + 3600 },
    )
    const result = await tokenSchema.safeParseAsync(token)

    expect(result.success).toBe(false)
  })

  it('rejects JWT with disallowed algorithm', async () => {
    const token = makeJwt(
      { alg: 'ES512', typ: 'JWT' },
      { sub: 'user123', iss: 'auth-server', exp: nowSeconds() + 3600 },
    )
    const result = await tokenSchema.safeParseAsync(token)

    expect(result.success).toBe(false)
  })
})
