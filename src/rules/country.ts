// ==============================================================================
// COUNTRY RULE
// Validates ISO 3166-1 country codes with async data loading.
// ------------------------------------------------------------------------------
// Supports alpha-2 and alpha-3 formats with allow/block list filtering.
// ==============================================================================

import type { BaseRuleOptions } from '../types'
import { z } from 'zod'
import { createRule } from '../core/createRule'
import { getCountryCodes, loadCountryCodes } from '../data/countryCodes'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * CountryOptions
 * Configuration options for the country code validation rule.
 */
export interface CountryOptions extends BaseRuleOptions {
  /** Country code format: 'alpha2' (default) or 'alpha3'. */
  readonly format?: 'alpha2' | 'alpha3' | undefined
  /** Restrict to only these country codes. */
  readonly allowCountries?: readonly string[] | undefined
  /** Block these country codes. */
  readonly blockCountries?: readonly string[] | undefined
}

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Resolve Country Codes
 * Returns the country codes map, loading async if not yet cached.
 *
 * @returns The ReadonlyMap of alpha-2 codes to CountryData entries.
 */
async function resolveCountryCodes(): Promise<
  ReadonlyMap<string, { readonly alpha2: string, readonly alpha3: string, readonly name: string }>
> {
  try {
    return getCountryCodes()
  }
  catch {
    return loadCountryCodes()
  }
}

/**
 * Is Valid Country Code
 * Checks whether a value is a valid country code in the given format.
 *
 * @param value  - The uppercase country code string.
 * @param format - The format to validate against ('alpha2' or 'alpha3').
 * @param codes  - The loaded country codes map.
 * @returns True if the code is valid.
 */
function isValidCountryCode(
  value: string,
  format: 'alpha2' | 'alpha3',
  codes: ReadonlyMap<string, { readonly alpha3: string }>,
): boolean {
  if (format === 'alpha2') {
    return codes.has(value)
  }
  for (const entry of codes.values()) {
    if (entry.alpha3 === value)
      return true
  }
  return false
}

// ----------------------------------------------------------
// RULE FACTORY
// ----------------------------------------------------------

/**
 * Country
 * Validates that a string is a valid ISO 3166-1 country code.
 * Supports alpha-2 and alpha-3 formats with allow/block filtering.
 *
 * @param options - Per-call country validation options.
 * @returns A Zod schema that validates country code strings.
 */
export const Country = /* @__PURE__ */ createRule<CountryOptions>({
  name: 'country',
  defaults: {
    format: 'alpha2',
    allowCountries: [],
    blockCountries: [],
    emptyToUndefined: true,
    normalize: true,
  },
  messages: {
    invalid: '{{label}} is not a valid country code',
    blocked: 'This country is not allowed',
    notAllowed: 'This country is not in the allowed list',
  },
  build: (opts: CountryOptions): z.ZodType => {
    /* c8 ignore start -- defensive fallback; defaults always provide format/allow/block */
    const format = opts.format ?? 'alpha2'
    const allow = opts.allowCountries ?? []
    const block = opts.blockCountries ?? []
    /* c8 ignore stop */

    let schema: z.ZodType = opts.normalize !== false
      ? z.string().transform((v: string): string => v.trim().toUpperCase())
      : z.string()

    schema = schema.pipe(
      z.string().refine(
        async (v: string): Promise<boolean> => {
          const codes = await resolveCountryCodes()
          return isValidCountryCode(v, format, codes)
        },
        { params: { code: 'invalid', namespace: 'country' } },
      ),
    )

    if (allow.length > 0) {
      schema = schema.pipe(
        z.string().refine(
          (v: string): boolean => allow.includes(v),
          { params: { code: 'notAllowed', namespace: 'country' } },
        ),
      )
    }

    if (block.length > 0) {
      schema = schema.pipe(
        z.string().refine(
          (v: string): boolean => !block.includes(v),
          { params: { code: 'blocked', namespace: 'country' } },
        ),
      )
    }

    return schema
  },
})
