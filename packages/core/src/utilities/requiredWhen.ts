// ==============================================================================
// REQUIRED-WHEN UTILITY
// Conditional requirement refinement for Zod object schemas.
// ==============================================================================

import { z } from 'zod'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/** Options for the requiredWhen conditional refinement. */
interface RequiredWhenOptions {
  /** Custom error message when the field is missing. */
  readonly message?: string | undefined
  /** Label for the field in error messages. */
  readonly label?: string | undefined
}

// ----------------------------------------------------------
// REQUIRED-WHEN REFINEMENT
// ----------------------------------------------------------

/**
 * requiredWhen
 * Creates a Zod superRefine callback that marks a field as
 * required when the given condition evaluates to true. The
 * condition receives the full parent object for cross-field
 * logic. An error is attached to the specified field path
 * when the condition is met and the field is empty or absent.
 *
 * @param field     - Field name that becomes required.
 * @param condition - Predicate receiving the parent data object.
 * @param options   - Optional configuration (custom message).
 * @returns A superRefine callback for use with z.object().
 */
export function requiredWhen(
  field: string,
  condition: (data: Record<string, unknown>) => boolean,
  options?: RequiredWhenOptions,
): (data: Record<string, unknown>, ctx: z.RefinementCtx) => void {
  const lbl = options?.label ?? field
  const message = options?.message ?? `${lbl} is required`

  return (data: Record<string, unknown>, ctx: z.RefinementCtx): void => {
    if (!condition(data)) {
      return
    }

    const value: unknown = data[field]

    if (value === undefined || value === null || value === '') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
        path: [field],
        params: { code: 'required', namespace: 'base', label: lbl },
      })
    }
  }
}
