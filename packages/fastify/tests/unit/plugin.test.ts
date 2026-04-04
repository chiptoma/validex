// ==============================================================================
// FASTIFY PLUGIN — UNIT TESTS
// Tests plugin registration, decorators, route-level preValidation, and edge cases.
// ==============================================================================

import type { ValidationResult } from '@validex/core'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { resetConfig } from '@validex/core'
import Fastify from 'fastify'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { validateData, validexPlugin } from '../../src'
import { createApp, parseJson } from '../_support/helpers/testApp'

// ----------------------------------------------------------
// PLUGIN REGISTRATION
// ----------------------------------------------------------

describe('plugin registration', () => {
  afterEach(() => resetConfig())

  it('registers without options', async () => {
    const app = Fastify()
    await app.register(validexPlugin)
    await app.ready()
    await app.close()
  })

  it('registers with rules option', async () => {
    const app = Fastify()
    await app.register(validexPlugin, { rules: { email: { normalize: true } } })
    await app.ready()
    await app.close()
  })

  it('registers with preload option', async () => {
    const app = Fastify()
    await app.register(validexPlugin, { preload: { disposable: true } })
    await app.ready()
    await app.close()
  })

  it('registers with empty options object', async () => {
    const app = Fastify()
    await app.register(validexPlugin, {})
    await app.ready()
    await app.close()
  })
})

// ----------------------------------------------------------
// APP.VALIDATE DECORATOR
// ----------------------------------------------------------

describe('app.validate decorator', () => {
  afterEach(() => resetConfig())

  it('validates data successfully', async () => {
    const result = await validateData(z.object({ name: z.string().min(1) }), { name: 'Alice' })
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ name: 'Alice' })
  })

  it('returns validation errors for invalid data', async () => {
    const result = await validateData(
      z.object({ name: z.string().min(2), age: z.number().int().positive() }),
      { name: '', age: -5 },
    )
    expect(result.success).toBe(false)
    expect(Object.keys(result.firstErrors).length).toBeGreaterThan(0)
  })

  it('is accessible as instance decorator in routes', async () => {
    const app = await createApp()
    const schema = z.object({ name: z.string().min(1) })

    app.post('/test', async request => validateData(schema, request.body))

    const response = await app.inject({ method: 'POST', url: '/test', payload: { name: 'Alice' } })
    expect(response.statusCode).toBe(200)
    expect(parseJson(response)['success']).toBe(true)

    await app.close()
  })
})

// ----------------------------------------------------------
// REQUEST.VALIDATE DECORATOR
// ----------------------------------------------------------

describe('request.validate decorator', () => {
  afterEach(() => resetConfig())

  it('validates request body by default', async () => {
    const app = await createApp()
    app.post('/test', async request => request.validate(z.object({ email: z.string().email() })))

    const response = await app.inject({ method: 'POST', url: '/test', payload: { email: 'test@example.com' } })
    expect(response.statusCode).toBe(200)
    expect(parseJson(response)['success']).toBe(true)

    await app.close()
  })

  it('validates query when source is query', async () => {
    const app = await createApp()
    app.get('/test', async request => request.validate(z.object({ page: z.string() }), { source: 'query' }))

    const response = await app.inject({ method: 'GET', url: '/test?page=2' })
    expect(parseJson(response)['data']).toEqual({ page: '2' })

    await app.close()
  })

  it('validates params when source is params', async () => {
    const app = await createApp()
    app.get('/users/:id', async request => request.validate(z.object({ id: z.string().min(1) }), { source: 'params' }))

    const response = await app.inject({ method: 'GET', url: '/users/42' })
    expect(parseJson(response)['data']).toEqual({ id: '42' })

    await app.close()
  })

  it('returns errors for invalid request body', async () => {
    const app = await createApp()
    app.post('/test', async request => request.validate(z.object({ email: z.string().email() })))

    const response = await app.inject({ method: 'POST', url: '/test', payload: { email: 'not-an-email' } })
    const body = parseJson(response)
    expect(body['success']).toBe(false)

    await app.close()
  })
})

// ----------------------------------------------------------
// ROUTE-LEVEL PREVALIDATION
// ----------------------------------------------------------

