// ==============================================================================
// BUSINESS NAME RULE
// Validates business/company names with permissive character sets.
// ==============================================================================

import type { Boundary, FormatRuleOptions, Range } from '../types'
import { z } from 'zod'
import { maxConsecutive } from '../checks/limits'
import { toTitleCase } from '../checks/transforms'
import { createRule } from '../core/createRule'
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
 * Escape Regex Chars
 * Escapes special regex characters in a string.
 *
 * @param str - The string to escape.
 * @returns The escaped string safe for use in a character class.
 */
function escapeRegexChars(str: string): string {
  return str.replace(/[-.*+?^${}()|[\]\\]/g, '\\$&')
}

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

/**
 * Check Boundary
 * Validates that the first and last characters satisfy the boundary constraint.
 *
 * @param value    - The string to check.
 * @param boundary - Resolved boundary configuration.
 * @param boundary.start
 * @param boundary.end
 * @returns True if boundary constraints are satisfied.
 */
function checkBoundary(
  value: string,
  boundary: { start: string, end: string },
): boolean {
  const alphaRe = /^\p{L}$/u
  const alphanumericRe = /^[\p{L}\p{Nd}]$/u
  const chars = Array.from(value)
  const first = chars[0]
  const last = chars[chars.length - 1]

  /* c8 ignore start -- defensive guard; min length constraint prevents empty strings from reaching boundary check */
  if (first === undefined || last === undefined) {
    return false
  }
  /* c8 ignore stop */

  if (boundary.start === 'alpha' && !alphaRe.test(first))
    return false
  if (boundary.start === 'alphanumeric' && !alphanumericRe.test(first))
    return false
  if (boundary.end === 'alpha' && !alphaRe.test(last))
    return false
  if (boundary.end === 'alphanumeric' && !alphanumericRe.test(last))
    return false

  return true
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
  messages: {
    invalid: '{{label}} is not a valid business name',
    boundary: '{{label}} must start and end with a letter or number',
    maxConsecutive:
      '{{label}} must not have more than {{maximum}} consecutive characters',
  },
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

      if (boundary !== undefined && !checkBoundary(v, boundary)) {
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
