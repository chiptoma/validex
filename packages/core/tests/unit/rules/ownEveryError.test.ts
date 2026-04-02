// ==============================================================================
// OWN EVERY ERROR TESTS
// Verifies that every error from every rule carries correct label, namespace,
// and code. No "This field". No "base.format" when the rule has .invalid.
// Tests format errors, length errors, emptyToUndefined, and z.object composition.
// ==============================================================================

import type { z as zType } from 'zod'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { resetConfig } from '../../../src/config'
import { setup } from '../../../src/config/index'
import { getParams } from '../../../src/core/getParams'
import { validate } from '../../../src/core/validate'
import { DateTime } from '../../../src/rules/dateTime'
import { Email } from '../../../src/rules/email'
import { IpAddress } from '../../../src/rules/ipAddress'
import { LicenseKey } from '../../../src/rules/licenseKey'
import { Password } from '../../../src/rules/password'
import { PersonName } from '../../../src/rules/personName'
import { Url } from '../../../src/rules/url'
import { Uuid } from '../../../src/rules/uuid'

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

interface ParsedParams {
  label: string
  namespace: string
  code: string
  key: string
}

async function firstParams(
  schema: unknown,
  value: unknown,
): Promise<ParsedParams> {
  const result = await (schema as zType.ZodType).safeParseAsync(value)
  if (result.success)
    throw new Error('Expected failure')
  const p = getParams(result.error.issues[0] as Parameters<typeof getParams>[0])
  return { label: p.label, namespace: p.namespace, code: p.code, key: p.key }
}

async function firstParamsFromValidate(
  schema: zType.ZodType,
  data: Record<string, unknown>,
): Promise<ParsedParams> {
  const result = await validate(schema, data)
  if (result.success)
    throw new Error('Expected failure')
  const p = getParams(result.issues[0] as Parameters<typeof getParams>[0])
  return { label: p.label, namespace: p.namespace, code: p.code, key: p.key }
}

afterEach(() => resetConfig())

// ----------------------------------------------------------
// STEP 1 VERIFICATION: FORMAT CHECKS
// ----------------------------------------------------------

describe('format errors carry correct label + namespace', () => {
  it('email format error', async () => {
    const p = await firstParams(Email({ label: 'Correo' }), 'bad')
    expect(p.label).toBe('Correo')
    expect(p.namespace).toBe('email')
    expect(p.code).toBe('invalid')
  })

  it('url format error', async () => {
    const p = await firstParams(Url({ label: 'Enlace' }), 'bad')
    expect(p.label).toBe('Enlace')
    expect(p.namespace).toBe('url')
    expect(p.code).toBe('invalid')
  })

  it('uuid format error', async () => {
    const p = await firstParams(Uuid({ label: 'ID' }), 'bad')
    expect(p.label).toBe('ID')
    expect(p.namespace).toBe('uuid')
    expect(p.code).toBe('invalid')
  })

  it('dateTime format error', async () => {
    const p = await firstParams(DateTime({ label: 'Fecha' }), 'bad')
    expect(p.label).toBe('Fecha')
    expect(p.namespace).toBe('dateTime')
    expect(p.code).toBe('invalid')
  })

  it('ipAddress format error', async () => {
    const p = await firstParams(IpAddress({ label: 'Dirección IP', version: 'v4' }), 'bad')
    expect(p.label).toBe('Dirección IP')
    expect(p.namespace).toBe('ipAddress')
    expect(p.code).toBe('invalid')
  })

  it('licenseKey uuid format error', async () => {
    const p = await firstParams(LicenseKey({ label: 'Clave', type: 'uuid' }), 'bad')
    expect(p.label).toBe('Clave')
    expect(p.namespace).toBe('licenseKey')
    expect(p.code).toBe('invalid')
  })
})

// ----------------------------------------------------------
// STEP 2 VERIFICATION: LENGTH CHECKS
// ----------------------------------------------------------

describe('length errors carry correct label', () => {
  it('email min length', async () => {
    const p = await firstParams(Email({ label: 'Correo', length: { min: 20 } }), 'a@b.cc')
    expect(p.label).toBe('Correo')
    expect(p.code).toBe('min')
  })

  it('password min length', async () => {
    const p = await firstParams(Password({ label: 'Clave' }), 'Ab1!')
    expect(p.label).toBe('Clave')
    expect(p.code).toBe('min')
  })

  it('personName min length', async () => {
    const p = await firstParams(PersonName({ label: 'Nombre' }), 'A')
    expect(p.label).toBe('Nombre')
    expect(p.code).toBe('min')
  })
})

// ----------------------------------------------------------
// STEP 3 VERIFICATION: EMPTY TO UNDEFINED
// ----------------------------------------------------------

describe('emptyToUndefined carries label', () => {
  it('email empty string', async () => {
    const p = await firstParams(Email({ label: 'Correo' }), '')
    expect(p.label).toBe('Correo')
    expect(p.code).toBe('required')
  })

  it('password empty string', async () => {
    const p = await firstParams(Password({ label: 'Clave' }), '')
    expect(p.label).toBe('Clave')
    expect(p.code).toBe('required')
  })
})

// ----------------------------------------------------------
// STEP 5 VERIFICATION: COMPOSED SCHEMA TESTS
// ----------------------------------------------------------

describe('label survives z.object composition', () => {
  it('email format error in z.object', async () => {
    const schema = z.object({ email: Email({ label: 'Correo' }) as zType.ZodType })
    const p = await firstParamsFromValidate(schema, { email: 'bad' })
    expect(p.label).toBe('Correo')
    expect(p.namespace).toBe('email')
    expect(p.code).toBe('invalid')
  })

  it('nested z.object composition', async () => {
    const schema = z.object({
      profile: z.object({ email: Email({ label: 'Correo' }) as zType.ZodType }),
    })
    const p = await firstParamsFromValidate(schema, { profile: { email: 'bad' } })
    expect(p.label).toBe('Correo')
  })

  it('emptyToUndefined in z.object', async () => {
    const schema = z.object({ email: Email({ label: 'Correo' }) as zType.ZodType })
    const p = await firstParamsFromValidate(schema, { email: '' })
    expect(p.label).toBe('Correo')
    expect(p.code).toBe('required')
  })

  it('length error in z.object', async () => {
    const schema = z.object({
      email: Email({ label: 'Correo', length: { min: 20 } }) as zType.ZodType,
    })
    const p = await firstParamsFromValidate(schema, { email: 'a@b.cc' })
    expect(p.label).toBe('Correo')
    expect(p.code).toBe('min')
  })
})

// ----------------------------------------------------------
// STEP 6 VERIFICATION: I18N KEY MODE
// ----------------------------------------------------------

describe('i18n key mode produces correct keys', () => {
  it('email format error key', async () => {
    setup({ i18n: { enabled: true } })
    const p = await firstParams(Email({ label: 'Correo' }), 'bad')
    expect(p.key).toBe('validation.messages.email.invalid')
  })

  it('length error key', async () => {
    setup({ i18n: { enabled: true } })
    const p = await firstParams(Email({ label: 'Correo', length: { min: 20 } }), 'a@b.cc')
    expect(p.key).toBe('validation.messages.base.min')
  })
})
