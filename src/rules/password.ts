// ==============================================================================
// PASSWORD RULE
// Validates password strings with composition, length, and consecutive checks.
// ------------------------------------------------------------------------------
// NOTE: normalize is FALSE by default — never change password case.
// ==============================================================================

import type { ResolvedRange } from '../internal/resolveRange'
import type { BaseRuleOptions, Range } from '../types'
import { z } from 'zod'
import { hasDigits, hasLowercase, hasSpecial, hasUppercase } from '../checks/composition'
import { maxConsecutive } from '../checks/limits'
import { createRule } from '../core/createRule'
import { getCommonPasswords, loadCommonPasswords } from '../data/commonPasswords'
import { resolveRange } from '../internal/resolveRange'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * PasswordOptions
 * Configuration options for the password validation rule.
 */
export interface PasswordOptions extends BaseRuleOptions {
  /** Length constraint for the password string. */
  readonly length?: Range | undefined
  /** Required uppercase letter count. */
  readonly uppercase?: Range | undefined
  /** Required lowercase letter count. */
  readonly lowercase?: Range | undefined
  /** Required digit count. */
  readonly digits?: Range | undefined
  /** Required special character count. */
  readonly special?: Range | undefined
  /** Maximum consecutive identical characters. */
  readonly consecutive?: Range | undefined
  /** Block common passwords. */
  readonly blockCommon?: boolean | 'basic' | 'moderate' | 'strict' | undefined
}

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Apply Length
 * Applies min/max length constraints to a string schema.
 *
 * @param schema - The base Zod string schema.
 * @param range  - Resolved length range.
 * @returns The schema with length constraints applied.
 */
function applyLength(
  schema: z.ZodString,
  range: ResolvedRange | undefined,
): z.ZodString {
  if (range === undefined)
    return schema
  let result = schema
  if (range.min !== undefined)
    result = result.min(range.min)
  if (range.max !== undefined)
    result = result.max(range.max)
  return result
}

/**
 * Apply Composition Refine
 * Adds a single .refine() for a composition check (min side).
 *
 * @param schema    - The current Zod schema.
 * @param check     - The composition check function.
 * @param range     - Resolved range for this character class.
 * @param minCode   - Error code for the minimum constraint.
 * @param namespace - Error namespace.
 * @returns The schema with the refine applied.
 */
function applyMinRefine(
  schema: z.ZodType,
  check: (v: string, min: number, max?: number) => boolean,
  range: ResolvedRange | undefined,
  minCode: string,
  namespace: string,
): z.ZodType {
  if (range === undefined)
    return schema
  const min = range.min ?? 0
  if (min <= 0)
    return schema
  return schema.refine(
    (v: unknown): boolean => typeof v === 'string' && check(v, min),
    { params: { code: minCode, namespace, minimum: min } },
  )
}

/**
 * Apply Max Refine
 * Adds a .refine() for the max side of a composition check.
 *
 * @param schema    - The current Zod schema.
 * @param check     - The composition check function.
 * @param range     - Resolved range for this character class.
 * @param maxCode   - Error code for the maximum constraint.
 * @param namespace - Error namespace.
 * @returns The schema with the refine applied.
 */
function applyMaxRefine(
  schema: z.ZodType,
  check: (v: string, min: number, max?: number) => boolean,
  range: ResolvedRange | undefined,
  maxCode: string,
  namespace: string,
): z.ZodType {
  if (range?.max === undefined)
    return schema
  return schema.refine(
    (v: unknown): boolean => typeof v === 'string' && check(v, 0, range.max),
    { params: { code: maxCode, namespace, maximum: range.max } },
  )
}

// ----------------------------------------------------------
// RULE FACTORY
// ----------------------------------------------------------

/**
 * Password
 * Validates that a string meets password strength requirements including
 * length, character composition, and consecutive character limits.
 *
 * @param options - Per-call password validation options.
 * @returns A Zod schema that validates password strings.
 */
export const password = /* @__PURE__ */ createRule<PasswordOptions>({
  name: 'password',
  defaults: {
    length: { min: 8, max: 128 },
    uppercase: { min: 1 },
    lowercase: { min: 1 },
    digits: { min: 1 },
    special: { min: 1 },
    consecutive: { max: 3 },
    blockCommon: false,
    emptyToUndefined: true,
    normalize: false,
  },
  messages: {
    minUppercase: '{{label}} must have at least {{minimum}} uppercase characters',
    minLowercase: '{{label}} must have at least {{minimum}} lowercase characters',
    minDigits: '{{label}} must have at least {{minimum}} digits',
    minSpecial: '{{label}} must have at least {{minimum}} special characters',
    maxUppercase: '{{label}} must have at most {{maximum}} uppercase characters',
    maxConsecutive: '{{label}} must not have more than {{maximum}} consecutive characters',
    commonBlocked: 'This password is too common',
  },
  build: (opts: PasswordOptions): unknown => {
    const ns = 'password'
    let base = z.string()

    if (opts.normalize !== false) {
      base = base.trim()
    }

    base = applyLength(base, resolveRange(opts.length))

    let schema: z.ZodType = base
    const upper = resolveRange(opts.uppercase)
    const lower = resolveRange(opts.lowercase)
    const digit = resolveRange(opts.digits)
    const special = resolveRange(opts.special)
    const consec = resolveRange(opts.consecutive)

    schema = applyMinRefine(schema, hasUppercase, upper, 'minUppercase', ns)
    schema = applyMaxRefine(schema, hasUppercase, upper, 'maxUppercase', ns)
    schema = applyMinRefine(schema, hasLowercase, lower, 'minLowercase', ns)
    schema = applyMinRefine(schema, hasDigits, digit, 'minDigits', ns)
    schema = applyMinRefine(schema, hasSpecial, special, 'minSpecial', ns)

    if (consec?.max !== undefined) {
      const maxVal = consec.max
      schema = schema.refine(
        (v: unknown): boolean => typeof v === 'string' && maxConsecutive(v, maxVal),
        { params: { code: 'maxConsecutive', namespace: ns, maximum: maxVal } },
      )
    }

    if (opts.blockCommon !== false && opts.blockCommon !== undefined) {
      const tier = opts.blockCommon === true || opts.blockCommon === 'basic'
        ? 'basic' as const
        : opts.blockCommon
      schema = schema.refine(
        async (v: unknown): Promise<boolean> => {
          if (typeof v !== 'string')
            return true
          try {
            const passwords = getCommonPasswords(tier)
            return !passwords.has(v.toLowerCase())
          }
          catch {
            const passwords = await loadCommonPasswords(tier)
            return !passwords.has(v.toLowerCase())
          }
        },
        { params: { code: 'commonBlocked', namespace: 'password' } },
      )
    }

    return schema
  },
})
