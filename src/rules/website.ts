// ==============================================================================
// WEBSITE RULE
// Validates website URLs with domain filtering, protocol enforcement, and
// automatic protocol prepending for bare domains.
// ==============================================================================

import type { BaseRuleOptions, Range } from '../types'
import { z } from 'zod'
import { createRule } from '../core/createRule'
import { resolveRange } from '../internal/resolveRange'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * WebsiteOptions
 * Configuration options for the website validation rule.
 */
export interface WebsiteOptions extends BaseRuleOptions {
  /** Length constraints for the full URL. Defaults to { max: 255 }. */
  readonly length?: Range | undefined
  /** Require the hostname to start with 'www.'. */
  readonly requireWww?: boolean | undefined
  /** Require https protocol (reject http). */
  readonly requireHttps?: boolean | undefined
  /** Whitelist of allowed domains. Empty means allow all. */
  readonly allowDomains?: readonly string[] | undefined
  /** Blacklist of blocked domains. */
  readonly blockDomains?: readonly string[] | undefined
  /** Allow subdomain URLs. Defaults to true. */
  readonly allowSubdomains?: boolean | undefined
  /** Allow URL paths beyond '/'. Defaults to true. */
  readonly allowPath?: boolean | undefined
  /** Allow query strings. Defaults to false. */
  readonly allowQuery?: boolean | undefined
}

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

const PROTOCOL_PREFIX_RE = /^[a-z][a-z\d+\-.]*:/i

/**
 * Normalize Website Input
 * Trims, lowercases, and auto-prepends https:// to bare domains.
 *
 * @param value - Raw input string.
 * @returns Normalized URL string.
 */
function normalizeWebsiteInput(value: string): string {
  const normalized = value.trim().toLowerCase()
  if (PROTOCOL_PREFIX_RE.test(normalized))
    return normalized
  return `https://${normalized}`
}

/**
 * Extract Hostname
 * Safely extracts the hostname from a URL string.
 *
 * @param value - A valid URL string.
 * @returns The hostname, or an empty string on parse failure.
 */
function extractHostname(value: string): string {
  try {
    return new URL(value).hostname
  }
  catch {
    return ''
  }
}

/**
 * Is Base Domain
 * Checks whether a hostname has no subdomains (ignoring 'www.' prefix).
 *
 * @param hostname - The hostname to check.
 * @returns True if the hostname has no extra subdomains.
 */
function isBaseDomain(hostname: string): boolean {
  const stripped = hostname.startsWith('www.')
    ? hostname.slice(4)
    : hostname
  return stripped.split('.').length <= 2
}

/**
 * Check Protocol
 * Validates that the URL uses http/https and respects requireHttps.
 *
 * @param value       - The URL string.
 * @param requireHttps - Whether to enforce https-only.
 * @returns True if protocol is valid.
 */
function checkProtocol(value: string, requireHttps: boolean): boolean {
  try {
    const { protocol } = new URL(value)
    if (protocol !== 'http:' && protocol !== 'https:')
      return false
    if (requireHttps && protocol !== 'https:')
      return false
    return true
  }
  catch { return false }
}

/**
 * Check Domain Lists
 * Validates hostname against allow/block domain lists.
 *
 * @param hostname - The extracted hostname.
 * @param domains  - The domain list to check against.
 * @param mode     - 'block' rejects matches, 'allow' requires matches.
 * @returns True if the domain passes the check.
 */
function checkDomainList(
  hostname: string,
  domains: readonly string[],
  mode: 'allow' | 'block',
): boolean {
  if (domains.length === 0)
    return true
  const matches = domains.some((d: string) =>
    hostname === d || hostname.endsWith(`.${d}`),
  )
  return mode === 'block' ? !matches : matches
}

/**
 * Check Path Restriction
 * Validates that URL has no path when paths are disallowed.
 *
 * @param value - The URL string.
 * @returns True if path is '/' or empty.
 */
function hasNoPath(value: string): boolean {
  try {
    const { pathname } = new URL(value)
    return pathname === '/' || pathname === ''
  }
  catch { return false }
}

/**
 * Check Query Restriction
 * Validates that URL has no query string when queries are disallowed.
 *
 * @param value - The URL string.
 * @returns True if no query string is present.
 */
function hasNoQuery(value: string): boolean {
  try {
    return new URL(value).search === ''
  }
  catch { return false }
}

// ----------------------------------------------------------
// RULE FACTORY
// ----------------------------------------------------------

/**
 * Website
 * Validates that a string is a valid website URL. Auto-prepends https://
 * to bare domains, enforces protocol/domain/path constraints.
 *
 * @param options - Optional website validation options.
 * @returns A Zod schema that validates website URLs.
 */
export const website = /* @__PURE__ */ createRule<WebsiteOptions>({
  name: 'website',
  defaults: {},
  messages: {
    invalid: '{{label}} is not a valid website URL',
    domainBlocked: 'This website domain is not allowed',
    domainNotAllowed: 'This website domain is not in the allowed list',
    subdomainNotAllowed: 'Subdomain URLs are not allowed',
  },
  build: (opts: WebsiteOptions): unknown => {
    const range = resolveRange(opts.length)
    const max = range?.max ?? 255

    let schema = z.string()
      .transform(normalizeWebsiteInput)
      .pipe(z.string().max(max).url())
      .refine(
        (v: string): boolean => checkProtocol(v, opts.requireHttps === true),
        { params: { code: 'invalid', namespace: 'website' } },
      )

    if (opts.requireWww === true) {
      schema = schema.refine(
        (v: string): boolean => extractHostname(v).startsWith('www.'),
        { params: { code: 'invalid', namespace: 'website' } },
      )
    }

    schema = schema
      .refine(
        (v: string): boolean => checkDomainList(extractHostname(v), opts.blockDomains ?? [], 'block'),
        { params: { code: 'domainBlocked', namespace: 'website' } },
      )
      .refine(
        (v: string): boolean => checkDomainList(extractHostname(v), opts.allowDomains ?? [], 'allow'),
        { params: { code: 'domainNotAllowed', namespace: 'website' } },
      )

    if (opts.allowSubdomains === false) {
      schema = schema.refine(
        (v: string): boolean => isBaseDomain(extractHostname(v)),
        { params: { code: 'subdomainNotAllowed', namespace: 'website' } },
      )
    }

    if (opts.allowPath === false) {
      schema = schema.refine(
        (v: string): boolean => hasNoPath(v),
        { params: { code: 'invalid', namespace: 'website' } },
      )
    }

    if (opts.allowQuery !== true) {
      schema = schema.refine(
        (v: string): boolean => hasNoQuery(v),
        { params: { code: 'invalid', namespace: 'website' } },
      )
    }

    return schema
  },
})
