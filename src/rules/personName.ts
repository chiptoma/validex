// ==============================================================================
// PERSON NAME RULE
// Validates human names with unicode support, boundary, and word constraints.
// ==============================================================================

import type { Boundary, FormatRuleOptions, Range } from '../types'
import { z } from 'zod'
import { checkUnicodeBoundary } from '../checks/boundary'
import { maxConsecutive, maxWords } from '../checks/limits'
import { toTitleCase } from '../checks/transforms'
import { createRule } from '../core/createRule'
import { escapeRegexChars } from '../internal/escapeRegex'
import { resolveBoundary } from '../internal/resolveBoundary'
import { resolveRange } from '../internal/resolveRange'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * PersonNameOptions
 * Configuration options for the person name validation rule.
 */
export interface PersonNameOptions extends FormatRuleOptions {
  /** Length constraints for the full name string. */
  readonly length?: Range | undefined
  /** Word count constraints. */
  readonly words?: Range | undefined
  /** Allow unicode letters (\p{L}) vs ASCII-only. Defaults to true. */
  readonly allowUnicode?: boolean | undefined
  /** Extra characters to allow in the character class. */
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

/** Default non-letter characters allowed in person names. */
const DEFAULT_EXTRA = ' -\'\u2019'

/**
 * Build Charset Regex
 * Constructs a character-class regex for name validation.
 *
 * @param allowUnicode   - Use \p{L} for letters if true, else [a-zA-Z].
 * @param extraChars     - Additional characters to allow.
 * @param disallowChars  - Characters to remove from the default set.
 * @returns A RegExp matching the entire string against the character class.
 */
function buildCharsetRegex(
  allowUnicode: boolean,
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

  const letterClass = allowUnicode ? '\\p{L}' : 'a-zA-Z'
  const extra = escapeRegexChars(allowed)
  return new RegExp(`^[${letterClass}${extra}]+$`, 'u')
}

// ----------------------------------------------------------
// RULE FACTORY
// ----------------------------------------------------------

/**
 * PersonName
 * Validates that a string is a plausible human name. Supports unicode,
 * hyphens, apostrophes, boundary constraints, and word limits.
 *
 * @param options - Optional person name validation options.
 * @returns A Zod schema that validates person name strings.
 */
export const PersonName = /* @__PURE__ */ createRule<PersonNameOptions>({
  name: 'personName',
  defaults: {},
  messages: {},
  build: (opts: PersonNameOptions): unknown => {
    const range = resolveRange(opts.length)
    const wordsRange = resolveRange(opts.words)
    const consecutiveRange = resolveRange(opts.consecutive)
    const boundary = resolveBoundary(opts.boundary)

    let base = opts.normalize !== false
      ? z.string().trim()
      : z.string()

    if (range?.min !== undefined)
      base = base.min(range.min)
    if (range?.max !== undefined)
      base = base.max(range.max)

    const pattern = opts.regex ?? buildCharsetRegex(
      opts.allowUnicode !== false,
      opts.extraChars,
      opts.disallowChars,
    )

    const validated = base.superRefine((v: string, ctx: z.RefinementCtx): void => {
      if (!pattern.test(v)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          params: { code: 'invalid', namespace: 'personName' },
        })
        return
      }

      if (boundary !== undefined && !checkUnicodeBoundary(v, boundary)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          params: { code: 'boundary', namespace: 'personName' },
        })
      }

      if (consecutiveRange?.max !== undefined && !maxConsecutive(v, consecutiveRange.max)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          params: { code: 'maxConsecutive', namespace: 'personName', maximum: consecutiveRange.max },
        })
      }

      if (wordsRange?.max !== undefined && !maxWords(v, wordsRange.max)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          params: { code: 'maxWords', namespace: 'personName', maximum: wordsRange.max },
        })
      }
    })

    if (opts.titleCase === true) {
      return validated.transform(toTitleCase)
    }

    return validated
  },
})
