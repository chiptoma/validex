// ==============================================================================
// INTEGRATION — I18N SYSTEM
// Tests i18n.t() wiring for labels and messages, label.transform,
// message.transform, labelKey correctness, and end-to-end translation.
// ==============================================================================

import type { z } from 'zod'

import { afterEach, describe, expect, it, vi } from 'vitest'
import { z as zod } from 'zod'

import { resetConfig, setup } from '@config'
import { registerCustomError } from '@core/customError'
import { getParams } from '@core/getParams'
import { validate } from '@core/validate'
import { Email } from '@rules/email'
import { Password } from '@rules/password'

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Get First Issue Message
 * Parses a schema and returns the first issue's message string.
 *
 * @param schema - The Zod schema.
 * @param value  - The value to parse.
 * @returns The first issue message, or undefined if parse succeeds.
 */
async function getFirstIssueMessage(
  schema: unknown,
  value: unknown,
): Promise<string | undefined> {
  const result = await (schema as z.ZodType).safeParseAsync(value)
  if (result.success)
    return undefined
  // SAFETY: Zod issues always carry a message string
  const issue = result.error.issues[0] as { message: string } | undefined
  return issue?.message
}

/**
 * Get First Error Params
 * Extracts getParams() from the first issue of a failed parse.
 *
 * @param schema - The Zod schema.
 * @param value  - The value to parse.
 * @returns The ErrorParams of the first issue, or undefined.
 */
async function getFirstErrorParams(
  schema: unknown,
  value: unknown,
): Promise<ReturnType<typeof getParams> | undefined> {
  const result = await (schema as z.ZodType).safeParseAsync(value)
  if (result.success)
    return undefined
  const issue = result.error.issues[0]
  if (issue === undefined)
    return undefined
  return getParams(issue as Parameters<typeof getParams>[0])
}

// ----------------------------------------------------------
// TESTS
// ----------------------------------------------------------

