// ==============================================================================
// SAME-AS UTILITY
// Cross-field equality refinement for Zod object schemas.
// ==============================================================================

import { z } from 'zod'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/** Options for the sameAs cross-field equality refinement. */
interface SameAsOptions {
  /** Custom error message when fields do not match. */
  readonly message?: string | undefined
  /** Label for the source field in error messages. */
  readonly label?: string | undefined
  /** Label for the target field in error messages. */
  readonly targetLabel?: string | undefined
}

// ----------------------------------------------------------
// SAME-AS REFINEMENT
// ----------------------------------------------------------

/**
 * sameAs
 * Creates a Zod superRefine callback that verifies two fields
 * on the parent object hold the same value. The validation
 * error is attached to the source field path.
 *
 * @param sourceField - Field that must match the target.
 * @param targetField - Field whose value is the reference.
 * @param options     - Optional configuration (custom message).
 * @returns A superRefine callback for use with z.object().
 */
export function sameAs(
  sourceField: string,
  targetField: string,
  options?: SameAsOptions,
): (data: Record<string, unknown>, ctx: z.RefinementCtx) => void {
  const srcLabel = options?.label ?? sourceField
  const tgtLabel = options?.targetLabel ?? targetField
  const message = options?.message
    ?? `${srcLabel} must match ${tgtLabel}`

  return (data: Record<string, unknown>, ctx: z.RefinementCtx): void => {
    if (data[sourceField] !== data[targetField]) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message,
        path: [sourceField],
        params: { code: 'mismatch', namespace: 'confirmation', label: srcLabel, targetLabel: tgtLabel },
      })
    }
  }
}
