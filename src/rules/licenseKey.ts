// ==============================================================================
// LICENSE KEY RULE
// Validates software license key strings with configurable format.
// ==============================================================================

import type { FormatRuleOptions } from '../types'
import { z } from 'zod'
import { createRule } from '../core/createRule'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * LicenseKeyOptions
 * Configuration options for the license key validation rule.
 */
export interface LicenseKeyOptions extends FormatRuleOptions {
  /** License key format type. Defaults to 'custom'. */
  readonly type?: 'windows' | 'uuid' | 'custom' | undefined
  /** Number of segments in the key. Defaults to 5. */
  readonly segments?: number | undefined
  /** Length of each segment. Defaults to 5. */
  readonly segmentLength?: number | undefined
  /** Separator between segments. Defaults to '-'. */
  readonly separator?: string | undefined
  /** Character set for each segment. Defaults to 'alphanumeric'. */
  readonly charset?: 'alphanumeric' | 'alpha' | 'numeric' | 'hex' | undefined
}

// ----------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------

const CHARSET_MAP: Readonly<Record<string, string>> = {
  alphanumeric: 'A-Z0-9',
  alpha: 'A-Z',
  numeric: '0-9',
  hex: '0-9A-F',
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
 * @returns The escaped string safe for use in a regex pattern.
 */
function escapeRegexChars(str: string): string {
  return str.replace(ESCAPE_REGEX_RE, '\\$&')
}

/**
 * Build License Key Pattern
 * Constructs a regex for license key validation from segment config.
 *
 * @param segments      - Number of segments.
 * @param segmentLength - Character count per segment.
 * @param separator     - Separator string between segments.
 * @param charset       - Character set name for segment characters.
 * @returns A RegExp matching valid license key strings.
 */
function buildLicenseKeyPattern(
  segments: number,
  segmentLength: number,
  separator: string,
  charset: string,
): RegExp {
  /* c8 ignore next -- defensive fallback; charset is constrained by TypeScript to known keys */
  const charClass = CHARSET_MAP[charset] ?? CHARSET_MAP['alphanumeric']
  const sep = escapeRegexChars(separator)
  const segPart = `[${charClass}]{${segmentLength}}`
  const repeatPart = segments > 1
    ? `(${sep}${segPart}){${segments - 1}}`
    : ''

  return new RegExp(`^${segPart}${repeatPart}$`)
}

// ----------------------------------------------------------
// RULE FACTORY
// ----------------------------------------------------------

/**
 * LicenseKey
 * Validates that a string is a valid license key. Supports UUID format,
 * Windows-style keys, and fully customizable segment patterns.
 *
 * @param options - Optional license key validation options.
 * @returns A Zod schema that validates license key strings.
 */
export const LicenseKey = /* @__PURE__ */ createRule<LicenseKeyOptions>({
  name: 'licenseKey',
  defaults: {},
  messages: {
    invalid: '{{label}} is not a valid license key',
  },
  build: (opts: LicenseKeyOptions): unknown => {
    if (opts.type === 'uuid') {
      return opts.normalize !== false
        ? z.string().trim().toUpperCase().uuid()
        : z.string().uuid()
    }

    const base = opts.normalize !== false
      ? z.string().transform((v: string): string => v.trim().toUpperCase()).pipe(z.string())
      : z.string()

    /* c8 ignore start -- defensive fallback; defaults always provide segment config */
    const pattern = opts.regex ?? buildLicenseKeyPattern(
      opts.segments ?? 5,
      opts.segmentLength ?? 5,
      opts.separator ?? '-',
      opts.charset ?? 'alphanumeric',
    )
    /* c8 ignore stop */

    return base.refine(
      (v: string): boolean => pattern.test(v),
      { params: { code: 'invalid', namespace: 'licenseKey' } },
    )
  },
})
