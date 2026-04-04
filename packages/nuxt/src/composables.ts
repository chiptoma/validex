// ==============================================================================
// NUXT COMPOSABLES
// Reactive validation state for Nuxt/Vue components using Vue refs.
// ------------------------------------------------------------------------------
// NOTE: Returns Vue refs that trigger template re-renders automatically.
//       Uses shallowRef to avoid deep unwrapping of Zod output types.
// ==============================================================================

import type { ValidationResult } from '@validex/core'
import type { ShallowRef } from 'vue'
import type { z } from 'zod'

import { validate as coreValidate } from '@validex/core'
import { shallowRef } from 'vue'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * ValidationState
 * Reactive validation state returned by useValidation.
 * All state properties are Vue shallow refs that trigger re-renders
 * when replaced. Uses shallowRef to preserve Zod output types without
 * deep reactive unwrapping.
 *
 * @template T - The inferred output type of the Zod schema.
 */
export interface ValidationState<T> {
  /** Run validation against the schema and update reactive state. */
  readonly validate: (data: unknown) => Promise<ValidationResult<T>>
  /** Reset all errors and restore isValid to true. */
  readonly clearErrors: () => void
  /** Reactive flat error map (dot-path to message arrays). */
  readonly errors: Readonly<ShallowRef<Record<string, readonly string[]>>>
  /** Reactive first-error map (dot-path to first message). */
  readonly firstErrors: Readonly<ShallowRef<Record<string, string>>>
  /** Reactive validity flag. */
  readonly isValid: Readonly<ShallowRef<boolean>>
  /** Reactive last successful parse result, if any. */
  readonly data: Readonly<ShallowRef<T | undefined>>
}

// ----------------------------------------------------------
// COMPOSABLE
// ----------------------------------------------------------

/**
 * Use Validation
 * Creates a reactive validation state bound to a Zod schema.
 * Returns Vue shallow refs that automatically trigger template
 * re-renders when validation state changes.
 *
 * @param schema - The Zod schema to validate against.
 * @returns Reactive validation state with refs and actions.
 */
export function useValidation<S extends z.ZodType>(
  schema: S,
): ValidationState<z.output<S>> {
  const errors = shallowRef<Record<string, readonly string[]>>({})
  const firstErrors = shallowRef<Record<string, string>>({})
  const isValid = shallowRef(true)
  // SAFETY: initial value is undefined, cast needed to avoid ShallowRef<undefined> narrowing
  const data = shallowRef(undefined as z.output<S> | undefined)

  /**
   * Run Validation
   * Validates input against the bound schema and updates reactive state.
   *
   * @param input - The data to validate.
   * @returns The structured validation result.
   */
  async function runValidation(
    input: unknown,
  ): Promise<ValidationResult<z.output<S>>> {
    const result = await coreValidate(schema, input)

    errors.value = result.errors
    firstErrors.value = result.firstErrors
    isValid.value = result.success
    data.value = result.data

    return result
  }

  /**
   * Clear Errors
   * Resets all error state and restores validity to true.
   */
  function clearErrors(): void {
    errors.value = {}
    firstErrors.value = {}
    isValid.value = true
    data.value = undefined
  }

  // SAFETY: shallowRef types are structurally compatible with the interface
  // but TypeScript cannot resolve the generic ShallowRef overloads correctly
  return {
    validate: runValidation,
    clearErrors,
    errors,
    firstErrors,
    isValid,
    data,
  } as ValidationState<z.output<S>>
}
