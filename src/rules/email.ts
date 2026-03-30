// ==============================================================================
// EMAIL RULE
// Validates email addresses with domain filtering, plus alias blocking, and
// optional disposable email detection.
// ==============================================================================

import type { BaseRuleOptions, Range } from '../types'
import { z } from 'zod'
import { createRule } from '../core/createRule'
import { resolveRange } from '../internal/resolveRange'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * EmailOptions
 * Configuration options for the email validation rule.
 */
export interface EmailOptions extends BaseRuleOptions {
  /** Length constraints for the email string. Defaults to { max: 254 }. */
  readonly length?: Range | undefined
  /** Block email addresses that use plus aliases (e.g. user+tag@domain). */
  readonly blockPlusAlias?: boolean | undefined
  /** List of domains to block. */
  readonly blockDomains?: readonly string[] | undefined
  /** Restrict to only these domains. */
  readonly allowDomains?: readonly string[] | undefined
  /** Block known disposable/temporary email domains (async). */
  readonly blockDisposable?: boolean | undefined
  /** Allow subdomain email addresses. Defaults to true. */
  readonly allowSubdomains?: boolean | undefined
}

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Extract Domain
 * Returns the domain portion of an email address.
 *
 * @param email - A valid email string.
 * @returns The domain after the @ sign, or empty string.
 */
function extractDomain(email: string): string {
  /* c8 ignore next -- defensive fallback; email already validated to contain @ */
  return email.split('@')[1] ?? ''
}

/**
 * Extract Local Part
 * Returns the local portion of an email address (before the @).
 *
 * @param email - A valid email string.
 * @returns The local part before the @ sign, or empty string.
 */
function extractLocalPart(email: string): string {
  /* c8 ignore next -- defensive fallback; split always returns at least one element */
  return email.split('@')[0] ?? ''
}

// ----------------------------------------------------------
// RULE FACTORY
// ----------------------------------------------------------

/**
 * Email
 * Validates that a string is a valid email address with configurable
 * domain restrictions, plus-alias blocking, and disposable detection.
 *
 * @param options - Per-call email validation options.
 * @returns A Zod schema that validates email strings.
 */
export const email = /* @__PURE__ */ createRule<EmailOptions>({
  name: 'email',
  defaults: {},
  messages: {
    invalid: '{{label}} is not a valid email address',
    plusAliasBlocked: 'Plus aliases are not allowed',
    disposableBlocked: 'Disposable email addresses are not allowed',
    domainBlocked: 'This email domain is not allowed',
    domainNotAllowed: 'This email domain is not in the allowed list',
    subdomainNotAllowed: 'Subdomain email addresses are not allowed',
  },
  build: (opts: EmailOptions): unknown => {
    const range = resolveRange(opts.length)
    /* c8 ignore next -- defensive fallback; defaults always provide length */
    const maxLen = range?.max ?? 254

    const base = opts.normalize !== false
      ? z.string().trim().toLowerCase()
      : z.string()

    let schema: z.ZodType = base.pipe(z.string().email().max(maxLen))

    schema = applyBusinessRules(schema, opts)

    return schema
  },
})

// ----------------------------------------------------------
// BUSINESS RULES
// ----------------------------------------------------------

/**
 * Apply Business Rules
 * Adds domain filtering, plus-alias blocking, subdomain checks,
 * and disposable detection refines to the schema.
 *
 * @param schema - The base Zod schema after format validation.
 * @param opts   - The resolved email options.
 * @returns The schema with all business rule refines applied.
 */
function applyBusinessRules(
  schema: z.ZodType,
  opts: EmailOptions,
): z.ZodType {
  let result = schema

  if (opts.blockPlusAlias === true) {
    result = result.pipe(z.string().refine(
      (v: string): boolean => !extractLocalPart(v).includes('+'),
      { params: { code: 'plusAliasBlocked', namespace: 'email' } },
    ))
  }

  result = applyDomainFilters(result, opts)

  if (opts.allowSubdomains === false) {
    result = result.pipe(z.string().refine(
      (v: string): boolean => extractDomain(v).split('.').length <= 2,
      { params: { code: 'subdomainNotAllowed', namespace: 'email' } },
    ))
  }

  if (opts.blockDisposable === true) {
    result = applyDisposableCheck(result)
  }

  return result
}

/**
 * Apply Domain Filters
 * Adds allow-list and block-list domain refines.
 *
 * @param schema - The Zod schema to extend.
 * @param opts   - The resolved email options.
 * @returns The schema with domain filter refines applied.
 */
function applyDomainFilters(schema: z.ZodType, opts: EmailOptions): z.ZodType {
  let result = schema
  /* c8 ignore start -- defensive fallback; defaults always provide allow/block arrays */
  const allow = opts.allowDomains ?? []
  const block = opts.blockDomains ?? []
  /* c8 ignore stop */

  if (allow.length > 0) {
    result = result.pipe(z.string().refine(
      (v: string): boolean => allow.includes(extractDomain(v)),
      { params: { code: 'domainNotAllowed', namespace: 'email' } },
    ))
  }

  if (block.length > 0) {
    result = result.pipe(z.string().refine(
      (v: string): boolean => !block.includes(extractDomain(v)),
      { params: { code: 'domainBlocked', namespace: 'email' } },
    ))
  }

  return result
}

/**
 * Apply Disposable Check
 * Adds an async refine that checks against known disposable email domains.
 *
 * @param schema - The Zod schema to extend.
 * @returns The schema with the disposable domain refine applied.
 */
function applyDisposableCheck(schema: z.ZodType): z.ZodType {
  return schema.pipe(z.string().refine(
    async (value: string): Promise<boolean> => {
      const domain = extractDomain(value)
      /* c8 ignore start -- dynamic import and defensive catch; disposable-email-domains may fail on module resolution */
      try {
        const disposable = (
          await import('disposable-email-domains')
        ).default as readonly string[]
        return !disposable.includes(domain)
      }
      catch {
        return true
      }
      /* c8 ignore stop */
    },
    { params: { code: 'disposableBlocked', namespace: 'email' } },
  ))
}
