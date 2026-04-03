// ==============================================================================
// USERNAME ASYNC RULE TESTS
// Validates the blockReserved async wiring for reserved username rejection.
// ==============================================================================

import type { z } from 'zod'

import { beforeEach, describe, expect, it } from 'vitest'

import { resetReservedUsernamesCache } from '@loaders/reservedUsernames'
import { Username } from '@rules/username'

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

async function parseAsync(
  schema: unknown,
  value: unknown,
): Promise<{ success: boolean }> {
  return (schema as z.ZodType).safeParseAsync(value)
}

// ----------------------------------------------------------
// BLOCK RESERVED
// ----------------------------------------------------------

describe('username — blockReserved async', () => {
  beforeEach(() => {
    resetReservedUsernamesCache()
  })

  it('rejects "admin" when blockReserved is true', async () => {
    const schema = Username({ blockReserved: true })
    const result = await parseAsync(schema, 'admin')
    expect(result.success).toBe(false)
  })

  it('rejects "root" when blockReserved is true', async () => {
    const schema = Username({ blockReserved: true })
    const result = await parseAsync(schema, 'root')
    expect(result.success).toBe(false)
  })

  it('rejects "system" when blockReserved is true', async () => {
    const schema = Username({ blockReserved: true })
    const result = await parseAsync(schema, 'system')
    expect(result.success).toBe(false)
  })

  it('allows a non-reserved username', async () => {
    const schema = Username({ blockReserved: true })
    const result = await parseAsync(schema, 'johndoe')
    expect(result.success).toBe(true)
  })

  it('rejects custom reserved words via reservedWords option', async () => {
    const schema = Username({
      blockReserved: true,
      reservedWords: ['banned'],
    })
    const result = await parseAsync(schema, 'banned')
    expect(result.success).toBe(false)
  })

  it('rejects case-insensitively by default (ignoreCase: true)', async () => {
    const schema = Username({ blockReserved: true })
    // Default normalize lowercases input, so 'Admin' becomes 'admin'
    const result = await parseAsync(schema, 'Admin')
    expect(result.success).toBe(false)
  })

  it('allows "Admin" when ignoreCase is false and normalize is false', async () => {
    const schema = Username({
      blockReserved: true,
      ignoreCase: false,
      normalize: false,
      regex: /^[a-z0-9]+$/i,
      boundary: 'any',
    })
    // With ignoreCase false, 'Admin' is compared as-is against 'admin'
    // The reserved set contains 'admin' (lowercase), so 'Admin' !== 'admin'
    const result = await parseAsync(schema, 'Admin')
    expect(result.success).toBe(true)
  })

  it('does not block reserved words when blockReserved is false', async () => {
    const schema = Username({ blockReserved: false })
    const result = await parseAsync(schema, 'admin')
    expect(result.success).toBe(true)
  })

  it('works on second call using cached data', async () => {
    const schema = Username({ blockReserved: true })
    await parseAsync(schema, 'support')
    const result = await parseAsync(schema, 'webmaster')
    expect(result.success).toBe(false)
  })
})
