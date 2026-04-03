// ==============================================================================
// VAT NUMBER RULE
// Validates European VAT identification numbers with country detection.
// ------------------------------------------------------------------------------
// Supports all EU member states plus GB, CH, and NO. Auto-detects country
// from prefix or validates against a specified country code.
// ==============================================================================

import type { BaseRuleOptions } from '../types'

import { z } from 'zod'

import { createRule } from '@core/createRule'
import { getVatPatterns, loadVatPatterns } from '@loaders/vatPatterns'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * VatNumberOptions
 * Configuration options for the VAT number validation rule.
 */
export interface VatNumberOptions extends BaseRuleOptions {
  /** ISO country code to validate against (e.g. 'DE', 'FR'). */
  readonly country?: string | undefined
  /** Require the country prefix at the start of the value. */
  readonly requirePrefix?: boolean | undefined
}

// ----------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------

const WHITESPACE_RE = /\s+/g

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Resolve VAT Patterns
 * Returns the VAT patterns map, loading async if not yet cached.
 *
 * @returns The ReadonlyMap of country codes to RegExp patterns.
 */
async function resolveVatPatterns(): Promise<ReadonlyMap<string, RegExp>> {
  try {
    return getVatPatterns()
  }
  catch {
    return loadVatPatterns()
  }
}

/**
 * Extract Country And Number
 * Splits a normalized VAT string into country code and number part.
 *
 * @param value         - The normalized VAT string.
 * @param country       - Optional explicit country code.
 * @param requirePrefix - Whether the prefix is required.
 * @returns Tuple of [countryCode, numberPart] or null if invalid.
 */
function extractCountryAndNumber(
  value: string,
  country: string | undefined,
  requirePrefix: boolean,
): readonly [string, string] | null {
  if (country === undefined || country === '') {
    const cc = value.slice(0, 2)
    return [cc, value.slice(2)]
  }

  if (requirePrefix) {
    if (!value.startsWith(country))
      return null
    return [country, value.slice(country.length)]
  }

  const numberPart = value.startsWith(country)
    ? value.slice(country.length)
    : value

  return [country, numberPart]
}

// ----------------------------------------------------------
// RULE FACTORY
// ----------------------------------------------------------

/**
 * VAT Number
 * Validates that a string is a valid VAT identification number.
 * Auto-detects country from prefix or validates against a specified code.
 *
 * @param options - Per-call VAT number validation options.
 * @returns A Zod schema that validates VAT number strings.
 */
export const VatNumber = /* @__PURE__ */ createRule<VatNumberOptions>({
  name: 'vatNumber',
  defaults: {},
  messages: {},
  build: (opts: VatNumberOptions): z.ZodType => {
    const requirePrefix = opts.requirePrefix ?? false

    const schema = opts.normalize !== false
      ? z.string().transform(
          (v: string): string => v.trim().toUpperCase().replace(WHITESPACE_RE, ''),
        )
      : z.string()

    return schema.pipe(
      z.string().refine(
        async (value: string): Promise<boolean> => {
          const patterns = await resolveVatPatterns()
          const parts = extractCountryAndNumber(
            value,
            opts.country,
            requirePrefix,
          )
          if (!parts)
            return false
          const [cc, numberPart] = parts
          const pattern = patterns.get(cc)
          if (!pattern)
            return false
          return pattern.test(numberPart)
        },
        { params: { code: 'invalid', namespace: 'vatNumber', label: opts.label } },
      ),
    )
  },
})
