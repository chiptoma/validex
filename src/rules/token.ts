// ==============================================================================
// TOKEN RULE
// Validates token strings for various ID formats (nanoid, hex, cuid, ulid, etc).
// ==============================================================================

import type { FormatRuleOptions, Range } from '../types'
import { z } from 'zod'
import { createRule } from '../core/createRule'
import { resolveRange } from '../internal/resolveRange'

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

    let schema = opts.normalize !== false
      ? z.string().trim()
      : z.string()

    const min = range?.min ?? spec.defaultLength ?? undefined
    const max = range?.max ?? spec.defaultLength ?? undefined

    if (min !== undefined)
      schema = schema.min(min)
    if (max !== undefined)
      schema = schema.max(max)

    const pattern = opts.regex ?? spec.pattern

    return schema.refine(
      (v: string): boolean => pattern.test(v),
      { params: { code: 'invalid', namespace: 'token', type: opts.type } },
    )
  },
})