describe('i18n system', () => {
  afterEach(() => {
    resetConfig()
  })

  // ----------------------------------------------------------
  // LABEL KEY CORRECTNESS
  // ----------------------------------------------------------

  describe('labelKey uses labels segment (not fields)', () => {
    it('produces validation.labels.{field} for a top-level field', async () => {
      setup({ i18n: { enabled: true } })
      registerCustomError()

      const schema = zod.object({ email: Email() as z.ZodType })
      const params = await getFirstErrorParams(schema, { email: 'bad' })
      expect(params).toBeDefined()
      expect(params?.labelKey).toBe('validation.labels.email')
    })

    it('produces validation.labels.billing.email for nested path', async () => {
      setup({ i18n: { enabled: true } })
      registerCustomError()

      const schema = zod.object({
        billing: zod.object({ email: Email() as z.ZodType }),
      })
      const params = await getFirstErrorParams(schema, { billing: { email: 'bad' } })
      expect(params).toBeDefined()
      expect(params?.labelKey).toBe('validation.labels.billing.email')
    })

    it('respects custom prefix and separator', async () => {
      setup({ i18n: { enabled: true, prefix: 'v', separator: ':' } })
      registerCustomError()

      const schema = zod.object({ email: Email() as z.ZodType })
      const params = await getFirstErrorParams(schema, { email: 'bad' })
      expect(params).toBeDefined()
      expect(params?.labelKey).toBe('v:labels:email')
      expect(params?.key).toMatch(/^v:messages:/)
    })
  })

  // ----------------------------------------------------------
  // PATH MODE
  // ----------------------------------------------------------

  describe('i18n.pathMode', () => {
    it('pathMode key prepends last path segment into message key', async () => {
      setup({ i18n: { enabled: true, pathMode: 'key' } })
      registerCustomError()

      const schema = zod.object({
        billing: zod.object({ email: Email() as z.ZodType }),
      })
      const params = await getFirstErrorParams(schema, { billing: { email: 'bad' } })
      expect(params).toBeDefined()
      // key = prefix.messages.{lastPathSegment}.namespace.code
      expect(params?.key).toBe('validation.messages.email.email.invalid')
    })

    it('pathMode full embeds entire path into message key', async () => {
      setup({ i18n: { enabled: true, pathMode: 'full' } })
      registerCustomError()

      const schema = zod.object({
        billing: zod.object({ email: Email() as z.ZodType }),
      })
      const params = await getFirstErrorParams(schema, { billing: { email: 'bad' } })
      expect(params).toBeDefined()
      // key = prefix.messages.{...allPathSegments}.namespace.code
      expect(params?.key).toBe('validation.messages.billing.email.email.invalid')
    })

    it('pathMode function uses transform return value in message key', async () => {
      setup({ i18n: { enabled: true, pathMode: path => path.join('/') } })
      registerCustomError()

      const schema = zod.object({
        billing: zod.object({ email: Email() as z.ZodType }),
      })
      const params = await getFirstErrorParams(schema, { billing: { email: 'bad' } })
      expect(params).toBeDefined()
      // key = prefix.messages.{fn(path)}.namespace.code
      expect(params?.key).toBe('validation.messages.billing/email.email.invalid')
    })

    it('pathMode does not affect label keys', async () => {
      setup({ i18n: { enabled: true, pathMode: 'full' } })
      registerCustomError()

      const schema = zod.object({
        billing: zod.object({ email: Email() as z.ZodType }),
      })
      const params = await getFirstErrorParams(schema, { billing: { email: 'bad' } })
      expect(params).toBeDefined()
      // labelKey always uses validation.labels.{...path} regardless of pathMode
      expect(params?.labelKey).toBe('validation.labels.billing.email')
    })
  })

  // ----------------------------------------------------------
  // LABEL FALLBACK
  // ----------------------------------------------------------

  describe('label.fallback', () => {
    it('generic fallback produces "This field" label', async () => {
      setup({ label: { fallback: 'generic' } })
      registerCustomError()

      const schema = zod.object({ email: Email() as z.ZodType })
      const params = await getFirstErrorParams(schema, { email: 'bad' })
      expect(params).toBeDefined()
      expect(params?.label).toBe('This field')
    })

    it('none fallback produces empty string label', async () => {
      setup({ label: { fallback: 'none' } })
      registerCustomError()

      const schema = zod.object({ email: Email() as z.ZodType })
      const params = await getFirstErrorParams(schema, { email: 'bad' })
      expect(params).toBeDefined()
      expect(params?.label).toBe('')
    })

    it('generic fallback shows "This field" in error messages', async () => {
      setup({ label: { fallback: 'generic' } })
      registerCustomError()

      const schema = zod.object({ email: Email() as z.ZodType })
      const msg = await getFirstIssueMessage(schema, { email: 'bad' })
      expect(msg).toBeDefined()
      expect(msg).toContain('This field')
    })

    it('none fallback omits label from error messages', async () => {
      setup({ label: { fallback: 'none' } })
      registerCustomError()

      const schema = zod.object({ email: Email() as z.ZodType })
      const msg = await getFirstIssueMessage(schema, { email: 'bad' })
      expect(msg).toBeDefined()
      // With empty label, message should not start with a field name
      expect(msg).not.toContain('Email')
      expect(msg).not.toContain('This field')
    })
  })

  // ----------------------------------------------------------
  // LABEL TRANSFORM
  // ----------------------------------------------------------

  describe('label.transform', () => {
    it('calls transform and uses its result as the label', async () => {
      const transform = vi.fn(
        (ctx: { path: ReadonlyArray<string | number>, fieldName: string, defaultLabel: string }) =>
          ctx.fieldName.toUpperCase(),
      )
      setup({ label: { transform } })
      registerCustomError()

      const schema = zod.object({ email: Email() as z.ZodType })
      const params = await getFirstErrorParams(schema, { email: 'bad' })
      expect(params).toBeDefined()
      expect(transform).toHaveBeenCalled()
      expect(params?.label).toBe('EMAIL')
    })

    it('receives correct ctx shape', async () => {
      const transform = vi.fn(
        (ctx: { path: ReadonlyArray<string | number>, fieldName: string, defaultLabel: string }) =>
          ctx.defaultLabel,
      )
      setup({ label: { transform } })
      registerCustomError()

      const schema = zod.object({ emailAddress: Email() as z.ZodType })
      await getFirstErrorParams(schema, { emailAddress: 'bad' })

      expect(transform).toHaveBeenCalled()
      // Find the call with path containing 'emailAddress' (not the root-level call)
      const ctxCalls = transform.mock.calls.map(
        (call: unknown[]) => call[0] as Record<string, unknown>,
      )
      const fieldCall = ctxCalls.find(ctx => ctx['fieldName'] === 'emailAddress')
      expect(fieldCall).toBeDefined()
      expect(fieldCall?.['defaultLabel']).toBe('Email Address')
      expect(fieldCall?.['path']).toContainEqual('emailAddress')
    })

    it('explicit label bypasses transform for validex issues', async () => {
      const transform = vi.fn(() => 'FROM TRANSFORM')
      setup({ label: { transform } })
      registerCustomError()

      const schema = zod.object({
        email: Email({ label: 'Work Email' }) as z.ZodType,
      })
      const params = await getFirstErrorParams(schema, { email: 'bad' })
      expect(params).toBeDefined()
      // Explicit label wins — transform result is not used for this issue
      expect(params?.label).toBe('Work Email')
    })
  })

  // ----------------------------------------------------------
  // I18N T() FOR LABELS
  // ----------------------------------------------------------

  describe('i18n.t() for labels', () => {
    it('translates label via t(labelKey) when i18n enabled', async () => {
      const labels: Record<string, string> = {
        'validation.labels.email': 'Correo electrónico',
      }
      const t = vi.fn((key: string) => labels[key] ?? key)

      setup({ i18n: { enabled: true, t } })
      registerCustomError()

      const schema = zod.object({ email: Email() as z.ZodType })
      const params = await getFirstErrorParams(schema, { email: 'bad' })
      expect(params).toBeDefined()
      expect(params?.label).toBe('Correo electrónico')
      expect(t).toHaveBeenCalledWith('validation.labels.email')
    })

    it('explicit label bypasses t() for labels on validex issues', async () => {
      const t = vi.fn((key: string) => `translated:${key}`)
      setup({ i18n: { enabled: true, t } })
      registerCustomError()

      const schema = zod.object({
        email: Email({ label: 'Work Email' }) as z.ZodType,
      })
      const params = await getFirstErrorParams(schema, { email: 'bad' })
      expect(params).toBeDefined()
      // Explicit label wins — t() translation is not used for this issue's label
      expect(params?.label).toBe('Work Email')
    })

    it('label.transform takes priority over t() for labels', async () => {
      const t = vi.fn((key: string) => `translated:${key}`)
      const transform = vi.fn(() => 'FROM TRANSFORM')

      setup({
        i18n: { enabled: true, t },
        label: { transform },
      })
      registerCustomError()

      const schema = zod.object({ email: Email() as z.ZodType })
      const params = await getFirstErrorParams(schema, { email: 'bad' })
      expect(params).toBeDefined()
      expect(params?.label).toBe('FROM TRANSFORM')
      expect(transform).toHaveBeenCalled()
      // t() should not have been called with the label key
      const labelCalls = t.mock.calls.filter(
        (call: unknown[]) => typeof call[0] === 'string' && call[0].includes('labels'),
      )
      expect(labelCalls).toHaveLength(0)
    })

    it('falls back to path derivation when t() returns the key unchanged', async () => {
      // Simulate a missing translation — t() returns the key itself
      const t = vi.fn((key: string) => key)
      setup({ i18n: { enabled: true, t } })
      registerCustomError()

      const schema = zod.object({ email: Email() as z.ZodType })
      const params = await getFirstErrorParams(schema, { email: 'bad' })
      expect(params).toBeDefined()
      // Falls back to path derivation: 'email' → 'Email'
      expect(params?.label).toBe('Email')
    })
  })

  // ----------------------------------------------------------
  // I18N T() FOR MESSAGES
  // ----------------------------------------------------------

  describe('i18n.t() for messages', () => {
    it('calls t(key, params) for message resolution when i18n enabled with t()', async () => {
      const esMessages: Record<string, string> = {
        'validation.labels.email': 'Correo electrónico',
        'validation.messages.email.invalid': '{{label}} no es válido',
      }
      const t = vi.fn((key: string, params?: Record<string, unknown>) => {
        let msg = esMessages[key] ?? key
        if (params !== undefined) {
          for (const [k, v] of Object.entries(params)) {
            msg = msg.replaceAll(`{{${k}}}`, String(v))
          }
        }
        return msg
      })

      setup({ i18n: { enabled: true, t } })
      registerCustomError()

      const schema = zod.object({ email: Email() as z.ZodType })
      const result = await validate(schema, { email: 'bad' })
      expect(result.success).toBe(false)

      // The final error for the email field should be the translated message
      const emailErrors = result.errors['email'] ?? []
      expect(emailErrors.length).toBeGreaterThan(0)
      expect(emailErrors).toContainEqual('Correo electrónico no es válido')

      // Verify t() was called with the email.invalid key
      const emailInvalidCalls = (t.mock.calls as unknown[][]).filter(
        (call: unknown[]) => call[0] === 'validation.messages.email.invalid',
      )
      expect(emailInvalidCalls.length).toBeGreaterThan(0)
      const callParams = emailInvalidCalls[0]?.[1] as Record<string, unknown> | undefined
      expect(callParams).toHaveProperty('label', 'Correo electrónico')
    })

    it('passes translated label inside params to t() for message', async () => {
      const translations: Record<string, string> = {
        'validation.labels.email': 'Correo',
        'validation.messages.email.invalid': 'TRANSLATED',
      }
      const t = vi.fn((key: string) => translations[key] ?? key)

      setup({ i18n: { enabled: true, t } })
      registerCustomError()

      const schema = zod.object({ email: Email() as z.ZodType })
      await validate(schema, { email: 'bad' })

      // Find the email.invalid message call and verify translated label in params
      const emailInvalidCalls = (t.mock.calls as unknown[][]).filter(
        (call: unknown[]) => call[0] === 'validation.messages.email.invalid',
      )
      expect(emailInvalidCalls.length).toBeGreaterThan(0)
      const msgParams = emailInvalidCalls[0]?.[1] as Record<string, unknown> | undefined
      expect(msgParams?.['label']).toBe('Correo')
    })
  })

  // ----------------------------------------------------------
  // I18N ENABLED WITHOUT T()
  // ----------------------------------------------------------

  describe('i18n enabled without t()', () => {
    it('returns the raw key as the message when no t() provided', async () => {
      setup({ i18n: { enabled: true } })
      registerCustomError()

      const schema = zod.object({ email: Email() as z.ZodType })
      const msg = await getFirstIssueMessage(schema, { email: 'bad' })
      expect(msg).toBe('validation.messages.email.invalid')
    })

    it('returns raw key for required error', async () => {
      setup({ i18n: { enabled: true } })
      registerCustomError()

      const schema = zod.object({ email: Email() as z.ZodType })
      const msg = await getFirstIssueMessage(schema, { email: '' })
      // emptyToUndefined triggers a required-like error
      expect(msg).toMatch(/^validation\.messages\./)
    })
  })

  // ----------------------------------------------------------
  // MESSAGE TRANSFORM
  // ----------------------------------------------------------

  describe('message.transform', () => {
    it('wraps English message when i18n disabled', async () => {
      const transform = vi.fn(
        (ctx: { code: string, message: string }) => `[${ctx.code}] ${ctx.message}`,
      )
      // SAFETY: vi.fn wraps the subset used; full MessageTransform signature is a superset
      setup({ message: { transform: transform as never } })
      registerCustomError()

      const schema = zod.object({ email: Email() as z.ZodType })
      const msg = await getFirstIssueMessage(schema, { email: 'bad' })
      expect(msg).toBeDefined()
      expect(msg).toMatch(/^\[invalid\]/)
      expect(msg).toContain('not a valid email')
    })

    it('wraps translated message when i18n enabled with t()', async () => {
      const t = (_key: string, _params?: Record<string, unknown>): string => 'TRANSLATED'
      const transform = vi.fn(
        (ctx: { code: string, message: string }) => `[${ctx.code}] ${ctx.message}`,
      )
      setup({
        i18n: { enabled: true, t },
        message: { transform: transform as never },
      })
      registerCustomError()

      const schema = zod.object({ email: Email() as z.ZodType })
      const msg = await getFirstIssueMessage(schema, { email: 'bad' })
      expect(msg).toBe('[invalid] TRANSLATED')
    })

    it('receives correct ctx shape', async () => {
      const transform = vi.fn(
        (ctx: { key: string, code: string, namespace: string, label: string, message: string, params: Record<string, unknown> }) =>
          ctx.message,
      )
      setup({ message: { transform: transform as never } })
      registerCustomError()

      const schema = zod.object({ email: Email() as z.ZodType })
      await getFirstIssueMessage(schema, { email: 'bad' })

      expect(transform).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'validation.messages.email.invalid',
          code: 'invalid',
          namespace: 'email',
          label: 'Email',
        }),
      )
      const ctx = transform.mock.calls[0]?.[0] as { message: string, params: Record<string, unknown> } | undefined
      expect(ctx?.message).toBeTruthy()
      expect(ctx?.params).toBeDefined()
    })
  })

  // ----------------------------------------------------------
  // END-TO-END SPANISH CONSUMER TEST
  // ----------------------------------------------------------

  describe('end-to-end Spanish consumer', () => {
    it('produces fully translated Spanish errors for composed schema', async () => {
      const esMessages: Record<string, string> = {
        'validation.labels.email': 'Correo electrónico',
        'validation.labels.password': 'Contraseña',
        'validation.labels.age': 'Edad',
        'validation.messages.email.invalid': '{{label}} no es válido',
        'validation.messages.base.min': '{{label}} debe tener al menos {{minimum}} caracteres',
        'validation.messages.base.type': '{{label}} debe ser un {{expected}}',
        'validation.messages.base.required': '{{label}} es requerido',
      }

      const t = (key: string, params?: Record<string, unknown>): string => {
        let msg = esMessages[key] ?? key
        if (params !== undefined) {
          for (const [k, v] of Object.entries(params)) {
            msg = msg.replaceAll(`{{${k}}}`, String(v))
          }
        }
        return msg
      }

      setup({ i18n: { enabled: true, t } })
      registerCustomError()

      const schema = zod.object({
        email: Email() as z.ZodType,
        password: Password({ length: { min: 10 } }) as z.ZodType,
        age: zod.number(),
      })

      const result = await validate(schema, {
        email: 'bad',
        password: 'short',
        age: 'hello',
      })

      expect(result.success).toBe(false)

      // Email: translated label + translated message
      const emailErrors = result.errors['email'] ?? []
      expect(emailErrors.length).toBeGreaterThan(0)
      expect(emailErrors).toContainEqual('Correo electrónico no es válido')

      // Password: translated label + min length message
      const pwdErrors = result.errors['password'] ?? []
      expect(pwdErrors.length).toBeGreaterThan(0)
      const hasMinError = pwdErrors.some(
        (e: string) => e.includes('Contraseña') && e.includes('al menos') && e.includes('10'),
      )
      expect(hasMinError).toBe(true)

      // Age: raw Zod type error → translated via base.type
      const ageErrors = result.errors['age'] ?? []
      expect(ageErrors.length).toBeGreaterThan(0)
      expect(ageErrors[0]).toContain('Edad')
      expect(ageErrors[0]).toContain('number')
    })
  })

  // ----------------------------------------------------------
  // BACKWARD COMPATIBILITY
  // ----------------------------------------------------------

  describe('backward compatibility', () => {
    it('produces English messages when i18n is disabled (default)', async () => {
      registerCustomError()

      const schema = zod.object({ email: Email() as z.ZodType })
      const msg = await getFirstIssueMessage(schema, { email: 'bad' })
      expect(msg).toContain('not a valid email')
    })

    it('getParams has no labelKey when i18n is disabled', async () => {
      registerCustomError()

      const schema = zod.object({ email: Email() as z.ZodType })
      const params = await getFirstErrorParams(schema, { email: 'bad' })
      expect(params).toBeDefined()
      expect(params?.labelKey).toBeUndefined()
    })

    it('label derivation works unchanged without transforms', async () => {
      registerCustomError()

      const schema = zod.object({ emailAddress: Email() as z.ZodType })
      const params = await getFirstErrorParams(schema, { emailAddress: 'bad' })
      expect(params).toBeDefined()
      expect(params?.label).toBe('Email Address')
    })
  })
})
