// ==============================================================================
// FASTIFY ADAPTER — VALIDEX RULES INTEGRATION TESTS
// Verifies that validex rules produce correct errors and validex-owned messages
// when used through the fastify plugin layer.
// ==============================================================================

import { Email, getParams, Password, resetConfig } from '@validex/core'
import Fastify from 'fastify'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { validexPlugin } from '../../src'

interface ErrorResponse {
  readonly statusCode: number
  readonly error: string
  readonly errors: Record<string, string>
  readonly allErrors: Record<string, readonly string[]>
}

function parseJson(response: { json: () => unknown }): Record<string, unknown> {
  return response.json() as Record<string, unknown>
}

describe('validex rules through fastify plugin', () => {
  afterEach(() => resetConfig())

  it('pOST with Email validation rejects invalid email', async () => {
    const app = Fastify()
    await app.register(validexPlugin)

    const schema = z.object({ email: Email() as z.ZodType })
    app.post('/test', {
      config: { validex: { body: schema } },
      handler: async () => ({ ok: true }),
    })

    const valid = await app.inject({
      method: 'POST',
      url: '/test',
      payload: { email: 'alice@example.com' },
    })
    expect(valid.statusCode).toBe(200)

    const invalid = await app.inject({
      method: 'POST',
      url: '/test',
      payload: { email: 'not-valid' },
    })
    expect(invalid.statusCode).toBe(400)
  })

  it('pOST with Email blockDisposable rejects disposable domains', async () => {
    const app = Fastify()
    await app.register(validexPlugin, {
      preload: { disposable: true },
    })

    const schema = z.object({
      email: Email({ blockDisposable: true }) as z.ZodType,
    })
    app.post('/test', {
      config: { validex: { body: schema } },
      handler: async () => ({ ok: true }),
    })

    const response = await app.inject({
      method: 'POST',
      url: '/test',
      payload: { email: 'user@mailinator.com' },
    })
    expect(response.statusCode).toBe(400)
  })

  it('pOST with combined Email + Password rules', async () => {
    const app = Fastify()
    await app.register(validexPlugin)

    const schema = z.object({
      email: Email() as z.ZodType,
      password: Password({ uppercase: { min: 1 }, digits: { min: 1 } }) as z.ZodType,
    })
    app.post('/test', {
      config: { validex: { body: schema } },
      handler: async () => ({ ok: true }),
    })

    const invalid = await app.inject({
      method: 'POST',
      url: '/test',
      payload: { email: 'bad', password: 'weak' },
    })
    expect(invalid.statusCode).toBe(400)
    const errBody = parseJson(invalid) as unknown as ErrorResponse
    expect(errBody.errors['email']).toBeDefined()
    expect(errBody.errors['password']).toBeDefined()
  })

  it('error response includes validex error codes, not raw Zod defaults', async () => {
    const app = Fastify()
    await app.register(validexPlugin)

    const schema = z.object({ email: Email() as z.ZodType })
    app.post('/test', {
      config: { validex: { body: schema } },
      handler: async () => ({ ok: true }),
    })

    const response = await app.inject({
      method: 'POST',
      url: '/test',
      payload: { email: '' },
    })
    const body = parseJson(response) as unknown as ErrorResponse
    expect(body.statusCode).toBe(400)

    const allErrors = body.allErrors['email'] ?? []
    expect(allErrors.length).toBeGreaterThan(0)
    for (const msg of allErrors) {
      expect(msg).not.toBe('Invalid input')
      expect(msg).not.toBe('Expected string')
    }
  })

  it('getParams works on validation errors from request.validate', async () => {
    const app = Fastify()
    await app.register(validexPlugin)

    const schema = z.object({ email: Email() as z.ZodType })
    app.post('/test', async (request) => {
      const result = await request.validate(schema)
      if (!result.success) {
        // SAFETY: validate returned success=false so issues is non-empty
        const params = getParams(result.issues[0] as Parameters<typeof getParams>[0])
        return { namespace: params.namespace, code: params.code }
      }
      return { ok: true }
    })

    const response = await app.inject({
      method: 'POST',
      url: '/test',
      payload: { email: 'not-an-email' },
    })
    const body = parseJson(response)
    expect(body['namespace']).toBe('email')
    expect(body['code']).toBe('invalid')
  })

  it('multiple routes with different schemas validate independently', async () => {
    const app = Fastify()
    await app.register(validexPlugin)

    const emailSchema = z.object({ email: Email() as z.ZodType })
    const passSchema = z.object({
      password: Password({ digits: { min: 1 } }) as z.ZodType,
    })

    app.post('/email', {
      config: { validex: { body: emailSchema } },
      handler: async () => ({ route: 'email' }),
    })
    app.post('/password', {
      config: { validex: { body: passSchema } },
      handler: async () => ({ route: 'password' }),
    })

    // Valid email, invalid password
    const r1 = await app.inject({
      method: 'POST',
      url: '/email',
      payload: { email: 'a@b.com' },
    })
    expect(r1.statusCode).toBe(200)

    const r2 = await app.inject({
      method: 'POST',
      url: '/password',
      payload: { password: 'nope' },
    })
    expect(r2.statusCode).toBe(400)
  })
})
