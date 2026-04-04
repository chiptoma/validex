// ==============================================================================
// FASTIFY END-TO-END TESTS
// Validates the validex plugin in realistic multi-route workflows.
// ==============================================================================

import type { ErrorResponse } from '../_support/helpers/testApp'

import { resetConfig } from '@validex/core'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { createApp, parseJson } from '../_support/helpers/testApp'

// ----------------------------------------------------------
// FASTIFY END-TO-END
// ----------------------------------------------------------

describe('fastify end-to-end', () => {
  afterEach(() => resetConfig())

  it('returns 200 for valid POST data', async () => {
    const app = await createApp()
    app.post('/users', {
      config: { validex: { body: z.object({ email: z.string().email(), name: z.string().min(1) }) } },
      handler: async () => ({ created: true }),
    })

    const response = await app.inject({ method: 'POST', url: '/users', payload: { email: 'alice@example.com', name: 'Alice' } })
    expect(response.statusCode).toBe(200)
    expect(parseJson(response)).toEqual({ created: true })

    await app.close()
  })

  it('returns 400 with structured error response for invalid data', async () => {
    const app = await createApp()
    app.post('/users', {
      config: { validex: { body: z.object({ email: z.string().email(), name: z.string().min(2) }) } },
      handler: async () => ({ created: true }),
    })

    const response = await app.inject({ method: 'POST', url: '/users', payload: { email: 'not-an-email', name: '' } })
    expect(response.statusCode).toBe(400)

    const body = parseJson<ErrorResponse>(response)
    expect(body.statusCode).toBe(400)
    expect(body.error).toBe('Validation Error')
    expect(typeof body.errors['email']).toBe('string')
    expect(typeof body.errors['name']).toBe('string')

    await app.close()
  })

  it('handles multiple routes with different schemas independently', async () => {
    const app = await createApp()

    app.post('/users', {
      config: { validex: { body: z.object({ name: z.string().min(1) }) } },
      handler: async () => ({ type: 'user' }),
    })
    app.post('/products', {
      config: { validex: { body: z.object({ title: z.string().min(3), price: z.number().positive() }) } },
      handler: async () => ({ type: 'product' }),
    })

    expect((await app.inject({ method: 'POST', url: '/users', payload: { name: 'Alice' } })).statusCode).toBe(200)
    expect((await app.inject({ method: 'POST', url: '/users', payload: { name: '' } })).statusCode).toBe(400)
    expect((await app.inject({ method: 'POST', url: '/products', payload: { title: 'Widget', price: 9.99 } })).statusCode).toBe(200)

    const bad = await app.inject({ method: 'POST', url: '/products', payload: { title: 'ab', price: -1 } })
    expect(bad.statusCode).toBe(400)
    const errors = parseJson<ErrorResponse>(bad)
    expect(errors.errors['title']).toBeDefined()
    expect(errors.errors['price']).toBeDefined()

    await app.close()
  })

  it('validates request body via request.validate in handler', async () => {
    const app = await createApp()
    const schema = z.object({ age: z.number().int().min(0) })

    app.post('/check-age', async (request) => {
      const result = await request.validate(schema)
      if (!result.success) {
        return { valid: false, errors: result.firstErrors }
      }
      return { valid: true, age: result.data?.age }
    })

    const ok = await app.inject({ method: 'POST', url: '/check-age', payload: { age: 25 } })
    expect(parseJson(ok)).toEqual({ valid: true, age: 25 })

    const bad = await app.inject({ method: 'POST', url: '/check-age', payload: { age: -5 } })
    expect(parseJson(bad)['valid']).toBe(false)

    await app.close()
  })
})
