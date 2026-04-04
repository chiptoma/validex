// ==============================================================================
// FASTIFY ADAPTER — VALIDEX RULES INTEGRATION TESTS
// Verifies that validex rules produce correct errors and validex-owned messages
// when used through the fastify plugin layer.
// ==============================================================================

import type { ErrorResponse } from '../_support/helpers/testApp'

import { Email, getParams, Password, resetConfig } from '@validex/core'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { createApp, parseJson } from '../_support/helpers/testApp'

afterEach(() => resetConfig())

describe('validex rules through fastify plugin', () => {
  it('rejects invalid email via POST', async () => {
    const app = await createApp()
    app.post('/test', {
      config: { validex: { body: z.object({ email: Email() as z.ZodType }) } },
      handler: async () => ({ ok: true }),
    })

    expect((await app.inject({ method: 'POST', url: '/test', payload: { email: 'alice@example.com' } })).statusCode).toBe(200)
    expect((await app.inject({ method: 'POST', url: '/test', payload: { email: 'not-valid' } })).statusCode).toBe(400)

    await app.close()
  })

  it('rejects disposable domains via POST', async () => {
    const app = await createApp({ preload: { disposable: true } })
    app.post('/test', {
      config: { validex: { body: z.object({ email: Email({ blockDisposable: true }) as z.ZodType }) } },
      handler: async () => ({ ok: true }),
    })

    expect((await app.inject({ method: 'POST', url: '/test', payload: { email: 'user@mailinator.com' } })).statusCode).toBe(400)

    await app.close()
  })

  it('rejects invalid data with combined Email + Password rules', async () => {
    const app = await createApp()
    app.post('/test', {
      config: {
        validex: {
          body: z.object({
            email: Email() as z.ZodType,
            password: Password({ uppercase: { min: 1 }, digits: { min: 1 } }) as z.ZodType,
          }),
        },
      },
      handler: async () => ({ ok: true }),
    })

    const response = await app.inject({ method: 'POST', url: '/test', payload: { email: 'bad', password: 'weak' } })
    expect(response.statusCode).toBe(400)
    const body = parseJson<ErrorResponse>(response)
    expect(body.errors['email']).toBeDefined()
    expect(body.errors['password']).toBeDefined()

    await app.close()
  })

  it('error response includes validex error codes, not raw Zod defaults', async () => {
    const app = await createApp()
    app.post('/test', {
      config: { validex: { body: z.object({ email: Email() as z.ZodType }) } },
      handler: async () => ({ ok: true }),
    })

    const response = await app.inject({ method: 'POST', url: '/test', payload: { email: '' } })
    const body = parseJson<ErrorResponse>(response)
    expect(body.statusCode).toBe(400)

    const allErrors = body.allErrors['email'] ?? []
    expect(allErrors.length).toBeGreaterThan(0)
    for (const msg of allErrors) {
      expect(msg).not.toBe('Invalid input')
      expect(msg).not.toBe('Expected string')
    }

    await app.close()
  })

  it('getParams works on validation errors from request.validate', async () => {
    const app = await createApp()
    app.post('/test', async (request) => {
      const result = await request.validate(z.object({ email: Email() as z.ZodType }))
      if (!result.success) {
        // SAFETY: validate returned success=false so issues is non-empty
        const params = getParams(result.issues[0] as Parameters<typeof getParams>[0])
        return { namespace: params.namespace, code: params.code }
      }
      return { ok: true }
    })

    const response = await app.inject({ method: 'POST', url: '/test', payload: { email: 'not-an-email' } })
    const body = parseJson(response)
    expect(body['namespace']).toBe('email')
    expect(body['code']).toBe('invalid')

    await app.close()
  })

  it('multiple routes with different schemas validate independently', async () => {
    const app = await createApp()
    app.post('/email', {
      config: { validex: { body: z.object({ email: Email() as z.ZodType }) } },
      handler: async () => ({ route: 'email' }),
    })
    app.post('/password', {
      config: { validex: { body: z.object({ password: Password({ digits: { min: 1 } }) as z.ZodType }) } },
      handler: async () => ({ route: 'password' }),
    })

    expect((await app.inject({ method: 'POST', url: '/email', payload: { email: 'a@b.com' } })).statusCode).toBe(200)
    expect((await app.inject({ method: 'POST', url: '/password', payload: { password: 'nope' } })).statusCode).toBe(400)

    await app.close()
  })
})
