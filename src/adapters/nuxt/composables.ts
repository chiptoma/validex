// ==============================================================================
// NUXT COMPOSABLES
// Framework-agnostic validation state container for use in Nuxt composables.
// ------------------------------------------------------------------------------
// NOTE: This module does not import Vue reactivity APIs. The state container
//       pattern allows wrapping in Vue refs when used inside a Nuxt context.
// ==============================================================================

import type { z } from 'zod'
import type { ValidationResult } from '../../types'
import { validate } from '../../core/validate'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * ValidationState
 * State container returned by useValidation. Provides getter methods
 * for current state, keeping the implementation framework-agnostic.
 *
 * @template T - The inferred output type of the Zod schema.
 */
export interface ValidationState<T> {
  /** Run validation against the schema and update internal state. */
  readonly validate: (data: unknown) => Promise<ValidationResult<T>>
  /** Reset all errors and restore isValid to true. */
  readonly clearErrors: () => void
  /** Get the current flat error map (dot-path to message arrays). */
  readonly getErrors: () => Readonly<Record<string, readonly string[]>>
  /** Get the current first-error map (dot-path to first message). */
  readonly getFirstErrors: () => Readonly<Record<string, string>>
  /** Get the current validity flag. */
  readonly getIsValid: () => boolean
  /** Get the last successful parse result, if any. */
  readonly getData: () => T | undefined
}

// ----------------------------------------------------------
// COMPOSABLE
// ----------------------------------------------------------

/**
 * Use Validation
 * Creates a validation state container bound to a Zod schema.
 * Manages errors, first-errors, validity, and parsed data via closures.
 *
 * @template S - The Zod schema type.
 * @param schema - The Zod schema to validate against.
 * @returns A ValidationState instance with getter methods and actions.
 */
export function useValidation<S extends z.ZodType>(
  schema: S,
): ValidationState<z.output<S>> {
  let errors: Record<string, readonly string[]> = {}
  let firstErrors: Record<string, string> = {}
  let isValid = true
  let data: z.output<S> | undefined

  /**
   * Run Validation
   * Validates input against the bound schema and updates internal state.
   *
   * @param input - The data to validate.
   * @returns The structured validation result.
   */
  async function runValidation(
    input: unknown,
  ): Promise<ValidationResult<z.output<S>>> {
    const result = await validate(schema, input)

    errors = result.errors
    firstErrors = result.firstErrors
    isValid = result.success
    data = result.data

    return result
  }

  /**
   * Clear Errors
   * Resets all error state and restores validity to true.
   */
  function clearErrors(): void {
    errors = {}
    firstErrors = {}
    isValid = true
    data = undefined
  }

  return {
    validate: runValidation,
    clearErrors,
    getErrors: () => errors,
    getFirstErrors: () => firstErrors,
    getIsValid: () => isValid,
    getData: () => data,
  }
}
