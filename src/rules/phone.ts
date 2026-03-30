// ==============================================================================
// PHONE RULE
// Validates international phone numbers with country filtering and formatting.
// ------------------------------------------------------------------------------
// Uses libphonenumber-js for parsing, validation, and output formatting.
// ==============================================================================

import type { CountryCode, PhoneNumber } from 'libphonenumber-js'
import type { BaseRuleOptions } from '../types'
import { parsePhoneNumberWithError } from 'libphonenumber-js'
import { z } from 'zod'
import { createRule } from '../core/createRule'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * PhoneOptions
 * Configuration options for the phone number validation rule.
 */
export interface PhoneOptions extends BaseRuleOptions {
  /** Default country code for parsing (ISO 3166-1 alpha-2). */
  readonly country?: string | undefined
  /** Restrict to only these country codes. */
  readonly allowCountries?: readonly string[] | undefined
  /** Block these country codes. */
  readonly blockCountries?: readonly string[] | undefined
  /** Require a mobile phone number. */
  readonly requireMobile?: boolean | undefined
  /** Require the input to start with '+' (country code prefix). */
  readonly requireCountryCode?: boolean | undefined
  /** Output format for the normalized phone number. */
  readonly format?: 'e164' | 'international' | 'national' | undefined
}

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Format Phone Number
 * Formats a parsed phone number according to the specified format.
 *
 * @param parsed - The parsed PhoneNumber instance.
 * @param fmt    - The desired output format.
 * @returns The formatted phone number string.
 */
function formatPhoneNumber(
  parsed: PhoneNumber,
  fmt: 'e164' | 'international' | 'national',
): string {
  switch (fmt) {
    case 'e164': return parsed.format('E.164')
    case 'international': return parsed.format('INTERNATIONAL')
    case 'national': return parsed.format('NATIONAL')
  }
}

/**
 * Try Parse Phone
 * Attempts to parse a phone number string, returning null on failure.
 *
 * @param value   - The raw phone string.
 * @param country - Optional default country code.
 * @returns The parsed PhoneNumber or null.
 */
function tryParsePhone(
  value: string,
  country: string | undefined,
): PhoneNumber | null {
  try {
    return parsePhoneNumberWithError(value, country as CountryCode | undefined)
  }
  catch {
    return null
  }
}

/**
 * Add Phone Issue
 * Adds a custom Zod issue with the phone namespace.
 *
 * @param ctx  - The Zod refinement context.
 * @param code - The error code to attach.
 */
function addPhoneIssue(
  ctx: z.RefinementCtx,
  code: string,
): void {
  ctx.addIssue({
    code: 'custom',
    params: { code, namespace: 'phone' },
  })
}

/**
 * Validate Phone Constraints
 * Checks mobile, allow, and block constraints on a parsed phone number.
 *
 * @param parsed - The parsed PhoneNumber.
 * @param opts   - The resolved phone options.
 * @param ctx    - The Zod refinement context.
 */
function validatePhoneConstraints(
  parsed: PhoneNumber,
  opts: PhoneOptions,
  ctx: z.RefinementCtx,
): void {
  if (opts.requireMobile) {
    const phoneType = parsed.getType()
    if (phoneType !== 'MOBILE' && phoneType !== 'FIXED_LINE_OR_MOBILE') {
      addPhoneIssue(ctx, 'requireMobile')
      return
    }
  }

  const parsedCountry = parsed.country
  /* v8 ignore start -- defensive fallback; defaults always provide allow/block arrays */
  const allow = opts.allowCountries ?? []
  const block = opts.blockCountries ?? []
  /* v8 ignore stop */

  if (allow.length > 0 && (!parsedCountry || !allow.includes(parsedCountry))) {
    addPhoneIssue(ctx, 'countryNotAllowed')
    return
  }

  if (block.length > 0 && parsedCountry && block.includes(parsedCountry)) {
    addPhoneIssue(ctx, 'countryBlocked')
  }
}

// ----------------------------------------------------------
// RULE FACTORY
// ----------------------------------------------------------

/**
 * Phone
 * Validates that a string is a valid phone number. Supports country
 * filtering, mobile requirement, and output format normalization.
 *
 * @param options - Per-call phone validation options.
 * @returns A Zod schema that validates phone number strings.
 */
export const phone = /* @__PURE__ */ createRule<PhoneOptions>({
  name: 'phone',
  defaults: {
    allowCountries: [],
    blockCountries: [],
    requireMobile: false,
    requireCountryCode: false,
    format: 'e164',
    emptyToUndefined: true,
    normalize: true,
  },
  messages: {
    invalid: '{{label}} is not a valid phone number',
    requireMobile: 'A mobile phone number is required',
    countryBlocked: 'Phone numbers from this country are not allowed',
    countryNotAllowed:
      'Phone numbers from this country are not in the allowed list',
  },
  build: (opts: PhoneOptions): z.ZodType => {
    /* v8 ignore next -- defensive fallback; defaults always provide format */
    const fmt = opts.format ?? 'e164'

    return z.string().trim().superRefine(
      (value: string, ctx): void => {
        if (opts.requireCountryCode && !value.startsWith('+')) {
          addPhoneIssue(ctx, 'invalid')
          return
        }

        const parsed = tryParsePhone(value, opts.country)
        if (!parsed || !parsed.isValid()) {
          addPhoneIssue(ctx, 'invalid')
          return
        }

        validatePhoneConstraints(parsed, opts, ctx)
      },
    ).transform((value: string): string => {
      if (opts.normalize === false)
        return value
      const parsed = tryParsePhone(value, opts.country)
      /* v8 ignore start -- defensive guard; parse already succeeded in superRefine so parsed is always valid here */
      if (!parsed)
        return value
      /* v8 ignore stop */
      return formatPhoneNumber(parsed, fmt)
    })
  },
})
