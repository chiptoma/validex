// ==============================================================================
// CREDIT CARD RULE
// Validates credit card numbers with Luhn checksum and issuer detection.
// ------------------------------------------------------------------------------
// Supports issuer filtering via allow/block lists. Normalizes formatted input
// by stripping spaces and dashes before validation.
// ==============================================================================

import type { BaseRuleOptions } from '../types'

import { z } from 'zod'

import { createRule } from '@core/createRule'
import {
  getCreditCardPrefixes,
  loadCreditCardPrefixes,
} from '@loaders/creditCardPrefixes'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/** IssuerType -- supported card network identifiers. */
type IssuerType
  = | 'visa'
    | 'mastercard'
    | 'amex'
    | 'discover'
    | 'diners'
    | 'jcb'
    | 'unionpay'

/**
 * CreditCardOptions
 * Configuration options for the credit card validation rule.
 */
export interface CreditCardOptions extends BaseRuleOptions {
  /** Only accept cards from these issuers. */
  readonly allowIssuers?: readonly IssuerType[] | undefined
  /** Reject cards from these issuers. */
  readonly blockIssuers?: readonly IssuerType[] | undefined
}

// ----------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------

const DIGITS_ONLY_RE = /^\d+$/
const STRIP_RE = /[\s-]/g
const MIN_LENGTH = 13
const MAX_LENGTH = 19

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Resolve Prefixes
 * Returns the credit card prefixes map, loading async if not cached.
 *
 * @returns The ReadonlyMap of issuer keys to CardIssuer entries.
 */
async function resolvePrefixes(): Promise<
  ReadonlyMap<string, { readonly prefixes: readonly string[], readonly lengths: readonly number[] }>
> {
  try {
    return getCreditCardPrefixes()
  }
  catch {
    return loadCreditCardPrefixes()
  }
}

/**
 * Luhn Check
 * Validates a digit string using the Luhn algorithm.
 *
 * @param digits - A string of digits to validate.
 * @returns True if the checksum is valid.
 */
function luhnCheck(digits: string): boolean {
  let sum = 0
  let alternate = false

  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i])

    if (alternate) {
      n *= 2
      if (n > 9)
        n -= 9
    }

    sum += n
    alternate = !alternate
  }

  return sum % 10 === 0
}

/**
 * Match Prefix
 * Checks if a card number matches a single prefix entry.
 * Handles both exact prefixes ("4") and range prefixes ("2221-2720").
 *
 * @param cardNumber - The card number string.
 * @param prefix     - The prefix entry (exact or range).
 * @returns True if the card number matches the prefix.
 */
function matchPrefix(cardNumber: string, prefix: string): boolean {
  if (prefix.includes('-')) {
    const parts = prefix.split('-')
    const low = parts[0]
    const high = parts[1]
    /* c8 ignore next 2 -- defensive guard; split('-') on a string containing '-' always yields two parts */
    if (low === undefined || high === undefined)
      return false
    const cardPrefix = Number(cardNumber.slice(0, low.length))
    return cardPrefix >= Number(low) && cardPrefix <= Number(high)
  }
  return cardNumber.startsWith(prefix)
}

/**
 * Detect Issuer
 * Identifies the card issuer by matching against known prefixes.
 *
 * @param cardNumber - The card number string (digits only).
 * @param prefixes   - The loaded prefixes map.
 * @returns The issuer key or undefined if unknown.
 */
function detectIssuer(
  cardNumber: string,
  prefixes: ReadonlyMap<string, { readonly prefixes: readonly string[] }>,
): string | undefined {
  for (const [issuer, data] of prefixes) {
    for (const prefix of data.prefixes) {
      if (matchPrefix(cardNumber, prefix))
        return issuer
    }
  }
  return undefined
}

// ----------------------------------------------------------
// RULE FACTORY
// ----------------------------------------------------------

/**
 * Credit Card
 * Validates that a string is a valid credit card number using the Luhn
 * algorithm with optional issuer filtering. Strips spaces and dashes
 * from formatted input by default.
 *
 * @param options - Per-call credit card validation options.
 * @returns A Zod schema that validates credit card number strings.
 */
export const CreditCard = /* @__PURE__ */ createRule<CreditCardOptions>({
  name: 'creditCard',
  defaults: {},
  messages: {},
  build: (opts: CreditCardOptions): z.ZodType => {
    const allow = opts.allowIssuers ?? []
    const block = opts.blockIssuers ?? []

    let schema: z.ZodType = opts.normalize !== false
      ? z.string().transform((v: string): string => v.trim().replace(STRIP_RE, ''))
      : z.string()

    // Validate format and Luhn
    schema = schema.pipe(
      z.string().refine(
        (v: string): boolean => {
          if (!DIGITS_ONLY_RE.test(v))
            return false
          if (v.length < MIN_LENGTH || v.length > MAX_LENGTH)
            return false
          return luhnCheck(v)
        },
        { params: { code: 'invalid', namespace: 'creditCard', label: opts.label } },
      ),
    )

    // Issuer allow list
    if (allow.length > 0) {
      schema = schema.pipe(
        z.string().superRefine(async (v: string, ctx): Promise<void> => {
          const prefixes = await resolvePrefixes()
          const issuer = detectIssuer(v, prefixes)
          // SAFETY: detectIssuer returns keys from the prefixes map which are IssuerType values
          if (issuer === undefined || !allow.includes(issuer as IssuerType)) {
            ctx.addIssue({
              code: 'custom',
              params: { code: 'issuerNotAllowed', namespace: 'creditCard', issuer: issuer ?? 'unknown', label: opts.label },
            })
          }
        }),
      )
    }

    // Issuer block list
    if (block.length > 0) {
      schema = schema.pipe(
        z.string().superRefine(async (v: string, ctx): Promise<void> => {
          const prefixes = await resolvePrefixes()
          const issuer = detectIssuer(v, prefixes)
          // SAFETY: detectIssuer returns keys from the prefixes map which are IssuerType values
          if (issuer !== undefined && block.includes(issuer as IssuerType)) {
            ctx.addIssue({
              code: 'custom',
              params: { code: 'issuerBlocked', namespace: 'creditCard', issuer, label: opts.label },
            })
          }
        }),
      )
    }

    return schema
  },
})

export type { IssuerType }
