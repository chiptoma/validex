// ==============================================================================
// IBAN RULE
// Validates International Bank Account Numbers with MOD-97 checksum.
// ------------------------------------------------------------------------------
// Supports country-specific length and BBAN format validation via async-loaded
// IBAN patterns. Provides allow/block country filtering.
// ==============================================================================

import type { BaseRuleOptions } from '../types'
import { z } from 'zod'
import { createRule } from '../core/createRule'
import { getIbanPatterns, loadIbanPatterns } from '../loaders/ibanPatterns'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * IbanOptions
 * Configuration options for the IBAN validation rule.
 */
export interface IbanOptions extends BaseRuleOptions {
  /** Only accept IBANs from these country codes. */
  readonly allowCountries?: readonly string[] | undefined
  /** Reject IBANs from these country codes. */
  readonly blockCountries?: readonly string[] | undefined
}

// ----------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------

const IBAN_STRUCTURE_RE = /^[A-Z]{2}\d{2}[A-Z0-9]+$/
const STRIP_SPACES_RE = /\s/g

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Resolve Patterns
 * Returns the IBAN patterns map, loading async if not cached.
 *
 * @returns The ReadonlyMap of country codes to IbanPattern entries.
 */
async function resolvePatterns(): Promise<
  ReadonlyMap<string, { readonly length: number, readonly regex: RegExp }>
> {
  try {
    return getIbanPatterns()
  }
  catch {
    return loadIbanPatterns()
  }
}

/**
 * Mod 97
 * Computes the MOD-97 remainder of a numeric string using iterative
 * modular arithmetic to avoid large-number overflow.
 *
 * @param ibanDigits - A string of digits to compute the remainder for.
 * @returns The MOD-97 remainder.
 */
function mod97(ibanDigits: string): number {
  let remainder = 0

  for (const char of ibanDigits) {
    remainder = (remainder * 10 + Number(char)) % 97
  }

  return remainder
}

/**
 * Validate Mod 97
 * Performs the ISO 7064 MOD-97-10 checksum validation on an IBAN string.
 * Rearranges the IBAN and converts letters to their numeric equivalents.
 *
 * @param iban - The uppercase, space-stripped IBAN string.
 * @returns True if the checksum is valid (remainder === 1).
 */
function validateMod97(iban: string): boolean {
  const rearranged = iban.slice(4) + iban.slice(0, 4)
  let digits = ''

  for (const char of rearranged) {
    if (char >= 'A' && char <= 'Z') {
      digits += String(char.charCodeAt(0) - 55)
    }
    else {
      digits += char
    }
  }

  return mod97(digits) === 1
}

// ----------------------------------------------------------
// RULE FACTORY
// ----------------------------------------------------------

/**
 * IBAN
 * Validates that a string is a valid IBAN with MOD-97 checksum verification.
 * Supports country-specific BBAN format validation and allow/block filtering.
 *
 * @param options - Per-call IBAN validation options.
 * @returns A Zod schema that validates IBAN strings.
 */
export const Iban = /* @__PURE__ */ createRule<IbanOptions>({
  name: 'iban',
  defaults: {},
  messages: {},
  build: (opts: IbanOptions): z.ZodType => {
    const allow = opts.allowCountries ?? []
    const block = opts.blockCountries ?? []

    let schema: z.ZodType = opts.normalize !== false
      ? z.string().transform(
          (v: string): string => v.trim().toUpperCase().replace(STRIP_SPACES_RE, ''),
        )
      : z.string()

    // Structure, country pattern, and MOD-97 validation
    schema = schema.pipe(
      z.string().refine(
        async (v: string): Promise<boolean> => {
          if (!IBAN_STRUCTURE_RE.test(v))
            return false

          const country = v.slice(0, 2)
          const patterns = await resolvePatterns()
          const pattern = patterns.get(country)

          if (pattern === undefined)
            return false
          if (v.length !== pattern.length)
            return false
          if (!pattern.regex.test(v))
            return false

          return validateMod97(v)
        },
        { params: { code: 'invalid', namespace: 'iban' } },
      ),
    )

    // Country allow list
    if (allow.length > 0) {
      schema = schema.pipe(
        z.string().refine(
          (v: string): boolean => allow.includes(v.slice(0, 2)),
          { params: { code: 'countryNotAllowed', namespace: 'iban' } },
        ),
      )
    }

    // Country block list
    if (block.length > 0) {
      schema = schema.pipe(
        z.string().refine(
          (v: string): boolean => !block.includes(v.slice(0, 2)),
          { params: { code: 'countryBlocked', namespace: 'iban' } },
        ),
      )
    }

    return schema
  },
})
