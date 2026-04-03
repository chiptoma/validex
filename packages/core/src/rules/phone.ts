// ==============================================================================
// PHONE RULE
// Validates international phone numbers with country filtering and formatting.
// ------------------------------------------------------------------------------
// Uses libphonenumber-js for parsing, validation, and output formatting.
// ==============================================================================

import type { CountryCode, PhoneNumber } from 'libphonenumber-js'

import type { BaseRuleOptions } from '../types'
import type { PhoneParser } from '@loaders/phoneParser'

import { z } from 'zod'

import { createRule } from '@core/createRule'
import { loadPhoneParser } from '@loaders/phoneParser'

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
  /** Which metadata bundle libphonenumber-js should use. */
  readonly metadata?: 'min' | 'mobile' | 'max' | 'custom' | undefined
  /** Path to a custom metadata JSON file (used when metadata is 'custom'). */
  readonly customMetadataPath?: string | undefined
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
 * @param parser  - The parser function to use.
 * @returns The parsed PhoneNumber or null.
 */
function tryParsePhone(
  value: string,
  country: string | undefined,
  parser: PhoneParser,
): PhoneNumber | null {
  try {
    // SAFETY: country is a user-provided ISO 3166-1 alpha-2 string; libphonenumber validates internally
    return parser(value, country as CountryCode | undefined)
  }
  catch {
    return null
  }
}

/**
 * Add Phone Issue
 * Adds a custom Zod issue with the phone namespace.
 *
 * @param ctx    - The Zod refinement context.
 * @param code   - The error code to attach.
 * @param label  - Explicit label for error messages.
 * @param extras - Additional params to include in the issue.
 */
function addPhoneIssue(
  ctx: z.RefinementCtx,
  code: string,
  label?: string,
  extras?: Record<string, unknown>,
): void {
  ctx.addIssue({
    code: 'custom',
    params: { code, namespace: 'phone', label, ...extras },
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
  const lbl = opts.label

  if (opts.requireMobile) {
    const phoneType = parsed.getType()
    if (phoneType !== 'MOBILE' && phoneType !== 'FIXED_LINE_OR_MOBILE') {
      addPhoneIssue(ctx, 'requireMobile', lbl)
      return
    }
  }

  const parsedCountry = parsed.country
  /* v8 ignore start -- defensive fallback; defaults always provide allow/block arrays */
  const allow = opts.allowCountries ?? []
  const block = opts.blockCountries ?? []
  /* v8 ignore stop */

  if (allow.length > 0 && (!parsedCountry || !allow.includes(parsedCountry))) {
    addPhoneIssue(ctx, 'countryNotAllowed', lbl, { country: parsedCountry ?? 'unknown' })
    return
  }

  if (block.length > 0 && parsedCountry && block.includes(parsedCountry)) {
    addPhoneIssue(ctx, 'countryBlocked', lbl, { country: parsedCountry })
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
export const Phone = /* @__PURE__ */ createRule<PhoneOptions>({
  name: 'phone',
  defaults: {},
  messages: {},
  build: (opts: PhoneOptions): z.ZodType => {
    const metadata = opts.metadata

    if (opts.requireMobile && (metadata === 'min')) {
      throw new Error(
        'validex: requireMobile: true requires metadata: "mobile" or "max". '
        + 'Min metadata cannot detect mobile numbers reliably.',
      )
    }

    if (metadata === 'custom' && (opts.customMetadataPath === undefined || opts.customMetadataPath === '')) {
      throw new Error('validex: Phone metadata "custom" requires customMetadataPath')
    }

    /* v8 ignore next -- defensive fallback; defaults always provide format */
    const fmt = opts.format ?? 'e164'
    const base = opts.normalize !== false ? z.string().trim() : z.string()

    let cachedParsed: PhoneNumber | undefined

    return base.superRefine(
      async (value: string, ctx): Promise<void> => {
        cachedParsed = undefined

        if (opts.requireCountryCode && !value.startsWith('+')) {
          addPhoneIssue(ctx, 'countryCodeRequired', opts.label)
          return
        }

        const parser = await loadPhoneParser(metadata, opts.customMetadataPath)
        const parsed = tryParsePhone(value, opts.country, parser)
        if (!parsed || !parsed.isValid()) {
          addPhoneIssue(ctx, 'invalid', opts.label)
          return
        }

        cachedParsed = parsed
        validatePhoneConstraints(parsed, opts, ctx)
      },
    ).transform(async (value: string): Promise<string> => {
      if (opts.normalize === false)
        return value
      /* v8 ignore start -- defensive guard; parse already succeeded in superRefine so cachedParsed is always set here */
      if (cachedParsed === undefined)
        return value
      /* v8 ignore stop */
      return formatPhoneNumber(cachedParsed, fmt)
    })
  },
})
