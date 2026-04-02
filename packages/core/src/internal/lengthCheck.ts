// ==============================================================================
// LENGTH CHECK
// Shared length validation helper used by multiple rules.
// ==============================================================================

import type { z } from 'zod'

/**
 * Apply Length Check
 * Emits `base.min` / `base.max` issues when the string value violates
 * the given length constraints. No-op when the corresponding bound is
 * undefined.
 *
 * @param value - The string to check.
 * @param min   - Minimum allowed length (inclusive), or undefined.
 * @param max   - Maximum allowed length (inclusive), or undefined.
 * @param label - The field label for error messages.
 * @param ctx   - Zod refinement context for issuing errors.
 */
export function applyLengthCheck(
  value: string,
  min: number | undefined,
  max: number | undefined,
  label: string | undefined,
  ctx: z.RefinementCtx,
): void {
  if (min !== undefined && value.length < min) {
    ctx.addIssue({ code: 'custom', params: { code: 'min', namespace: 'base', label, minimum: min } })
  }
  if (max !== undefined && value.length > max) {
    ctx.addIssue({ code: 'custom', params: { code: 'max', namespace: 'base', label, maximum: max } })
  }
}
