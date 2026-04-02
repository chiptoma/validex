// ==============================================================================
// URL RULE
// Validates arbitrary URLs with protocol, TLD, domain, and auth constraints.
// ==============================================================================

import type { z as zType } from 'zod'
import type { BaseRuleOptions, Range } from '../types'
import { z } from 'zod'
import { createRule } from '../core/createRule'
import { matchesDomainList } from '../internal/domainMatch'
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
 * Check Url Constraints
 * Validates parsed URL against protocol, TLD, auth, domain, and query constraints.
 *
 * @param parsed       - The parsed URL object.
 * @param opts         - The resolved URL options.
 * @param ctx          - Zod refinement context for adding issues.
 * @param ns           - Error namespace.
 * @param lbl          - Label for error messages.
 * @param protocols    - Allowed protocols list.
 * @param blockDomains - Blocked domain list.
 * @param allowDomains - Allowed domain list.
 */
function checkUrlConstraints(
  parsed: URL,
  opts: URLOptions,
  ctx: zType.RefinementCtx,
  ns: string,
  lbl: string | undefined,
  protocols: readonly string[],
  blockDomains: readonly string[],
  allowDomains: readonly string[],
): void {
  const protocol = parsed.protocol.replace(TRAILING_COLON_RE, '')
  const { hostname } = parsed

  if (protocols.length > 0 && !protocols.includes(protocol)) {
    ctx.addIssue({ code: 'custom', params: { code: 'protocolNotAllowed', namespace: ns, protocol, label: lbl } })
  }
  if (opts.requireTLD === true && !hostname.includes('.')) {
    ctx.addIssue({ code: 'custom', params: { code: 'tldRequired', namespace: ns, label: lbl } })
  }
  if (opts.allowAuth !== true && (parsed.username !== '' || parsed.password !== '')) {
    ctx.addIssue({ code: 'custom', params: { code: 'authNotAllowed', namespace: ns, label: lbl } })
  }
  if (blockDomains.length > 0 && matchesDomainList(hostname, blockDomains)) {
    ctx.addIssue({ code: 'custom', params: { code: 'domainBlocked', namespace: ns, domain: hostname, label: lbl } })
  }
  if (allowDomains.length > 0 && !matchesDomainList(hostname, allowDomains)) {
    ctx.addIssue({ code: 'custom', params: { code: 'domainNotAllowed', namespace: ns, domain: hostname, label: lbl } })
  }
  if (opts.allowQuery === false && parsed.search !== '') {
    ctx.addIssue({ code: 'custom', params: { code: 'queryNotAllowed', namespace: ns, label: lbl } })
  }
}

// ----------------------------------------------------------
// CACHED CHECK SCHEMAS
// ----------------------------------------------------------

const URL_FORMAT_CHECK = z.string().url()

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
    const min = range?.min

    const base = opts.normalize !== false
      ? z.string().trim()
      : z.string()

    const lbl = opts.label
    const ns = 'url'
    const blockDomains = opts.blockDomains ?? []
    const allowDomains = opts.allowDomains ?? []

    return base.pipe(z.string().superRefine((v: string, ctx): void => {
      if (min !== undefined && v.length < min) {
        ctx.addIssue({ code: 'custom', params: { code: 'min', namespace: 'base', label: lbl, minimum: min } })
      }
      if (v.length > max) {
        ctx.addIssue({ code: 'custom', params: { code: 'max', namespace: 'base', label: lbl, maximum: max } })
      }
      if (!URL_FORMAT_CHECK.safeParse(v).success) {
        ctx.addIssue({ code: 'custom', params: { code: 'invalid', namespace: ns, label: lbl } })
        return
      }

      const parsed = parseUrlSafely(v)
      /* c8 ignore next -- defensive guard; URL already passed z.url() validation */
      if (parsed === undefined)
        return

      checkUrlConstraints(parsed, opts, ctx, ns, lbl, protocols, blockDomains, allowDomains)
    }))
  },
})