describe('route-level preValidation', () => {
  afterEach(() => resetConfig())

  it('auto-validates body when route config has a zod schema', async () => {
    const app = await createApp()
    app.post('/test', {
      config: { validex: { body: z.object({ name: z.string().min(1) }) } },
      handler: async () => ({ ok: true }),
    })

    const valid = await app.inject({ method: 'POST', url: '/test', payload: { name: 'Alice' } })
    expect(valid.statusCode).toBe(200)

    const invalid = await app.inject({ method: 'POST', url: '/test', payload: { name: '' } })
    expect(invalid.statusCode).toBe(400)
    expect(parseJson(invalid)['error']).toBe('Validation Error')

    await app.close()
  })

  it('skips when route has no validex config', async () => {
    const app = await createApp()
    app.post('/test', async () => ({ ok: true }))

    const response = await app.inject({ method: 'POST', url: '/test', payload: {} })
    expect(response.statusCode).toBe(200)

    await app.close()
  })

  it('skips when body is not a zod schema', async () => {
    const app = await createApp()
    app.post('/test', {
      config: { validex: { body: { type: 'object' } } },
      handler: async () => ({ ok: true }),
    })

    const response = await app.inject({ method: 'POST', url: '/test', payload: {} })
    expect(response.statusCode).toBe(200)

    await app.close()
  })

  it('calls custom errorHandler when validation fails', async () => {
    const captured: { result?: ValidationResult<unknown> } = {}

    const app = Fastify()
    await app.register(validexPlugin, {
      errorHandler: (result: ValidationResult<unknown>, _request: FastifyRequest, reply: FastifyReply) => {
        captured.result = result
        void reply.status(422).send({ custom: true })
      },
    })

    app.post('/test', {
      config: { validex: { body: z.object({ name: z.string().min(1) }) } },
      handler: async () => ({ ok: true }),
    })

    const response = await app.inject({ method: 'POST', url: '/test', payload: { name: '' } })
    expect(response.statusCode).toBe(422)
    expect(parseJson(response)).toEqual({ custom: true })
    expect(captured.result).toBeDefined()
    expect(captured.result?.success).toBe(false)

    await app.close()
  })
})

// ----------------------------------------------------------
// EDGE CASES
// ----------------------------------------------------------

describe('plugin — edge cases', () => {
  afterEach(() => resetConfig())

  it('isZodSchema rejects plain object without safeParseAsync', async () => {
    const app = await createApp()
    app.post('/test', {
      config: { validex: { body: { notASchema: true } } },
      handler: async () => ({ ok: true }),
    })

    const response = await app.inject({ method: 'POST', url: '/test', payload: {} })
    expect(response.statusCode).toBe(200)

    await app.close()
  })

  it('isZodSchema rejects null in route config', async () => {
    const app = await createApp()
    app.post('/test', {
      config: { validex: { body: null } },
      handler: async () => ({ ok: true }),
    })

    const response = await app.inject({ method: 'POST', url: '/test', payload: {} })
    expect(response.statusCode).toBe(200)

    await app.close()
  })

  it('isZodSchema rejects function value', async () => {
    const app = await createApp()
    app.post('/test', {
      config: { validex: { body: () => {} } },
      handler: async () => ({ ok: true }),
    })

    const response = await app.inject({ method: 'POST', url: '/test', payload: {} })
    expect(response.statusCode).toBe(200)

    await app.close()
  })

  it('preValidation skips when validex config value is not an object', async () => {
    const app = await createApp()
    app.post('/test', {
      config: { validex: 'not-an-object' },
      handler: async () => ({ ok: true }),
    })

    const response = await app.inject({ method: 'POST', url: '/test', payload: {} })
    expect(response.statusCode).toBe(200)

    await app.close()
  })

  it('custom errorHandler receives result, request, and reply', async () => {
    let receivedRequest: FastifyRequest | null = null

    const app = Fastify()
    await app.register(validexPlugin, {
      errorHandler: (_result: ValidationResult<unknown>, request: FastifyRequest, reply: FastifyReply) => {
        receivedRequest = request
        void reply.status(422).send({ handled: true })
      },
    })

    app.post('/test', {
      config: { validex: { body: z.object({ x: z.string().min(5) }) } },
      handler: async () => ({ ok: true }),
    })

    await app.inject({ method: 'POST', url: '/test', payload: { x: 'a' } })
    expect(receivedRequest).not.toBeNull()

    await app.close()
  })

  it('works with encapsulated fastify instances', async () => {
    const app = await createApp()

    await app.register(async (child) => {
      child.post('/child', async request => request.validate(z.object({ val: z.string().min(1) })))
    })

    const response = await app.inject({ method: 'POST', url: '/child', payload: { val: 'ok' } })
    expect(response.statusCode).toBe(200)
    expect(parseJson(response)['success']).toBe(true)

    await app.close()
  })
})
