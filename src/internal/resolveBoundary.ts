// ==============================================================================
// RESOLVE BOUNDARY
// Normalizes a Boundary value to a consistent { start, end } object.
// ==============================================================================

import type { Boundary } from '../types'

/** Valid boundary character constraint values. */
type BoundaryValue = 'alpha' | 'alphanumeric' | 'any'

/**
 * ResolvedBoundary
 * Normalized boundary with start and end constraints.
 */
export interface ResolvedBoundary {
  readonly start: BoundaryValue
  readonly end: BoundaryValue
}

/**
 * Resolve Boundary
 * Normalizes a Boundary value into a consistent object form.
 *
 * @param value - A string shorthand, an object with start/end, or undefined.
 * @returns Normalized boundary object, or undefined if input is undefined.
 */
export function resolveBoundary(value: Boundary | undefined): ResolvedBoundary | undefined {
  if (value === undefined) {
    return undefined
  }

  if (typeof value === 'string') {
    return { start: value, end: value }
  }

  return {
    start: value.start ?? 'any',
    end: value.end ?? 'any',
  }
}
