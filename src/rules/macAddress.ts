// ==============================================================================
// MAC ADDRESS RULE
// Validates MAC address strings with configurable delimiter format.
// ==============================================================================

import type { BaseRuleOptions } from '../types'
import { z } from 'zod'
import { createRule } from '../core/createRule'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * MacAddressOptions
 * Configuration options for the MAC address validation rule.
 */
export interface MacAddressOptions extends BaseRuleOptions {
  /** Delimiter between octets. Defaults to ':'. */
  readonly delimiter?: ':' | '-' | 'none' | undefined
}

// ----------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------

const COLON_PATTERN: RegExp = /^[\dA-F]{2}(:[\dA-F]{2}){5}$/i
const HYPHEN_PATTERN: RegExp = /^[\dA-F]{2}(-[\dA-F]{2}){5}$/i
const BARE_PATTERN: RegExp = /^[\dA-F]{12}$/i

const PATTERNS: Readonly<Record<string, RegExp>> = {
  ':': COLON_PATTERN,
  '-': HYPHEN_PATTERN,
  'none': BARE_PATTERN,
}

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Get Pattern
 * Returns the regex pattern for the given delimiter.
 *
 * @param delimiter - The MAC address delimiter.
 * @returns The corresponding regex pattern.
 */
function getPattern(delimiter: string): RegExp {
  /* c8 ignore next -- defensive fallback; delimiter is constrained by TypeScript to known keys */
  return PATTERNS[delimiter] ?? COLON_PATTERN
}

// ----------------------------------------------------------
// RULE FACTORY
// ----------------------------------------------------------

/**
 * Mac Address
 * Validates that a string is a valid MAC address in the specified
 * delimiter format. Trims whitespace by default.
 *
 * @param options - Per-call MAC address validation options.
 * @returns A Zod schema that validates MAC address strings.
 */
export const MacAddress = /* @__PURE__ */ createRule<MacAddressOptions>({
  name: 'macAddress',
  defaults: {},
  messages: {},
  build: (opts: MacAddressOptions): unknown => {
    /* c8 ignore next -- defensive fallback; defaults always provide delimiter */
    const delimiter = opts.delimiter ?? ':'
    const pattern = getPattern(delimiter)

    const base = opts.normalize !== false
      ? z.string().trim()
      : z.string()

    return base.refine(
      (v: string): boolean => pattern.test(v),
      { params: { code: 'invalid', namespace: 'macAddress' } },
    )
  },
})
