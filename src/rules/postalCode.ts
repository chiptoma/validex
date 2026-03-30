// ==============================================================================
// POSTAL CODE RULE
// Validates postal/zip codes with country-specific patterns or custom regex.
// ------------------------------------------------------------------------------
// Uses postal-codes-js for built-in country validation. Supports regex override
// for unsupported or custom formats.
// ==============================================================================

import type { FormatRuleOptions } from '../types'
import { z } from 'zod'
import { createRule } from '../core/createRule'

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
 * Uses postal-codes-js for validation, or a custom regex override.
 *
 * @param options - Per-call postal code validation options.
 * @returns A Zod schema that validates postal code strings.
 */
export const PostalCode = /* @__PURE__ */ createRule<PostalCodeOptions>({
  name: 'postalCode',
  defaults: {},
  messages: {
    invalid: '{{label}} is not a valid postal code',
  },
  build: (opts: PostalCodeOptions): z.ZodType => {
    const base = opts.normalize !== false
      ? z.string().transform((v: string): string => v.trim().toUpperCase())
      : z.string()

    return base.pipe(
      z.string().refine(
        async (value: string): Promise<boolean> => {
          if (opts.regex) {
            return opts.regex.test(value)
          }
          const pc = await import('postal-codes-js')
          const result = pc.validate(opts.country, value)
          return result === true
        },
        { params: { code: 'invalid', namespace: 'postalCode' } },
      ),
    )
  },
})
