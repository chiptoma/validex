// ==============================================================================
// WEBSITE RULE
// Validates website URLs with domain filtering, protocol enforcement, and
// automatic protocol prepending for bare domains.
// ==============================================================================

import type { z as zType } from 'zod'

import type { BaseRuleOptions, Range } from '../types'

import { z } from 'zod'

import { createRule } from '@core/createRule'
import { matchesDomainList } from '@internal/domainMatch'
import { URL_FORMAT_CHECK } from '@internal/formatChecks'
import { applyLengthCheck } from '@internal/lengthCheck'
import { resolveRange } from '@internal/resolveRange'

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
 * Check Website Constraints
 * Validates parsed URL against protocol, domain, subdomain, path, and query constraints.
 *
 * @param parsed       - The parsed URL object.
 * @param opts         - The resolved website options.
 * @param ctx          - Zod refinement context for adding issues.
 * @param ns           - Error namespace.
 * @param lbl          - Label for error messages.
 * @param blockDomains - Blocked domain list.
 * @param allowDomains - Allowed domain list.
 */
function checkWebsiteConstraints(
  parsed: URL,
  opts: WebsiteOptions,
  ctx: zType.RefinementCtx,
  ns: string,
  lbl: string | undefined,
  blockDomains: readonly string[],
  allowDomains: readonly string[],
): void {
  const { protocol, hostname, pathname, search } = parsed

  const isHttp = protocol === 'http:' || protocol === 'https:'
  if (!isHttp) {
    ctx.addIssue({ code: 'custom', params: { code: 'invalid', namespace: ns, label: lbl } })
    return
  }
  if (opts.requireHttps === true && protocol !== 'https:') {
    ctx.addIssue({ code: 'custom', params: { code: 'httpsRequired', namespace: ns, label: lbl } })
  }
  if (opts.requireWww === true && !hostname.startsWith('www.')) {
    ctx.addIssue({ code: 'custom', params: { code: 'wwwRequired', namespace: ns, label: lbl } })
  }
  if (blockDomains.length > 0 && matchesDomainList(hostname, blockDomains)) {
    ctx.addIssue({ code: 'custom', params: { code: 'domainBlocked', namespace: ns, domain: hostname, label: lbl } })
  }
  if (allowDomains.length > 0 && !matchesDomainList(hostname, allowDomains)) {
    ctx.addIssue({ code: 'custom', params: { code: 'domainNotAllowed', namespace: ns, domain: hostname, label: lbl } })
  }
  if (opts.allowSubdomains === false && !isBaseDomain(hostname)) {
    ctx.addIssue({ code: 'custom', params: { code: 'subdomainNotAllowed', namespace: ns, label: lbl } })
  }
  if (opts.allowPath === false && pathname !== '/' && pathname !== '') {
    ctx.addIssue({ code: 'custom', params: { code: 'pathNotAllowed', namespace: ns, label: lbl } })
  }
  if (opts.allowQuery !== true && search !== '') {
    ctx.addIssue({ code: 'custom', params: { code: 'queryNotAllowed', namespace: ns, label: lbl } })
  }
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
export const Website = /* @__PURE__ */ createRule<WebsiteOptions>({
  name: 'website',
  defaults: {},
  messages: {},
  build: (opts: WebsiteOptions): unknown => {
    const range = resolveRange(opts.length)
    const max = range?.max ?? 255
    const min = range?.min

    const lbl = opts.label
    const ns = 'website'
    const blockDomains = opts.blockDomains ?? []
    const allowDomains = opts.allowDomains ?? []

    const base = opts.normalize !== false
      ? z.string().transform(normalizeWebsiteInput)
      : z.string()

    return base.pipe(z.string().superRefine((v: string, ctx): void => {
      applyLengthCheck(v, min, max, lbl, ctx)
      if (!URL_FORMAT_CHECK.safeParse(v).success) {
        ctx.addIssue({ code: 'custom', params: { code: 'invalid', namespace: ns, label: lbl } })
        return
      }

      try {
        checkWebsiteConstraints(new URL(v), opts, ctx, ns, lbl, blockDomains, allowDomains)
      }
      /* v8 ignore next -- defensive guard; URL already passed z.url() validation */
      catch { /* URL already validated by z.url() — parse failure unreachable */ }
    }) as z.ZodType<string, string>)
  },
})
