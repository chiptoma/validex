// ==============================================================================
// SLUG RULE
// Validates URL-friendly slug strings with configurable constraints.
// ==============================================================================

import type { FormatRuleOptions, Range } from '../types'
import { z } from 'zod'
import { createRule } from '../core/createRule'
import { resolveRange } from '../internal/resolveRange'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * SlugOptions
 * Options for the slug validation rule.
 */
export interface SlugOptions extends FormatRuleOptions {
  /** Length constraints for the slug. Defaults to { min: 3, max: 100 }. */
  readonly length?: Range | undefined
  /** Additional characters to allow in the slug character class. */
  readonly extraChars?: string | undefined
}

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

const ESCAPE_REGEX_RE = /[.*+?^${}()|[\]\\]/g
const DEFAULT_SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/

/**
 * Build Slug Pattern
 * Constructs a regex for slug validation with optional extra characters.
 *
 * @param extraChars - Additional characters to include in the character class.
 * @returns A RegExp that matches valid slug strings.
 */
function buildSlugPattern(extraChars?: string): RegExp {
  if (extraChars !== undefined && extraChars.length > 0) {
    const escaped = extraChars.replace(ESCAPE_REGEX_RE, '\\$&')

    return new RegExp(`^[a-z0-9${escaped}]+(-[a-z0-9${escaped}]+)*$`)
  }
  return DEFAULT_SLUG_RE
}

// ----------------------------------------------------------
// RULE FACTORY
// ----------------------------------------------------------

/**
 * Slug
 * Validates that a string is a URL-friendly slug. Supports custom length
 * constraints, extra allowed characters, and regex override.
 *
 * @param options - Optional slug validation options.
 * @returns A Zod schema that validates slug strings.
 */
export const Slug = /* @__PURE__ */ createRule<SlugOptions>({
  name: 'slug',
  defaults: {},
  messages: {},
  build: (opts: SlugOptions): z.ZodType => {
    const range = resolveRange(opts.length)
    /* c8 ignore start -- defensive fallback; defaults always provide length range */
    const min = range?.min ?? 1
    const max = range?.max ?? 100
    /* c8 ignore stop */

    const pattern = opts.regex ?? buildSlugPattern(opts.extraChars)

    const base = opts.normalize !== false
      ? z.string().transform((v: string): string => v.trim().toLowerCase())
      : z.string()

    return base.pipe(
      z.string()
        .min(min)
        .max(max)
        .refine(
          (v: string): boolean => pattern.test(v),
          { params: { code: 'invalid', namespace: 'slug' } },
        ),
    )
  },
})
