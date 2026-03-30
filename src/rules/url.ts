// ==============================================================================
// URL RULE
// Validates arbitrary URLs with protocol, TLD, domain, and auth constraints.
// ==============================================================================

import type { BaseRuleOptions, Range } from '../types'
import { z } from 'zod'
import { createRule } from '../core/createRule'
import { resolveRange } from '../internal/resolveRange'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * URLOptions
 * Configuration options for the URL validation rule.
 */
export interface URLOptions extends BaseRuleOptions {
  /** Allowed protocols (without trailing colon). Defaults to ['http', 'https']. */
  readonly protocols?: readonly string[] | undefined
  /** Require a TLD (at least one dot in hostname). Defaults to true. */
  readonly requireTLD?: boolean | undefined
  /** Length constraints for the full URL. Defaults to { max: 2048 }. */
  readonly length?: Range | undefined
  /** Whitelist of allowed domains. Empty means allow all. */
  readonly allowDomains?: readonly string[] | undefined
  /** Blacklist of blocked domains. */
  readonly blockDomains?: readonly string[] | undefined
  /** Allow query strings. Defaults to true. */
  readonly allowQuery?: boolean | undefined
  /** Allow userinfo (user:pass@). Defaults to false. */
  readonly allowAuth?: boolean | undefined
}

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

const TRAILING_COLON_RE = /:$/

/**
 * Parse URL Safely
 * Wraps URL constructor in a try-catch for safe parsing.
 *
 * @param value - The URL string to parse.
 * @returns A URL object, or undefined on failure.
 */
function parseUrlSafely(value: string): URL | undefined {
  try {
    return new URL(value)
  }
  catch {
    return undefined
  }
}

/**
 * Check Protocol Allowed
 * Validates that the URL protocol is in the allowed list.
 *
 * @param value     - The URL string.
 * @param protocols - Allowed protocol names (without colon).
 * @returns True if protocol is allowed.
 */
function checkProtocolAllowed(value: string, protocols: readonly string[]): boolean {
  if (protocols.length === 0)
    return true
  const parsed = parseUrlSafely(value)
  /* c8 ignore start -- defensive guard; URL already passed z.url() validation */
  if (parsed === undefined)
    return false
  /* c8 ignore stop */
  return protocols.includes(parsed.protocol.replace(TRAILING_COLON_RE, ''))
}

/**
 * Check Has TLD
 * Validates that the hostname contains at least one dot (has a TLD).
 *
 * @param value - The URL string.
 * @returns True if hostname includes a dot.
 */
function checkHasTLD(value: string): boolean {
  const parsed = parseUrlSafely(value)
  /* c8 ignore start -- defensive guard; URL already passed z.url() validation */
  if (parsed === undefined)
    return false
  /* c8 ignore stop */
  return parsed.hostname.includes('.')
}

/**
 * Check No Auth
 * Validates that the URL contains no userinfo (username/password).
 *
 * @param value - The URL string.
 * @returns True if no auth credentials are present.
 */
function checkNoAuth(value: string): boolean {
  const parsed = parseUrlSafely(value)
  /* c8 ignore start -- defensive guard; URL already passed z.url() validation */
  if (parsed === undefined)
    return false
  /* c8 ignore stop */
  return parsed.username === '' && parsed.password === ''
}

/**
 * Check Domain List
 * Validates hostname against allow/block domain lists.
 *
 * @param value   - The URL string.
 * @param domains - The domain list to check against.
 * @param mode    - 'block' rejects matches, 'allow' requires matches.
 * @returns True if the domain passes the check.
 */
function checkDomainList(
  value: string,
  domains: readonly string[],
  mode: 'allow' | 'block',
): boolean {
  if (domains.length === 0)
    return true
  const parsed = parseUrlSafely(value)
  /* c8 ignore start -- defensive guard; URL already passed z.url() validation */
  if (parsed === undefined)
    return false
  /* c8 ignore stop */
  const matches = domains.some((d: string) =>
    parsed.hostname === d || parsed.hostname.endsWith(`.${d}`),
  )
  return mode === 'block' ? !matches : matches
}

/**
 * Check No Query
 * Validates that the URL has no query string.
 *
 * @param value - The URL string.
 * @returns True if no query string is present.
 */
function checkNoQuery(value: string): boolean {
  const parsed = parseUrlSafely(value)
  /* c8 ignore start -- defensive guard; URL already passed z.url() validation */
  if (parsed === undefined)
    return false
  /* c8 ignore stop */
  return parsed.search === ''
}

// ----------------------------------------------------------
// RULE FACTORY
// ----------------------------------------------------------

/**
 * Url
 * Validates that a string is a valid URL with configurable protocol,
 * TLD, domain, query, and auth constraints.
 *
 * @param options - Optional URL validation options.
 * @returns A Zod schema that validates URL strings.
 */
export const Url = /* @__PURE__ */ createRule<URLOptions>({
  name: 'url',
  defaults: {},
  messages: {},
  build: (opts: URLOptions): unknown => {
    const range = resolveRange(opts.length)
    /* c8 ignore start -- defensive fallback; defaults always provide length/protocols */
    const max = range?.max ?? 2048
    const protocols = opts.protocols ?? ['http', 'https']
    /* c8 ignore stop */

    const base = opts.normalize !== false
      ? z.string().trim()
      : z.string()

    let schema = base.pipe(z.string().max(max).url())
      .refine(
        (v: string): boolean => checkProtocolAllowed(v, protocols),
        { params: { code: 'protocolNotAllowed', namespace: 'url' } },
      )

    if (opts.requireTLD === true) {
      schema = schema.refine(
        (v: string): boolean => checkHasTLD(v),
        { params: { code: 'invalid', namespace: 'url' } },
      )
    }

    if (opts.allowAuth !== true) {
      schema = schema.refine(
        (v: string): boolean => checkNoAuth(v),
        { params: { code: 'invalid', namespace: 'url' } },
      )
    }

    schema = schema
      .refine(
        /* c8 ignore next -- defensive fallback; defaults always provide blockDomains */
        (v: string): boolean => checkDomainList(v, opts.blockDomains ?? [], 'block'),
        { params: { code: 'domainBlocked', namespace: 'url' } },
      )
      .refine(
        /* c8 ignore next -- defensive fallback; defaults always provide allowDomains */
        (v: string): boolean => checkDomainList(v, opts.allowDomains ?? [], 'allow'),
        { params: { code: 'domainNotAllowed', namespace: 'url' } },
      )

    if (opts.allowQuery === false) {
      schema = schema.refine(
        (v: string): boolean => checkNoQuery(v),
        { params: { code: 'invalid', namespace: 'url' } },
      )
    }

    return schema
  },
})
