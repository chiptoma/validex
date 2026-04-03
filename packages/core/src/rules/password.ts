// ==============================================================================
// PASSWORD RULE
// Validates password strings with composition, length, and consecutive checks.
// ------------------------------------------------------------------------------
// Context: normalize trims whitespace but never changes case.
// ==============================================================================

import type { BaseRuleOptions, Range } from '../types'
import type { ResolvedRange } from '@internal/resolveRange'

import { z } from 'zod'

import { createRule } from '@core/createRule'
import { applyLengthCheck } from '@internal/lengthCheck'
import { resolveRange } from '@internal/resolveRange'
import { getCommonPasswords, loadCommonPasswords } from '@loaders/commonPasswords'

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
 * @param label  - Explicit label for error messages.
 * @returns The schema with length constraints applied.
 */
function applyLength(
  schema: z.ZodString,
  range: ResolvedRange | undefined,
  label?: string,
): z.ZodType {
  /* v8 ignore start -- defensive guard; defaults always provide length range */
  if (range === undefined)
    return schema
  /* v8 ignore stop */
  const min = range.min
  const max = range.max
  return schema.superRefine((v: string, ctx): void => {
    applyLengthCheck(v, min, max, label, ctx)
  })
}

/**
 * Apply Block Common
 * Adds an async refine that rejects common passwords.
 *
 * @param schema      - The current Zod schema.
 * @param blockCommon - The tier or boolean flag.
 * @param label       - Explicit label for error messages.
 * @returns The schema with the common-password refine applied.
 */
function applyBlockCommon(
  schema: z.ZodType,
  blockCommon: true | 'basic' | 'moderate' | 'strict',
  label?: string,
): z.ZodType {
  const tier = blockCommon === true || blockCommon === 'basic'
    ? 'basic' as const
    : blockCommon
  return schema.refine(
    async (v: unknown): Promise<boolean> => {
      /* v8 ignore start -- defensive type guard; schema is z.string() so v is always string */
      if (typeof v !== 'string')
        return true
      /* v8 ignore stop */
      try {
        const passwords = getCommonPasswords(tier)
        return !passwords.has(v.toLowerCase())
      }
      catch {
        const passwords = await loadCommonPasswords(tier)
        return !passwords.has(v.toLowerCase())
      }
    },
    { params: { code: 'commonBlocked', namespace: 'password', label } },
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
export const Password = /* @__PURE__ */ createRule<PasswordOptions>({
  name: 'password',
  defaults: {},
  messages: {},
  build: (opts: PasswordOptions): unknown => {
    const ns = 'password'
    let base = z.string()

    if (opts.normalize !== false) {
      base = base.trim()
    }

    let schema: z.ZodType = applyLength(base, resolveRange(opts.length), opts.label)
    const upper = resolveRange(opts.uppercase)
    const lower = resolveRange(opts.lowercase)
    const digit = resolveRange(opts.digits)
    const special = resolveRange(opts.special)
    const consec = resolveRange(opts.consecutive)
    const lbl = opts.label

    if (upper !== undefined && ((upper.min !== undefined && upper.min > 0) || upper.max !== undefined)) {
      schema = schema.hasUppercase({ min: upper.min ?? 0, max: upper.max, namespace: ns, label: lbl })
    }
    if (lower !== undefined && ((lower.min !== undefined && lower.min > 0) || lower.max !== undefined)) {
      schema = schema.hasLowercase({ min: lower.min ?? 0, max: lower.max, namespace: ns, label: lbl })
    }
    if (digit !== undefined && ((digit.min !== undefined && digit.min > 0) || digit.max !== undefined)) {
      schema = schema.hasDigits({ min: digit.min ?? 0, max: digit.max, namespace: ns, label: lbl })
    }
    if (special !== undefined && ((special.min !== undefined && special.min > 0) || special.max !== undefined)) {
      schema = schema.hasSpecial({ min: special.min ?? 0, max: special.max, namespace: ns, label: lbl })
    }

    if (consec?.max !== undefined) {
      schema = schema.maxConsecutive({ max: consec.max, namespace: ns, label: lbl })
    }

    if (opts.blockCommon !== false && opts.blockCommon !== undefined) {
      schema = applyBlockCommon(schema, opts.blockCommon, opts.label)
    }

    return schema
  },
})
