// ==============================================================================
// PASSWORD ASYNC RULE TESTS
// Validates the blockCommon async wiring for common password rejection.
// ==============================================================================

import { beforeEach, describe, expect, it } from 'vitest'

import { clearCommonPasswordsCache } from '@loaders/commonPasswords'
import { Password } from '@rules/password'

import { parseAsync } from '../_support/helpers/parse'

// ----------------------------------------------------------
// BLOCK COMMON — BASIC TIER
// ----------------------------------------------------------

describe('password — blockCommon async', () => {
  beforeEach(() => {
    clearCommonPasswordsCache()
  })

  it('rejects a top-100 common password with blockCommon: true', async () => {
    const schema = Password({
      blockCommon: true,
      length: { min: 1 },
      uppercase: undefined,
      lowercase: undefined,
      digits: undefined,
      special: undefined,
      consecutive: undefined,
    })
    const result = await parseAsync(schema, 'password')
    expect(result.success).toBe(false)
  })

  it('rejects a common password with blockCommon: "basic"', async () => {
    const schema = Password({
      blockCommon: 'basic',
      length: { min: 1 },
      uppercase: undefined,
      lowercase: undefined,
      digits: undefined,
      special: undefined,
      consecutive: undefined,
    })
    const result = await parseAsync(schema, 'dragon')
    expect(result.success).toBe(false)
  })

  it('allows a non-common password with blockCommon: true', async () => {
    const schema = Password({
      blockCommon: true,
      length: { min: 1 },
      uppercase: undefined,
      lowercase: undefined,
      digits: undefined,
      special: undefined,
      consecutive: undefined,
    })
    const result = await parseAsync(schema, 'xk82mZpQ')
    expect(result.success).toBe(true)
  })

  it('is case-insensitive when checking common passwords', async () => {
    const schema = Password({
      blockCommon: true,
      length: { min: 1 },
      uppercase: undefined,
      lowercase: undefined,
      digits: undefined,
      special: undefined,
      consecutive: undefined,
    })
    const result = await parseAsync(schema, 'PASSWORD')
    expect(result.success).toBe(false)
  })

  it('does not block common passwords when blockCommon is false', async () => {
    const schema = Password({
      blockCommon: false,
      length: { min: 1 },
      uppercase: undefined,
      lowercase: undefined,
      digits: undefined,
      special: undefined,
      consecutive: undefined,
    })
    const result = await parseAsync(schema, 'password')
    expect(result.success).toBe(true)
  })

  it('does not block common passwords when blockCommon is undefined', async () => {
    const schema = Password({
      length: { min: 1 },
      uppercase: undefined,
      lowercase: undefined,
      digits: undefined,
      special: undefined,
      consecutive: undefined,
    })
    const result = await parseAsync(schema, 'password')
    expect(result.success).toBe(true)
  })

  it('works on second call using cached data', async () => {
    const schema = Password({
      blockCommon: true,
      length: { min: 1 },
      uppercase: undefined,
      lowercase: undefined,
      digits: undefined,
      special: undefined,
      consecutive: undefined,
    })
    await parseAsync(schema, 'qwerty')
    const result = await parseAsync(schema, 'monkey')
    expect(result.success).toBe(false)
  })

  it('rejects a common password with blockCommon: "strict"', async () => {
    const schema = Password({
      blockCommon: 'strict',
      length: { min: 1 },
      uppercase: undefined,
      lowercase: undefined,
      digits: undefined,
      special: undefined,
      consecutive: undefined,
    })
    const result = await parseAsync(schema, 'password')
    expect(result.success).toBe(false)
  })
})
