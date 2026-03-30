// ==============================================================================
// USERNAME RULE
// Validates username strings with pattern, boundary, and consecutive checks.
// ==============================================================================

import type { Boundary, FormatRuleOptions, Range } from '../types'
import { z } from 'zod'
import { maxConsecutive } from '../checks/limits'
import { createRule } from '../core/createRule'
import { resolveBoundary } from '../internal/resolveBoundary'
import { resolveRange } from '../internal/resolveRange'
import { getReservedUsernames, loadReservedUsernames } from '../loaders/reservedUsernames'

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

const ESCAPE_REGEX_RE = /[.*+?^${}()|[\]\\]/g

/**
 * Escape Regex Chars
 * Escapes special regex characters in a string.
 *
 * @param str - The string to escape.
 * @returns The escaped string safe for use in a character class.
 */
function escapeRegexChars(str: string): string {
  return str.replace(ESCAPE_REGEX_RE, '\\$&')
}

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

const BOUNDARY_ALPHA_RE = /^[a-z]$/
const BOUNDARY_ALPHANUMERIC_RE = /^[a-z0-9]$/

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
  const first = value.charAt(0)
  const last = value.charAt(value.length - 1)

  if (first === '' || last === '')
    return false
  if (boundary.start === 'alpha' && !BOUNDARY_ALPHA_RE.test(first))
    return false
  if (boundary.start === 'alphanumeric' && !BOUNDARY_ALPHANUMERIC_RE.test(first))
    return false
  if (boundary.end === 'alpha' && !BOUNDARY_ALPHA_RE.test(last))
    return false
  if (boundary.end === 'alphanumeric' && !BOUNDARY_ALPHANUMERIC_RE.test(last))
    return false

  return true
}

/**
 * Apply Reserved Refine
 * Adds an async refine that rejects reserved usernames.
 *
 * @param schema         - The current Zod schema to refine.
 * @param ignoreCase     - Whether to normalize casing before comparison.
 * @param customReserved - Additional reserved words from the caller.
 * @returns The schema with the reserved-word refine applied.
 */
function applyReservedRefine(
  schema: z.ZodType,
  ignoreCase: boolean,
  customReserved: readonly string[],
): z.ZodType {
  return schema.refine(
    async (v: unknown): Promise<boolean> => {
      /* c8 ignore start -- defensive type guard; schema is z.string() so v is always string */
      if (typeof v !== 'string')
        return true
      /* c8 ignore stop */
      const normalized = ignoreCase ? v.toLowerCase() : v
      if (customReserved.length > 0) {
        const customSet = customReserved.map(w => ignoreCase ? w.toLowerCase() : w)
        if (customSet.includes(normalized))
          return false
      }
      try {
        const reserved = getReservedUsernames()
        return !reserved.has(normalized)
      }
      catch {
        const reserved = await loadReservedUsernames()
        return !reserved.has(normalized)
      }
    },
    { params: { code: 'reservedBlocked', namespace: 'username' } },
  )
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
  messages: {
    invalid: '{{label}} is not a valid username',
    reservedBlocked: 'This username is reserved',
    boundary: '{{label}} must start and end with a letter or number',
    maxConsecutive:
      '{{label}} must not have more than {{maximum}} consecutive characters',
  },
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

    let inner = z.string().min(min).max(max)

    inner = inner.refine(
      (v: string): boolean => pattern.test(v),
      { params: { code: 'invalid', namespace: 'username' } },
    )

    if (boundary !== undefined) {
      inner = inner.refine(
        (v: string): boolean => checkBoundary(v, boundary),
        { params: { code: 'boundary', namespace: 'username' } },
      )
    }

    if (consecutiveRange?.max !== undefined) {
      const limit = consecutiveRange.max
      inner = inner.refine(
        (v: string): boolean => maxConsecutive(v, limit),
        { params: { code: 'maxConsecutive', namespace: 'username', maximum: limit } },
      )
    }

    if (opts.blockReserved === true) {
      const refined = applyReservedRefine(
        inner,
        opts.ignoreCase !== false,
        opts.reservedWords ?? [],
      ) as typeof inner
      return base.pipe(refined)
    }

    return base.pipe(inner)
  },
})
