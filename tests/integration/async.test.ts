// ==============================================================================
// ASYNC INTEGRATION TESTS
// Validates full async flows for password, username, and email rules,
// plus preloadData behavior.
// ==============================================================================

import type { z } from 'zod'
import { beforeEach, describe, expect, it } from 'vitest'
import { preloadData } from '../../src/config'
import { validate } from '../../src/core/validate'
import { clearCommonPasswordsCache } from '../../src/data/commonPasswords'
import { resetReservedUsernamesCache } from '../../src/data/reservedUsernames'
import { email } from '../../src/rules/email'
import { password } from '../../src/rules/password'
import { Username } from '../../src/rules/username'

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
// FULL ASYNC FLOW
// ----------------------------------------------------------

describe('full async flow', () => {
  beforeEach(() => {
    clearCommonPasswordsCache()
    resetReservedUsernamesCache()
  })

  it('blocks common password "password" via parseAsync', async () => {
    const schema = password({
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

  it('allows a non-common password via parseAsync', async () => {
    const schema = password({
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

  it('blocks reserved username "admin" via parseAsync', async () => {
    const schema = Username({ blockReserved: true })

    const result = await parseAsync(schema, 'admin')
    expect(result.success).toBe(false)
  })

  it('allows a non-reserved username via parseAsync', async () => {
    const schema = Username({ blockReserved: true })

    const result = await parseAsync(schema, 'johndoe')
    expect(result.success).toBe(true)
  })

  it('blocks disposable email domains via parseAsync', async () => {
    const schema = email({ blockDisposable: true })

    const result = await parseAsync(schema, 'test@mailinator.com')
    expect(result.success).toBe(false)
  })

  it('allows a legitimate email domain via parseAsync', async () => {
    const schema = email({ blockDisposable: true })

    const result = await parseAsync(schema, 'user@gmail.com')
    expect(result.success).toBe(true)
  })

  it('validates all three async rules in one schema via validate()', async () => {
    const passwordSchema = password({
      blockCommon: true,
      length: { min: 1 },
      uppercase: undefined,
      lowercase: undefined,
      digits: undefined,
      special: undefined,
      consecutive: undefined,
    })

    const usernameSchema = Username({ blockReserved: true })
    const emailSchema = email({ blockDisposable: true })

    const pwResult = await validate(passwordSchema as z.ZodType, 'password')
    expect(pwResult.success).toBe(false)

    const unResult = await validate(usernameSchema as z.ZodType, 'admin')
    expect(unResult.success).toBe(false)

    const emResult = await validate(emailSchema as z.ZodType, 'test@mailinator.com')
    expect(emResult.success).toBe(false)

    const pwOk = await validate(passwordSchema as z.ZodType, 'xk82mZpQ')
    expect(pwOk.success).toBe(true)

    const unOk = await validate(usernameSchema as z.ZodType, 'johndoe')
    expect(unOk.success).toBe(true)

    const emOk = await validate(emailSchema as z.ZodType, 'user@gmail.com')
    expect(emOk.success).toBe(true)
  })
})

// ----------------------------------------------------------
// PRELOAD DATA
// ----------------------------------------------------------

describe('preloadData', () => {
  it('resolves without error when called with disposable option', async () => {
    await expect(preloadData({ disposable: true })).resolves.toBeUndefined()
  })

  it('resolves without error when called with passwords option', async () => {
    await expect(preloadData({ passwords: true })).resolves.toBeUndefined()
  })

  it('resolves without error when called with reserved option', async () => {
    await expect(preloadData({ reserved: true })).resolves.toBeUndefined()
  })

  it('resolves without error when called with all options', async () => {
    await expect(
      preloadData({ disposable: true, passwords: 'strict', reserved: true }),
    ).resolves.toBeUndefined()
  })

  it('is safe to call multiple times', async () => {
    await preloadData({ disposable: true })
    await expect(preloadData({ disposable: true })).resolves.toBeUndefined()
  })
})
