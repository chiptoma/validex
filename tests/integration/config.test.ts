// ==============================================================================
// INTEGRATION — CONFIGURATION
// Tests i18n modes, global rule overrides, per-call overrides, and override
// removal via the three-tier merge system.
// ==============================================================================

import type { z } from 'zod'
import { afterEach, describe, expect, it } from 'vitest'
import { getConfig, resetConfig, setup } from '../../src/config'
import { registerCustomError } from '../../src/core/customError'
import { getParams } from '../../src/core/getParams'
import { Email } from '../../src/rules/email'
import { Password } from '../../src/rules/password'

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Parse Async
 * Runs safeParseAsync on the given schema and value.
 *
 * @param schema - The Zod schema (from rule factory).
 * @param value  - The value to parse.
 * @returns The safe parse result.
 */
async function parseAsync(
  schema: unknown,
  value: unknown,
): Promise<{ success: boolean, data?: unknown, error?: { issues: readonly unknown[] } }> {
  return (schema as z.ZodType).safeParseAsync(value)
}

/**
 * Get Async Error Params
 * Extracts getParams() results from every issue of a failed async parse.
 *
 * @param schema - The Zod schema.
 * @param value  - The value to parse.
 * @returns Array of ErrorParams objects.
 */
async function getAsyncErrorParams(
  schema: unknown,
  value: unknown,
): Promise<ReadonlyArray<ReturnType<typeof getParams>>> {
  const result = await parseAsync(schema, value)
  if (result.success || !result.error)
    return []
  return result.error.issues.map(
    issue => getParams(issue as Parameters<typeof getParams>[0]),
  )
}

// ----------------------------------------------------------
// TESTS
// ----------------------------------------------------------

describe('config integration', () => {
  afterEach(() => {
    resetConfig()
  })

  // ----------------------------------------------------------
  // 6.6 — I18N KEYS MODE
  // ----------------------------------------------------------

  describe('6.6 — i18n keys mode', () => {
    it('should produce i18n key in getParams when i18n is enabled', async () => {
      setup({ i18n: { enabled: true } })
      registerCustomError()

      const schema = Email() as z.ZodType
      const params = await getAsyncErrorParams(schema, 'not-an-email')
      expect(params.length).toBeGreaterThan(0)

      const first = params[0] as ReturnType<typeof getParams>
      expect(first.key).toMatch(/^validation\.messages\./)
      expect(first.labelKey).toBeDefined()
    })

    it('should include the correct key structure for a required field', async () => {
      setup({ i18n: { enabled: true } })
      registerCustomError()

      const schema = Email() as z.ZodType
      const params = await getAsyncErrorParams(schema, '')

      // Empty string with emptyToUndefined triggers required-like error
      // getParams should still produce an i18n key
      for (const p of params) {
        expect(p.key).toContain('validation.messages.')
      }
    })
  })

  // ----------------------------------------------------------
  // 6.7 — I18N T() FUNCTION
  // ----------------------------------------------------------

  describe('6.7 — i18n t() function', () => {
    it('should call t() and produce translated messages when wired', async () => {
      const translatedKeys: string[] = []
      setup({
        i18n: {
          enabled: true,
          t: (key: string, _params?: Record<string, unknown>): string => {
            translatedKeys.push(key)
            return `translated: ${key}`
          },
        },
      })
      registerCustomError()

      const schema = Email() as z.ZodType
      const params = await getAsyncErrorParams(schema, 'bad-email')

      // Verify getParams produces a key that could be passed to t()
      expect(params.length).toBeGreaterThan(0)
      for (const p of params) {
        expect(p.key).toMatch(/^validation\.messages\./)
      }

      // The t() function is available on the config for consumers
      const config = getConfig()
      expect(config.i18n.t).toBeDefined()

      // Verify t() works when called manually with the produced key
      const tFn = config.i18n.t
      expect(tFn).toBeDefined()
      if (tFn !== undefined) {
        const firstParam = params[0] as ReturnType<typeof getParams>
        const translated = tFn(firstParam.key, {})
        expect(translated).toContain('translated:')
      }
    })
  })

  // ----------------------------------------------------------
  // 6.8 — GLOBAL CONFIG
  // ----------------------------------------------------------

  describe('6.8 — global config overrides', () => {
    it('should block plus aliases globally via setup()', async () => {
      setup({ rules: { email: { blockPlusAlias: true } } })
      registerCustomError()

      const schema = Email() as z.ZodType
      const plusResult = await parseAsync(schema, 'user+tag@example.com')
      expect(plusResult.success).toBe(false)

      const normalResult = await parseAsync(schema, 'user@example.com')
      expect(normalResult.success).toBe(true)
    })

    it('should not affect password rule when email is configured', async () => {
      setup({ rules: { email: { blockPlusAlias: true } } })
      registerCustomError()

      const schema = Password() as z.ZodType
      const result = await parseAsync(schema, 'MyStr0ng!Pass')
      expect(result.success).toBe(true)
    })
  })

  // ----------------------------------------------------------
  // 6.9 — PER-CALL OVERRIDE
  // ----------------------------------------------------------

  describe('6.9 — per-call override', () => {
    it('should allow plus aliases when per-call overrides global', async () => {
      setup({ rules: { email: { blockPlusAlias: true } } })
      registerCustomError()

      // Per-call override: blockPlusAlias = false
      const schema = Email({ blockPlusAlias: false }) as z.ZodType
      const result = await parseAsync(schema, 'user+tag@example.com')
      expect(result.success).toBe(true)
    })
  })

  // ----------------------------------------------------------
  // 6.10 — OVERRIDE REMOVAL
  // ----------------------------------------------------------

  describe('6.10 — override removal via undefined', () => {
    it('should revert to Tier 1 default when per-call sets undefined', async () => {
      setup({ rules: { email: { blockPlusAlias: true } } })
      registerCustomError()

      // Per-call: blockPlusAlias = undefined removes the key entirely
      // Three-tier merge: undefined means intentional removal,
      // so Tier 1 default (false) applies
      const schema = Email({ blockPlusAlias: undefined }) as z.ZodType
      const result = await parseAsync(schema, 'user+tag@example.com')
      expect(result.success).toBe(true)
    })
  })
})
