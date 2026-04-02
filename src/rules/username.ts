// ==============================================================================
// USERNAME RULE
// Validates username strings with pattern, boundary, and consecutive checks.
// ==============================================================================

import type { Boundary, FormatRuleOptions, Range } from '../types'
import { z } from 'zod'
import { checkAsciiBoundary } from '../checks/boundary'
import { createRule } from '../core/createRule'
import { escapeRegexChars } from '../internal/escapeRegex'
import { resolveBoundary } from '../internal/resolveBoundary'
import { resolveRange } from '../internal/resolveRange'
import { getReservedUsernames, loadReservedUsernames } from '../loaders/reservedUsernames'
import '../augmentation'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * UsernameOptions
 * Configuration options for the username validation rule.
 */
export interface UsernameOptions extends FormatRuleOptions {
  /** Length constraints for the username. Defaults to { min: 3, max: 20 }. */
  readonly length?: Range | undefined
  /** Character pattern preset. Defaults to 'alphanumeric-underscore'. */
  readonly pattern?: 'alphanumeric' | 'alphanumeric-dash' | 'alphanumeric-underscore' | undefined
  /** Additional characters to allow in the character class. */
  readonly extraChars?: string | undefined
  /** Characters to disallow from the pattern character class. */
  readonly disallowChars?: string | undefined
  /** Boundary constraint for first/last character. Defaults to 'alphanumeric'. */
  readonly boundary?: Boundary | undefined
  /** Maximum consecutive identical characters. */
  readonly consecutive?: Range | undefined
  /** Reserved words that cannot be used as usernames. */
  readonly reservedWords?: readonly string[] | undefined
  /** Block reserved words. Defaults to false. */
  readonly blockReserved?: boolean | undefined
  /** Ignore case when checking patterns and reserved words. Defaults to true. */
  readonly ignoreCase?: boolean | undefined
}

// ----------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------

const PATTERN_MAP: Readonly<Record<string, string>> = {
  'alphanumeric': 'a-z0-9',
  'alphanumeric-dash': 'a-z0-9\\-',
  'alphanumeric-underscore': 'a-z0-9_',
}

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Build Username Pattern
 * Constructs a regex for username validation from pattern preset and extra chars.
 *
 * @param pattern       - The character pattern preset name.
 * @param extraChars    - Additional characters to include.
 * @param disallowChars - Characters to remove from the base set.
 * @returns A RegExp matching valid username strings.
 */
function buildUsernamePattern(
  pattern: string,
  extraChars?: string,
  disallowChars?: string,
): RegExp {
  /* c8 ignore next -- defensive fallback; pattern is constrained by TypeScript to known keys */
  let charClass = PATTERN_MAP[pattern] ?? 'a-z0-9_'

  if (extraChars !== undefined && extraChars.length > 0) {
    charClass += escapeRegexChars(extraChars)
  }

  if (disallowChars !== undefined) {
    for (const ch of disallowChars) {
      charClass = charClass.replaceAll(escapeRegexChars(ch), '')
    }
  }

  return new RegExp(`^[${charClass}]+$`)
}

/**
 * Apply Reserved Refine
 * Adds an async refine that rejects reserved usernames.
 *
 * @param schema         - The current Zod schema to refine.
 * @param ignoreCase     - Whether to normalize casing before comparison.
 * @param customReserved - Additional reserved words from the caller.
 * @param label          - Explicit label for error messages.
 * @returns The schema with the reserved-word refine applied.
 */
function applyReservedRefine(
  schema: z.ZodType,
  ignoreCase: boolean,
  customReserved: readonly string[],
  label?: string,
): z.ZodType {
  return schema.superRefine(async (v: unknown, ctx): Promise<void> => {
    /* c8 ignore start -- defensive type guard; schema is z.string() so v is always string */
    if (typeof v !== 'string')
      return
    /* c8 ignore stop */
    const normalized = ignoreCase ? v.toLowerCase() : v
    if (customReserved.length > 0) {
      const customSet = customReserved.map(w => ignoreCase ? w.toLowerCase() : w)
      if (customSet.includes(normalized)) {
        ctx.addIssue({ code: 'custom', params: { code: 'reservedBlocked', namespace: 'username', value: normalized, label } })
        return
      }
    }
    let isReserved = false
    try {
      const reserved = getReservedUsernames()
      isReserved = reserved.has(normalized)
    }
    catch {
      const reserved = await loadReservedUsernames()
      isReserved = reserved.has(normalized)
    }
    if (isReserved) {
      ctx.addIssue({ code: 'custom', params: { code: 'reservedBlocked', namespace: 'username', value: normalized, label } })
    }
  })
}

// ----------------------------------------------------------
// RULE FACTORY
// ----------------------------------------------------------

/**
 * Username
 * Validates that a string is a valid username with configurable pattern,
 * boundary constraints, and consecutive character limits.
 *
 * @param options - Optional username validation options.
 * @returns A Zod schema that validates username strings.
 */
export const Username = /* @__PURE__ */ createRule<UsernameOptions>({
  name: 'username',
  defaults: {},
  messages: {},
  build: (opts: UsernameOptions): unknown => {
    const range = resolveRange(opts.length)
    const consecutiveRange = resolveRange(opts.consecutive)
    const boundary = resolveBoundary(opts.boundary)
    /* c8 ignore start -- defensive fallback; defaults always provide length range and pattern */
    const min = range?.min ?? 3
    const max = range?.max ?? 20

    const pattern = opts.regex ?? buildUsernamePattern(
      opts.pattern ?? 'alphanumeric-underscore',
      /* c8 ignore stop */
      opts.extraChars,
      opts.disallowChars,
    )

    const base = opts.normalize !== false
      ? z.string().transform((v: string): string => v.trim().toLowerCase())
      : z.string()

    const lbl = opts.label

    // Stage 1: length + pattern + boundary (with early returns)
    const stage1: z.ZodType = z.string().superRefine((v: string, ctx): void => {
      if (v.length < min) {
        ctx.addIssue({ code: 'custom', params: { code: 'min', namespace: 'base', label: lbl, minimum: min } })
        return
      }
      if (v.length > max) {
        ctx.addIssue({ code: 'custom', params: { code: 'max', namespace: 'base', label: lbl, maximum: max } })
        return
      }
      if (!pattern.test(v)) {
        ctx.addIssue({ code: 'custom', params: { code: 'invalid', namespace: 'username', label: lbl } })
        return
      }
      if (boundary !== undefined && !checkAsciiBoundary(v, boundary)) {
        ctx.addIssue({ code: 'custom', params: { code: 'boundary', namespace: 'username', label: lbl } })
      }
    })

    // Stage 2: chainable checks (only runs if stage 1 passes)
    let stage2: z.ZodType = z.string()
    if (consecutiveRange?.max !== undefined) {
      stage2 = stage2.maxConsecutive({ max: consecutiveRange.max, namespace: 'username', label: lbl })
    }

    // SAFETY: stage2 is z.string() chain; output is string-compatible
    let inner: z.ZodType = stage1.pipe(stage2 as z.ZodType<string, string>)

    if (opts.blockReserved === true) {
      inner = applyReservedRefine(
        inner,
        opts.ignoreCase !== false,
        opts.reservedWords ?? [],
        opts.label,
      )
    }

    // SAFETY: inner is a z.string() chain; output is string-compatible
    return base.pipe(inner as z.ZodType<string, string>)
  },
})
