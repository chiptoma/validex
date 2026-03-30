// ==============================================================================
// PASSWORD CONFIRMATION RULE
// Validates the confirmation field of a password pair.
// ------------------------------------------------------------------------------
// NOTE: Cross-field matching is handled at the object/recipe level via sameAs.
//       This rule only validates the confirmation string itself.
// ==============================================================================

import type { z } from 'zod'
import type { BaseRuleOptions } from '../types'
import type { PasswordOptions } from './password'
import { registerMessages } from '../core/errorMap'
import { password } from './password'

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
// MESSAGE REGISTRATION
// ----------------------------------------------------------

registerMessages('confirmation', {
  mismatch: 'Passwords must match',
})

// ----------------------------------------------------------
// RULE FACTORY
// ----------------------------------------------------------

/**
 * Password Confirmation
 * Returns a schema that validates the confirmation string using the same
 * base password rule. Cross-field matching (sameAs) is applied at the
 * object/recipe level, not here.
 *
 * @param options - Per-call options (passwordField is metadata for recipes).
 * @returns A Zod schema that validates the confirmation string.
 */
export function passwordConfirmation(
  options?: Partial<PasswordConfirmationOptions>,
): unknown {
  const _field = options?.passwordField ?? 'password'
  const passthrough: Record<string, unknown> = {}
  if (options?.label !== undefined)
    passthrough['label'] = options.label
  if (options?.emptyToUndefined !== undefined)
    passthrough['emptyToUndefined'] = options.emptyToUndefined
  if (options?.normalize !== undefined)
    passthrough['normalize'] = options.normalize
  if (options?.customFn !== undefined)
    passthrough['customFn'] = options.customFn
  return password(passthrough as Partial<PasswordOptions>) as z.ZodType
}
