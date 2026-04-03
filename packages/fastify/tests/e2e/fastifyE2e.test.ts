// ==============================================================================
// FASTIFY END-TO-END INTEGRATION TESTS
// Validates Fastify validexPlugin in realistic multi-step workflows.
// ==============================================================================

import { resetConfig } from '@validex/core'
import Fastify from 'fastify'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { validexPlugin } from '../../src'

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

function parseJson(response: { json: () => unknown }): Record<string, unknown> {
  return response.json() as Record<string, unknown>
}

interface ErrorResponse {
  statusCode: number
  error: string
  errors: Record<string, string>
  allErrors: Record<string, string[]>
}

// ----------------------------------------------------------
// FASTIFY END-TO-END
// ----------------------------------------------------------

describe('fastify end-to-end', () => {
  afterEach(() => {
    resetConfig()
  })

  it('returns 200 for valid POST data', async () => {
    const app = Fastify()
    await app.register(validexPlugin)

    const bodySchema = z.object({
      email: z.string().email(),
      name: z.string().min(1),
    })

    app.post('/users', {
      config: { validex: { body: bodySchema } },
      handler: async () => ({ created: true }),
    })

    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { email: 'alice@example.com', name: 'Alice' },
    })

    expect(response.statusCode).toBe(200)
    expect(parseJson(response)).toEqual({ created: true })

    await app.close()
  })

  it('returns 400 with structured error response for invalid data', async () => {
    const app = Fastify()
    await app.register(validexPlugin)

    const bodySchema = z.object({
      email: z.string().email(),
      name: z.string().min(2),
    })

    app.post('/users', {
      config: { validex: { body: bodySchema } },
      handler: async () => ({ created: true }),
    })

    const response = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { email: 'not-an-email', name: '' },
    })

    expect(response.statusCode).toBe(400)

    const body = parseJson(response) as unknown as ErrorResponse
    expect(body.statusCode).toBe(400)
    expect(body.error).toBe('Validation Error')
    expect(body.errors).toBeDefined()
    expect(body.allErrors).toBeDefined()
    expect(typeof body.errors['email']).toBe('string')
    expect(typeof body.errors['name']).toBe('string')

    await app.close()
  })

  it('handles multiple routes with different schemas independently', async () => {
    const app = Fastify()
    await app.register(validexPlugin)

    const userSchema = z.object({
      name: z.string().min(1),
    })

    const productSchema = z.object({
      title: z.string().min(3),
      price: z.number().positive(),
    })

    app.post('/users', {
      config: { validex: { body: userSchema } },
      handler: async () => ({ type: 'user', ok: true }),
    })

    app.post('/products', {
      config: { validex: { body: productSchema } },
      handler: async () => ({ type: 'product', ok: true }),
    })

    const userValid = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { name: 'Alice' },
    })
    expect(userValid.statusCode).toBe(200)
    expect(parseJson(userValid)).toEqual({ type: 'user', ok: true })

    const userInvalid = await app.inject({
      method: 'POST',
      url: '/users',
      payload: { name: '' },
    })
    expect(userInvalid.statusCode).toBe(400)

    const productValid = await app.inject({
      method: 'POST',
      url: '/products',
      payload: { title: 'Widget', price: 9.99 },
    })
    expect(productValid.statusCode).toBe(200)
    expect(parseJson(productValid)).toEqual({ type: 'product', ok: true })

    const productInvalid = await app.inject({
      method: 'POST',
      url: '/products',
      payload: { title: 'ab', price: -1 },
    })
    expect(productInvalid.statusCode).toBe(400)

    const productBody = parseJson(productInvalid) as unknown as ErrorResponse
    expect(productBody.errors['title']).toBeDefined()
    expect(productBody.errors['price']).toBeDefined()

    await app.close()
  })

  it('validates request body via request.validate in handler', async () => {
    const app = Fastify()
    await app.register(validexPlugin)

    const schema = z.object({ age: z.number().int().min(0) })

    app.post('/check-age', async (request) => {
      const result = await request.validate(schema)
      if (!result.success) {
        return { valid: false, errors: result.firstErrors }
      }
      return { valid: true, age: result.data?.age }
    })

    const ok = await app.inject({
      method: 'POST',
      url: '/check-age',
      payload: { age: 25 },
    })
    expect(ok.statusCode).toBe(200)
    expect(parseJson(ok)).toEqual({ valid: true, age: 25 })

    const bad = await app.inject({
      method: 'POST',
      url: '/check-age',
      payload: { age: -5 },
    })
    expect(bad.statusCode).toBe(200)
    const badBody = parseJson(bad)
    expect(badBody['valid']).toBe(false)
    expect(badBody['errors']).toBeDefined()

    await app.close()
  })
})
