// ==============================================================================
// PASSWORD CONFIRMATION RULE
// Validates the confirmation field of a password pair.
// ------------------------------------------------------------------------------
// NOTE: Cross-field matching is handled by validate() via sameAs metadata.
//       This rule validates the confirmation string itself using Password().
// SPEC DEVIATION (approved): Does not use createRule.
// Reason: 'confirmation' is a reserved namespace that createRule rejects.
// This rule wraps Password() for content validation and registers cross-field
// metadata (sameAs) directly. Three-tier merge applied manually via
// mergeThreeTiers. See CLAUDE.md for approved exception.
// ==============================================================================

import type { z } from 'zod'

import type { BaseRuleOptions } from '../types'
import type { PasswordOptions } from './password'

import { initAugmentation } from '@augmentation'
import { RULE_DEFAULTS } from '@config/defaults'
import { getConfig } from '@config/index'
import { mergeThreeTiers } from '@config/merge'
import { registerCrossField } from '@core/crossFieldRegistry'

import { Password } from './password'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * PasswordConfirmationOptions
 * Configuration for the password confirmation validation rule.
 */
export interface PasswordConfirmationOptions extends BaseRuleOptions {
  /** Name of the password field to match against (used by sameAs). */
  readonly passwordField?: string | undefined
}

// ----------------------------------------------------------
// RULE FACTORY
// ----------------------------------------------------------

/**
 * Password Confirmation
 * Returns a schema that validates the confirmation string using the same
 * base password rule. Cross-field matching (sameAs) is resolved by
 * validate() using the registered metadata.
 *
 * @param options - Per-call options (passwordField controls sameAs target).
 * @returns A Zod schema that validates the confirmation string.
 */
export const PasswordConfirmation = /* @__PURE__ */ (() => {
  return (options?: Partial<PasswordConfirmationOptions>): unknown => {
    initAugmentation()

    /* v8 ignore next 2 -- defensive fallback; RULE_DEFAULTS always has passwordConfirmation key */
    const tier1 = RULE_DEFAULTS['passwordConfirmation'] ?? {}
    const tier2 = getConfig().rules?.passwordConfirmation ?? {}
    // SAFETY: Options are plain objects flowing through three-tier merge
    const merged = mergeThreeTiers(
      tier1,
      tier2,
      (options ?? {}) as Record<string, unknown>,
    ) as PasswordConfirmationOptions

    const passthrough: Record<string, unknown> = {}
    if (merged.label !== undefined)
      passthrough['label'] = merged.label
    if (merged.emptyToUndefined !== undefined)
      passthrough['emptyToUndefined'] = merged.emptyToUndefined
    if (merged.normalize !== undefined)
      passthrough['normalize'] = merged.normalize
    if (merged.customFn !== undefined)
      passthrough['customFn'] = merged.customFn

    // SAFETY: passthrough keys are manually copied from BaseRuleOptions; Password returns a ZodType
    const schema = Password(passthrough as Partial<PasswordOptions>) as z.ZodType

    registerCrossField(schema, {
      sameAs: merged.passwordField ?? 'password',
      label: merged.label,
    })

    return schema
  }
})()
