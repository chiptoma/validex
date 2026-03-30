// ==============================================================================
// FASTIFY DECORATORS — UNIT TESTS
// Tests the validateData and validateRequest API surface directly.
// ==============================================================================

import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { validateData, validateRequest } from '../../src/adapters/fastify/decorators'

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
})

describe('validateData', () => {
  it('returns success for valid data', async () => {
    const result = await validateData(schema, { name: 'Alice', email: 'alice@example.com' })
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ name: 'Alice', email: 'alice@example.com' })
  })

  it('returns errors for invalid data', async () => {
    const result = await validateData(schema, { name: '', email: 'bad' })
    expect(result.success).toBe(false)
    expect(Object.keys(result.errors).length).toBeGreaterThan(0)
  })

  it('returns firstErrors with one message per field', async () => {
    const result = await validateData(schema, { name: '', email: 'bad' })
    expect(typeof result.firstErrors['name']).toBe('string')
    expect(typeof result.firstErrors['email']).toBe('string')
  })

  it('returns empty errors for valid data', async () => {
    const result = await validateData(schema, { name: 'Bob', email: 'bob@test.com' })
    expect(result.errors).toEqual({})
    expect(result.firstErrors).toEqual({})
  })

  it('returns nestedErrors for nested schemas', async () => {
    const nested = z.object({ user: z.object({ name: z.string().min(1) }) })
    const result = await validateData(nested, { user: { name: '' } })
    expect(result.success).toBe(false)
    expect(result.nestedErrors['user']).toBeDefined()
  })

  it('includes raw issues', async () => {
    const result = await validateData(schema, { name: '', email: '' })
    expect(result.issues.length).toBeGreaterThan(0)
  })
})

describe('validateRequest', () => {
  it('validates body source by default', async () => {
    const result = await validateRequest(
      z.object({ name: z.string() }),
      { body: { name: 'Alice' }, query: {}, params: {} },
    )
    expect(result.success).toBe(true)
  })

  it('validates query source', async () => {
    const result = await validateRequest(
      z.object({ page: z.string() }),
      { body: {}, query: { page: '1' }, params: {} },
      'query',
    )
    expect(result.success).toBe(true)
  })

  it('validates params source', async () => {
    const result = await validateRequest(
      z.object({ id: z.string() }),
      { body: {}, query: {}, params: { id: '123' } },
      'params',
    )
    expect(result.success).toBe(true)
  })

  it('returns errors when body validation fails', async () => {
    const result = await validateRequest(
      z.object({ name: z.string().min(5) }),
      { body: { name: 'ab' }, query: {}, params: {} },
    )
    expect(result.success).toBe(false)
    expect(result.errors['name']).toBeDefined()
  })
})
