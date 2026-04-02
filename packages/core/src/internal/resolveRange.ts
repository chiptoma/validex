// ==============================================================================
// RESOLVE RANGE
// Normalizes a Range value to a consistent { min?, max? } object.
// ==============================================================================

import type { Range } from '../types'

/**
 * ResolvedRange
 * Normalized range with optional min and max.
 */
export interface ResolvedRange {
  readonly min?: number
  readonly max?: number
}

/**
 * Resolve Range
 * Normalizes a Range value into a consistent object form.
 *
 * @param value - A number (exact), an object with min/max, or undefined.
 * @returns Normalized range object, or undefined if input is undefined.
 */
export function resolveRange(value: Range | undefined): ResolvedRange | undefined {
  if (value === undefined) {
    return undefined
  }

  if (typeof value === 'number') {
    return { min: value, max: value }
  }

  const result: { min?: number, max?: number } = {}
  if (value.min !== undefined) {
    result.min = value.min
  }
  if (value.max !== undefined) {
    result.max = value.max
  }
  return result
}
