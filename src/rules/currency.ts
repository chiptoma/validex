// ==============================================================================
// CURRENCY RULE
// Validates ISO 4217 currency codes with async data loading.
// ------------------------------------------------------------------------------
// Supports allow/block list filtering for restricting accepted currencies.
// ==============================================================================

import type { BaseRuleOptions } from '../types'
import { z } from 'zod'
import { createRule } from '../core/createRule'
import { getCurrencyCodes, loadCurrencyCodes } from '../data/currencyCodes'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * CurrencyOptions
 * Configuration options for the currency code validation rule.
 */
export interface CurrencyOptions extends BaseRuleOptions {
  /** Restrict to only these currency codes. */
  readonly allowCurrencies?: readonly string[] | undefined
  /** Block these currency codes. */
  readonly blockCurrencies?: readonly string[] | undefined
}

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Resolve Currency Codes
 * Returns the currency codes set, loading async if not yet cached.
 *
 * @returns The ReadonlySet of ISO 4217 currency codes.
 */
async function resolveCurrencyCodes(): Promise<ReadonlySet<string>> {
  try {
    return getCurrencyCodes()
  }
  catch {
    return loadCurrencyCodes()
  }
}

// ----------------------------------------------------------
// RULE FACTORY
// ----------------------------------------------------------

/**
 * Currency
 * Validates that a string is a valid ISO 4217 currency code.
 * Supports allow/block filtering for restricting accepted currencies.
 *
 * @param options - Per-call currency validation options.
 * @returns A Zod schema that validates currency code strings.
 */
export const Currency = /* @__PURE__ */ createRule<CurrencyOptions>({
  name: 'currency',
  defaults: {
    allowCurrencies: [],
    blockCurrencies: [],
    emptyToUndefined: true,
    normalize: true,
  },
  messages: {
    invalid: '{{label}} is not a valid currency code',
    blocked: 'This currency is not allowed',
    notAllowed: 'This currency is not in the allowed list',
  },
  build: (opts: CurrencyOptions): z.ZodType => {
    const allow = opts.allowCurrencies ?? []
    const block = opts.blockCurrencies ?? []

    let schema: z.ZodType = opts.normalize !== false
      ? z.string().transform((v: string): string => v.trim().toUpperCase())
      : z.string()

    schema = schema.pipe(
      z.string().refine(
        async (v: string): Promise<boolean> => {
          const codes = await resolveCurrencyCodes()
          return codes.has(v)
        },
        { params: { code: 'invalid', namespace: 'currency' } },
      ),
    )

    if (allow.length > 0) {
      schema = schema.pipe(
        z.string().refine(
          (v: string): boolean => allow.includes(v),
          { params: { code: 'notAllowed', namespace: 'currency' } },
        ),
      )
    }

    if (block.length > 0) {
      schema = schema.pipe(
        z.string().refine(
          (v: string): boolean => !block.includes(v),
          { params: { code: 'blocked', namespace: 'currency' } },
        ),
      )
    }

    return schema
  },
})
