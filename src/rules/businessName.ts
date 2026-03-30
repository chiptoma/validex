// ==============================================================================
// BUSINESS NAME RULE
// Validates business/company names with permissive character sets.
// ==============================================================================

import type { Boundary, FormatRuleOptions, Range } from '../types'
import { z } from 'zod'
import { checkUnicodeBoundary } from '../checks/boundary'
import { maxConsecutive } from '../checks/limits'
import { toTitleCase } from '../checks/transforms'
import { createRule } from '../core/createRule'
import { escapeRegexChars } from '../internal/escapeRegex'
import { resolveBoundary } from '../internal/resolveBoundary'
import { resolveRange } from '../internal/resolveRange'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * BusinessNameOptions
 * Configuration options for the business name validation rule.
 */
export interface BusinessNameOptions extends FormatRuleOptions {
  /** Length constraints for the business name. */
  readonly length?: Range | undefined
  /** Extra characters to allow beyond the default set. */
  readonly extraChars?: string | undefined
  /** Characters to disallow from the default character class. */
  readonly disallowChars?: string | undefined
  /** Boundary constraint for first/last character. */
  readonly boundary?: Boundary | undefined
  /** Maximum consecutive identical characters. */
  readonly consecutive?: Range | undefined
  /** Apply title-case transform to the parsed value. */
  readonly titleCase?: boolean | undefined
}

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/** Default non-letter/digit characters allowed in business names. */
const DEFAULT_EXTRA = ' &.,-\'()'

/**
 * Build Business Charset Regex
 * Constructs a character-class regex for business name validation.
 *
 * @param extraChars    - Additional characters to allow.
 * @param disallowChars - Characters to remove from the default set.
 * @returns A RegExp matching the entire string against the character class.
 */
function buildBusinessCharsetRegex(
  extraChars?: string,
  disallowChars?: string,
): RegExp {
  let allowed = DEFAULT_EXTRA
  if (extraChars !== undefined) {
    allowed += extraChars
  }
  if (disallowChars !== undefined) {
    for (const ch of disallowChars) {
      allowed = allowed.replaceAll(ch, '')
    }
  }

  const extra = escapeRegexChars(allowed)
  return new RegExp(`^[\\p{L}\\p{Nd}${extra}]+$`, 'u')
}

// ----------------------------------------------------------
// RULE FACTORY
// ----------------------------------------------------------

/**
 * BusinessName
 * Validates that a string is a plausible business or company name. Allows
 * letters, digits, ampersands, dots, commas, hyphens, apostrophes, and parens.
 *
 * @param options - Optional business name validation options.
 * @returns A Zod schema that validates business name strings.
 */
export const BusinessName = /* @__PURE__ */ createRule<BusinessNameOptions>({
  name: 'businessName',
  defaults: {},
  messages: {},
  build: (opts: BusinessNameOptions): unknown => {
    const range = resolveRange(opts.length)
    const consecutiveRange = resolveRange(opts.consecutive)
    const boundary = resolveBoundary(opts.boundary)

    let base = opts.normalize !== false
      ? z.string().trim()
      : z.string()

    if (range?.min !== undefined)
      base = base.min(range.min)
    if (range?.max !== undefined)
      base = base.max(range.max)

    const pattern = opts.regex ?? buildBusinessCharsetRegex(
      opts.extraChars,
      opts.disallowChars,
    )

    const validated = base.superRefine((v: string, ctx: z.RefinementCtx): void => {
      if (!pattern.test(v)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          params: { code: 'invalid', namespace: 'businessName' },
        })
        return
      }

      if (boundary !== undefined && !checkUnicodeBoundary(v, boundary)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          params: { code: 'boundary', namespace: 'businessName' },
        })
      }

      if (consecutiveRange?.max !== undefined && !maxConsecutive(v, consecutiveRange.max)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          params: { code: 'maxConsecutive', namespace: 'businessName', maximum: consecutiveRange.max },
        })
      }
    })

    if (opts.titleCase === true) {
      return validated.transform(toTitleCase)
    }

    return validated
  },
})
