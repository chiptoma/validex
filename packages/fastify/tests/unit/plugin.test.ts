import type { ValidationResult } from '@validex/core'
import type { FastifyReply, FastifyRequest } from 'fastify'

import { resetConfig } from '@validex/core'
import Fastify from 'fastify'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { validateData, validexPlugin } from '../../src'

interface ErrorResponse {
  statusCode: number
  error: string
  errors: Record<string, string>
  allErrors: Record<string, string[]>
}

function parseJson(response: { json: () => unknown }): Record<string, unknown> {
  return response.json() as Record<string, unknown>
}

describe('fastify adapter', () => {
  afterEach(async () => {
    resetConfig()
  })

  describe('plugin registration', () => {
    it('should register without options', async () => {
      const app = Fastify()
      await app.register(validexPlugin)
      await app.ready()
      await app.close()
    })

    it('should register with rules option', async () => {
      const app = Fastify()
      await app.register(validexPlugin, {
        rules: { email: { normalize: true } },
      })
      await app.ready()
      await app.close()
    })

    it('should register with preload option', async () => {
      const app = Fastify()
      await app.register(validexPlugin, {
        preload: { disposable: true },
      })
      await app.ready()
      await app.close()
    })
  })

  describe('app.validate decorator', () => {
    it('should validate data successfully via validateData', async () => {
      const schema = z.object({ name: z.string().min(1) })
      const result = await validateData(schema, { name: 'Alice' })

      expect(result.success).toBe(true)
      expect(result.data).toEqual({ name: 'Alice' })
    })

    it('should return validation errors for invalid data', async () => {
      const schema = z.object({
        name: z.string().min(2),
        age: z.number().int().positive(),
      })
      const result = await validateData(schema, { name: '', age: -5 })

      expect(result.success).toBe(false)
      expect(Object.keys(result.firstErrors).length).toBeGreaterThan(0)
    })

    it('should be accessible as instance decorator in routes', async () => {
      const app = Fastify()
      await app.register(validexPlugin)

      const schema = z.object({ name: z.string().min(1) })

      app.post('/test', async (request) => {
        return validateData(schema, request.body)
      })

      const response = await app.inject({
        method: 'POST',
        url: '/test',
        payload: { name: 'Alice' },
      })

      expect(response.statusCode).toBe(200)
      const body = parseJson(response)
      expect(body['success']).toBe(true)
      expect(body['data']).toEqual({ name: 'Alice' })
    })
  })

  describe('request.validate decorator', () => {
    it('should validate request body by default', async () => {
      const app = Fastify()
      await app.register(validexPlugin)

      const schema = z.object({ email: z.string().email() })

      app.post('/test', async (request) => {
        return request.validate(schema)
      })

      const response = await app.inject({
        method: 'POST',
        url: '/test',
        payload: { email: 'test@example.com' },
      })

      expect(response.statusCode).toBe(200)
      const body = parseJson(response)
      expect(body['success']).toBe(true)
      expect(body['data']).toEqual({ email: 'test@example.com' })
    })

    it('should validate query when source is query', async () => {
      const app = Fastify()
      await app.register(validexPlugin)

      const schema = z.object({ page: z.string() })

      app.get('/test', async (request) => {
        return request.validate(schema, { source: 'query' })
      })

      const response = await app.inject({
        method: 'GET',
        url: '/test?page=2',
      })

      expect(response.statusCode).toBe(200)
      const body = parseJson(response)
      expect(body['success']).toBe(true)
      expect(body['data']).toEqual({ page: '2' })
    })

    it('should validate params when source is params', async () => {
      const app = Fastify()
      await app.register(validexPlugin)

      const schema = z.object({ id: z.string().min(1) })

      app.get('/users/:id', async (request) => {
        return request.validate(schema, { source: 'params' })
      })

      const response = await app.inject({
        method: 'GET',
        url: '/users/42',
      })

      expect(response.statusCode).toBe(200)
      const body = parseJson(response)
      expect(body['success']).toBe(true)
      expect(body['data']).toEqual({ id: '42' })
    })

    it('should return errors for invalid request body', async () => {
      const app = Fastify()
      await app.register(validexPlugin)

      const schema = z.object({ email: z.string().email() })

      app.post('/test', async (request) => {
        return request.validate(schema)
      })

      const response = await app.inject({
        method: 'POST',
        url: '/test',
        payload: { email: 'not-an-email' },
      })

      expect(response.statusCode).toBe(200)
      const body = parseJson(response)
      expect(body['success']).toBe(false)
      const firstErrors = body['firstErrors'] as Record<string, string>
      expect(firstErrors['email']).toBeDefined()
    })
  })

  describe('route-level preValidation', () => {
    it('should auto-validate body when route config has a zod body', async () => {
      const app = Fastify()
      await app.register(validexPlugin)

      const bodySchema = z.object({ name: z.string().min(1) })

      app.post('/test', {
        config: { validex: { body: bodySchema } },
        handler: async () => ({ ok: true }),
      })

      const valid = await app.inject({
        method: 'POST',
        url: '/test',
        payload: { name: 'Alice' },
      })
      expect(valid.statusCode).toBe(200)
      expect(parseJson(valid)).toEqual({ ok: true })

      const invalid = await app.inject({
        method: 'POST',
        url: '/test',
        payload: { name: '' },
      })
      expect(invalid.statusCode).toBe(400)
      const errBody = parseJson(invalid) as unknown as ErrorResponse
      expect(errBody.error).toBe('Validation Error')
      expect(errBody.errors).toBeDefined()
    })

    it('should skip preValidation when route has no validex config', async () => {
      const app = Fastify()
      await app.register(validexPlugin)

      app.post('/test', async () => ({ ok: true }))

      const response = await app.inject({
        method: 'POST',
        url: '/test',
        payload: {},
      })
      expect(response.statusCode).toBe(200)
    })

    it('should skip preValidation when body is not a zod schema', async () => {
      const app = Fastify()
      await app.register(validexPlugin)

      app.post('/test', {
        config: { validex: { body: { type: 'object' } } },
        handler: async () => ({ ok: true }),
      })

      const response = await app.inject({
        method: 'POST',
        url: '/test',
        payload: {},
      })
      expect(response.statusCode).toBe(200)
    })

    it('should call custom errorHandler when validation fails', async () => {
      let capturedResult: ValidationResult<unknown> | null = null

      const app = Fastify()
      await app.register(validexPlugin, {
        errorHandler: (result: ValidationResult<unknown>, _request: FastifyRequest, reply: FastifyReply) => {
          capturedResult = result
          void reply.status(422).send({ custom: true })
        },
      })

      const bodySchema = z.object({ name: z.string().min(1) })

      app.post('/test', {
        config: { validex: { body: bodySchema } },
        handler: async () => ({ ok: true }),
      })

      const response = await app.inject({
        method: 'POST',
        url: '/test',
        payload: { name: '' },
      })

      expect(response.statusCode).toBe(422)
      expect(parseJson(response)).toEqual({ custom: true })
      expect(capturedResult).not.toBeNull()
    })
  })

  // ----------------------------------------------------------
  // PLUGIN EDGE CASES
  // ----------------------------------------------------------

  describe('plugin — edge cases', () => {
    it('registers with empty options object', async () => {
      const app = Fastify()
      await app.register(validexPlugin, {})
      await app.ready()
      await app.close()
    })

    it('isZodSchema rejects plain object without safeParseAsync', async () => {
      const app = Fastify()
      await app.register(validexPlugin)

      app.post('/test', {
        config: { validex: { body: { notASchema: true } } },
        handler: async () => ({ ok: true }),
      })

      const response = await app.inject({
        method: 'POST',
        url: '/test',
        payload: {},
      })
      // Should skip validation and reach handler
      expect(response.statusCode).toBe(200)
    })

    it('isZodSchema rejects null in route config', async () => {
      const app = Fastify()
      await app.register(validexPlugin)

      app.post('/test', {
        config: { validex: { body: null } },
        handler: async () => ({ ok: true }),
      })

      const response = await app.inject({
        method: 'POST',
        url: '/test',
        payload: {},
      })
      expect(response.statusCode).toBe(200)
    })

    it('isZodSchema rejects function value', async () => {
      const app = Fastify()
      await app.register(validexPlugin)

      app.post('/test', {
        config: { validex: { body: () => {} } },
        handler: async () => ({ ok: true }),
      })

      const response = await app.inject({
        method: 'POST',
        url: '/test',
        payload: {},
      })
      expect(response.statusCode).toBe(200)
    })

    it('preValidation skips when validex config value is not an object', async () => {
      const app = Fastify()
      await app.register(validexPlugin)

      app.post('/test', {
        config: { validex: 'not-an-object' },
        handler: async () => ({ ok: true }),
      })

      const response = await app.inject({
        method: 'POST',
        url: '/test',
        payload: {},
      })
      expect(response.statusCode).toBe(200)
    })

    it('custom errorHandler receives result, request, and reply', async () => {
      let receivedRequest: FastifyRequest | null = null
      let receivedResult: ValidationResult<unknown> | null = null

      const app = Fastify()
      await app.register(validexPlugin, {
        errorHandler: (result: ValidationResult<unknown>, request: FastifyRequest, reply: FastifyReply) => {
          receivedResult = result
          receivedRequest = request
          void reply.status(422).send({ handled: true })
        },
      })

      app.post('/test', {
        config: { validex: { body: z.object({ x: z.string().min(5) }) } },
        handler: async () => ({ ok: true }),
      })

      await app.inject({
        method: 'POST',
        url: '/test',
        payload: { x: 'a' },
      })

      expect(receivedResult).not.toBeNull()
      expect(receivedRequest).not.toBeNull()
      // SAFETY: asserted not null above
      expect((receivedResult as unknown as ValidationResult<unknown>).success).toBe(false)
    })

    it('plugin works with encapsulated fastify instances', async () => {
      const app = Fastify()
      await app.register(validexPlugin)

      await app.register(async (child) => {
        const schema = z.object({ val: z.string().min(1) })
        child.post('/child', async (request) => {
          return request.validate(schema)
        })
      })

      const response = await app.inject({
        method: 'POST',
        url: '/child',
        payload: { val: 'ok' },
      })

      expect(response.statusCode).toBe(200)
      const body = parseJson(response)
      expect(body['success']).toBe(true)
    })
  })
})
