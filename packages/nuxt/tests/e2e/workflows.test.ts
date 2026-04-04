// ==============================================================================
// NUXT E2E VIA @nuxt/test-utils
// Boots the fixture app and validates server API routes that use validex
// for request body validation.
// ==============================================================================

import { fileURLToPath } from 'node:url'

import { $fetch, createTest } from '@nuxt/test-utils/e2e'
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'

/** Shape returned by the /api/validate endpoint. */
interface ValidateResponse {
  readonly success: boolean
  readonly data?: Record<string, unknown>
  readonly errors: Record<string, readonly string[]>
  readonly firstErrors: Record<string, string>
}

describe('nuxt e2e via @nuxt/test-utils', () => {
  const rootDir = fileURLToPath(
    new URL('../_support/fixtures/nuxt-app', import.meta.url),
  )

  const hooks = createTest({
    rootDir,
    server: true,
    build: true,
  })

  beforeAll(hooks.beforeAll, 120_000)
  beforeEach(hooks.beforeEach)
  afterEach(hooks.afterEach)
  afterAll(hooks.afterAll, 30_000)

  it('validates valid data through Nuxt server route', async () => {
    const result = await $fetch<ValidateResponse>('/api/validate', {
      method: 'POST',
      body: { name: 'Alice Smith', email: 'alice@example.com' },
    })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ name: 'Alice Smith', email: 'alice@example.com' })
    expect(result.errors).toEqual({})
  })

  it('returns validation errors for invalid data', async () => {
    const result = await $fetch<ValidateResponse>('/api/validate', {
      method: 'POST',
      body: { name: '', email: 'not-an-email' },
    })

    expect(result.success).toBe(false)
    expect(Object.keys(result.errors).length).toBeGreaterThan(0)
  })

  it('returns errors for empty body', async () => {
    const result = await $fetch<ValidateResponse>('/api/validate', {
      method: 'POST',
      body: { name: '', email: '' },
    })

    expect(result.success).toBe(false)
    expect(result.errors['name']).toBeDefined()
    expect(result.errors['email']).toBeDefined()
  })

  it('populates firstErrors with one message per field', async () => {
    const result = await $fetch<ValidateResponse>('/api/validate', {
      method: 'POST',
      body: { name: '', email: '' },
    })

    expect(result.success).toBe(false)
    expect(typeof result.firstErrors['name']).toBe('string')
    expect(typeof result.firstErrors['email']).toBe('string')
  })
})
