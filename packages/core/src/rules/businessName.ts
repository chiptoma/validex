// ==============================================================================
// BUSINESS NAME RULE
// Validates business/company names with permissive character sets.
// ==============================================================================

import type { Boundary, FormatRuleOptions, Range } from '../types'
import { z } from 'zod'
import { checkUnicodeBoundary } from '../checks/boundary'
import { toTitleCase } from '../checks/transforms'
import { createRule } from '../core/createRule'
import { escapeRegexChars } from '../internal/escapeRegex'
import { resolveBoundary } from '../internal/resolveBoundary'
import { resolveRange } from '../internal/resolveRange'
import '../augmentation'

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

    const base = opts.normalize !== false
      ? z.string().trim()
      : z.string()

    const minLen = range?.min
    const maxLen = range?.max
    const lbl = opts.label

    const pattern = opts.regex ?? buildBusinessCharsetRegex(
      opts.extraChars,
      opts.disallowChars,
    )

    // Stage 1: length + pattern + boundary (with early returns)
    const stage1 = base.superRefine((v: string, ctx: z.RefinementCtx): void => {
      if (minLen !== undefined && v.length < minLen) {
        ctx.addIssue({ code: 'custom', params: { code: 'min', namespace: 'base', label: lbl, minimum: minLen } })
        return
      }
      if (maxLen !== undefined && v.length > maxLen) {
        ctx.addIssue({ code: 'custom', params: { code: 'max', namespace: 'base', label: lbl, maximum: maxLen } })
        return
      }
      if (!pattern.test(v)) {
        ctx.addIssue({ code: 'custom', params: { code: 'invalid', namespace: 'businessName', label: opts.label } })
        return
      }
      if (boundary !== undefined && !checkUnicodeBoundary(v, boundary)) {
        ctx.addIssue({ code: 'custom', params: { code: 'boundary', namespace: 'businessName', label: opts.label } })
      }
    })

    // Stage 2: chainable checks (only runs if stage 1 passes)
    let stage2: z.ZodType = z.string()
    if (consecutiveRange?.max !== undefined) {
      stage2 = stage2.maxConsecutive({ max: consecutiveRange.max, namespace: 'businessName', label: opts.label })
    }

    // SAFETY: stage2 is z.string() chain; output is string-compatible
    const validated = stage1.pipe(stage2 as z.ZodType<string, string>)

    if (opts.titleCase === true) {
      return validated.transform(toTitleCase)
    }

    return validated
  },
})
