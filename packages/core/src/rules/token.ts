// ==============================================================================
// TOKEN RULE
// Validates token strings for various ID formats (nanoid, hex, cuid, ulid, etc).
// ==============================================================================

import type { FormatRuleOptions, Range } from '../types'

import { z } from 'zod'

import { createRule } from '@core/createRule'
import { resolveRange } from '@internal/resolveRange'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * TokenType
 * Supported token format types.
 */
export type TokenType = 'nanoid' | 'hex' | 'base64' | 'cuid' | 'cuid2' | 'ulid'

/**
 * TokenOptions
 * Configuration options for the token validation rule.
 */
export interface TokenOptions extends FormatRuleOptions {
  /** Token format type. Required, no default. */
  readonly type: TokenType
  /** Length constraints for the token. Defaults vary by type. */
  readonly length?: Range | undefined
}

// ----------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------

/**
 * TokenSpec
 * Pattern and optional default length for a token type.
 */
interface TokenSpec {
  readonly pattern: RegExp
  readonly defaultLength?: number
}

const TOKEN_SPECS: Readonly<Record<TokenType, TokenSpec>> = {
  nanoid: { pattern: /^[\w-]+$/, defaultLength: 21 },
  cuid: { pattern: /^c[a-z0-9]+$/, defaultLength: 25 },
  cuid2: { pattern: /^[a-z][a-z0-9]+$/, defaultLength: 24 },
  ulid: { pattern: /^[0-9A-HJKMNP-TV-Z]{26}$/i, defaultLength: 26 },
  hex: { pattern: /^[0-9a-f]+$/i },
  base64: { pattern: /^[A-Z0-9+/]+=*$/i },
}

// ----------------------------------------------------------
// RULE FACTORY
// ----------------------------------------------------------

/**
 * Token
 * Validates that a string is a valid token of the specified type.
 * Supports nanoid, hex, base64, cuid, cuid2, and ulid formats.
 *
 * @param options - Token validation options (type is required).
 * @returns A Zod schema that validates token strings.
 */
export const Token = /* @__PURE__ */ createRule<TokenOptions>({
  name: 'token',
  defaults: {},
  messages: {},
  build: (opts: TokenOptions): unknown => {
    const spec = TOKEN_SPECS[opts.type]
    const range = resolveRange(opts.length)

    const schema = opts.normalize !== false
      ? z.string().trim()
      : z.string()

    const min = range?.min ?? spec.defaultLength ?? undefined
    const max = range?.max ?? spec.defaultLength ?? undefined
    const pattern = opts.regex ?? spec.pattern
    const lbl = opts.label
    const tokenType = opts.type

    return schema.superRefine((v: string, ctx): void => {
      if (min !== undefined && v.length < min) {
        ctx.addIssue({ code: 'custom', params: { code: 'min', namespace: 'base', label: lbl, minimum: min } })
        return
      }
      if (max !== undefined && v.length > max) {
        ctx.addIssue({ code: 'custom', params: { code: 'max', namespace: 'base', label: lbl, maximum: max } })
        return
      }
      if (!pattern.test(v)) {
        ctx.addIssue({ code: 'custom', params: { code: 'invalid', namespace: 'token', type: tokenType, label: lbl } })
      }
    })
  },
})
