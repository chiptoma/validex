// ==============================================================================
// POSTAL CODE RULE
// Validates postal/zip codes with country-specific patterns or custom regex.
// ------------------------------------------------------------------------------
// Uses postcode-validator (lazy-loaded) for built-in country validation.
// Supports regex and customFn as escape hatches for unsupported countries.
// ==============================================================================

import type { FormatRuleOptions } from '../types'

import { z } from 'zod'

import { createRule } from '@core/createRule'
import { getPostalCodes, loadPostalCodes } from '@loaders/postalCodes'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * PostalCodeOptions
 * Configuration options for the postal code validation rule.
 */
export interface PostalCodeOptions extends FormatRuleOptions {
  /** ISO 3166-1 alpha-2 country code (required). */
  readonly country: string
}

// ----------------------------------------------------------
// RULE FACTORY
// ----------------------------------------------------------

/**
 * Postal Code
 * Validates that a string is a valid postal code for the specified country.
 * Uses postcode-validator for validation, or a custom regex/customFn override.
 * Throws at creation time if the module is preloaded and the country is
 * unsupported. Otherwise defers validation to parse time.
 *
 * @param options - Per-call postal code validation options.
 * @returns A Zod schema that validates postal code strings.
 */
export const PostalCode = /* @__PURE__ */ createRule<PostalCodeOptions>({
  name: 'postalCode',
  defaults: {},
  messages: {},
  build: (opts: PostalCodeOptions): z.ZodType => {
    const country = opts.country.toUpperCase()
    const mod = getPostalCodes()

    // Creation-time check: only when module is preloaded and no escape hatch
    if (mod !== undefined && !opts.regex && !opts.customFn && !mod.postcodeValidatorExistsForCountry(country)) {
      throw new Error(
        `validex: PostalCode country "${opts.country}" is not supported. `
        + 'Provide a regex or customFn for custom validation.',
      )
    }

    const base = opts.normalize !== false
      ? z.string().transform((v: string): string => v.trim().toUpperCase())
      : z.string()

    return base.pipe(
      z.string().superRefine(async (value: string, ctx): Promise<void> => {
        // Skip built-in validation when customFn is the escape hatch
        if (opts.regex) {
          if (!opts.regex.test(value)) {
            ctx.addIssue({ code: 'custom', params: { code: 'invalid', namespace: 'postalCode', label: opts.label } })
          }
          return
        }

        const resolved = mod ?? await loadPostalCodes()

        if (!resolved.postcodeValidatorExistsForCountry(country)) {
          // Unsupported country without regex — customFn handles it (or fails)
          if (!opts.customFn) {
            ctx.addIssue({ code: 'custom', params: { code: 'invalid', namespace: 'postalCode', label: opts.label } })
          }
          return
        }

        if (!resolved.postcodeValidator(value, country)) {
          ctx.addIssue({ code: 'custom', params: { code: 'invalid', namespace: 'postalCode', label: opts.label } })
        }
      }),
    )
  },
})
