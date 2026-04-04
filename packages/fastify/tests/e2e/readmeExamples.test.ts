// ==============================================================================
// README EXAMPLES — FASTIFY ADAPTER VERIFICATION TESTS
// Ensures Fastify adapter code examples in README.md work with the real API.
// ==============================================================================

import type { ErrorResponse } from '../_support/helpers/testApp'

import { Email, resetConfig } from '@validex/core'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { createApp, parseJson } from '../_support/helpers/testApp'

afterEach(() => resetConfig())

// ----------------------------------------------------------
// SUBPATH EXPORTS
// ----------------------------------------------------------

describe('readme examples — subpath exports (fastify)', () => {
  it('@validex/fastify exports validexPlugin and validateData', async () => {
    const { validexPlugin, validateData } = await import('../../src')
    expect(typeof validexPlugin).toBe('function')
    expect(typeof validateData).toBe('function')
  })
})

// ----------------------------------------------------------
// PLUGIN REGISTRATION EXAMPLE
// ----------------------------------------------------------

describe('readme examples — plugin registration', () => {
  it('registers plugin and validates a POST request', async () => {
    const app = await createApp()
    app.post('/users', {
      config: { validex: { body: z.object({ email: Email() as z.ZodType }) } },
      handler: async () => ({ created: true }),
    })

    const valid = await app.inject({ method: 'POST', url: '/users', payload: { email: 'alice@example.com' } })
    expect(valid.statusCode).toBe(200)

    const invalid = await app.inject({ method: 'POST', url: '/users', payload: { email: 'bad' } })
    expect(invalid.statusCode).toBe(400)
    expect(parseJson<ErrorResponse>(invalid).error).toBe('Validation Error')

    await app.close()
  })
})

// ----------------------------------------------------------
// REQUEST VALIDATE EXAMPLE
// ----------------------------------------------------------

describe('readme examples — request.validate in handler', () => {
  it('validates body and returns structured result', async () => {
    const app = await createApp()
    const schema = z.object({ email: Email() as z.ZodType })

    app.post('/check', async (request) => {
      const result = await request.validate(schema)
      return result.success
        ? { ok: true, email: result.data?.email }
        : { ok: false, errors: result.firstErrors }
    })

    const ok = await app.inject({ method: 'POST', url: '/check', payload: { email: 'test@example.com' } })
    expect(parseJson(ok)['ok']).toBe(true)

    const bad = await app.inject({ method: 'POST', url: '/check', payload: { email: '' } })
    expect(parseJson(bad)['ok']).toBe(false)

    await app.close()
  })
})
