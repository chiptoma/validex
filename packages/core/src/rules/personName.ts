// ==============================================================================
// PERSON NAME RULE
// Validates human names with unicode support, boundary, and word constraints.
// ==============================================================================

import type { Boundary, FormatRuleOptions, Range } from '../types'
import { z } from 'zod'
import { toTitleCase } from '../checks/transforms'
import { createRule } from '../core/createRule'
import { checkUnicodeBoundary } from '../internal/boundary'
import { escapeRegexChars } from '../internal/escapeRegex'
import { resolveBoundary } from '../internal/resolveBoundary'
import { resolveRange } from '../internal/resolveRange'
import '../augmentation'

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

    const base = opts.normalize !== false
      ? z.string().trim()
      : z.string()

    const minLen = range?.min
    const maxLen = range?.max
    const lbl = opts.label

    const pattern = opts.regex ?? buildCharsetRegex(
      opts.allowUnicode !== false,
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
        ctx.addIssue({ code: 'custom', params: { code: 'invalid', namespace: 'personName', label: lbl } })
        return
      }
      if (boundary !== undefined && !checkUnicodeBoundary(v, boundary)) {
        ctx.addIssue({ code: 'custom', params: { code: 'boundary', namespace: 'personName', label: lbl } })
      }
    })

    // Stage 2: chainable checks (only runs if stage 1 passes)
    let stage2: z.ZodType = z.string()
    if (consecutiveRange?.max !== undefined) {
      stage2 = stage2.maxConsecutive({ max: consecutiveRange.max, namespace: 'personName', label: lbl })
    }
    if (wordsRange?.max !== undefined) {
      stage2 = stage2.maxWords({ max: wordsRange.max, namespace: 'personName', label: lbl })
    }

    // SAFETY: stage2 is z.string() chain; output is string-compatible
    const validated = stage1.pipe(stage2 as z.ZodType<string, string>)

    if (opts.titleCase === true) {
      return validated.transform(toTitleCase)
    }

    return validated
  },
})
