// ==============================================================================
// BOUNDARY CHECKS
// Pure predicate functions for string start/end character constraints.
// ==============================================================================

// ----------------------------------------------------------
// UNICODE BOUNDARY
// For rules that support full unicode (personName, businessName).
// ----------------------------------------------------------

const UNICODE_ALPHA_RE = /^\p{L}$/u
const UNICODE_ALPHANUMERIC_RE = /^[\p{L}\p{Nd}]$/u

/**
 * Check Unicode Boundary
 * Validates that the first and last characters satisfy the boundary
 * constraint using unicode-aware letter/digit detection.
 *
 * @param value    - The string to check.
 * @param boundary - Resolved boundary with start and end constraints.
 * @param boundary.start
 * @param boundary.end
 * @returns True if boundary constraints are satisfied.
 */
export function checkUnicodeBoundary(
  value: string,
  boundary: { readonly start: string, readonly end: string },
): boolean {
  const chars = Array.from(value)
  const first = chars[0]
  const last = chars.at(-1)

  if (first === undefined || last === undefined) {
    return false
  }

  if (boundary.start === 'alpha' && !UNICODE_ALPHA_RE.test(first))
    return false
  if (boundary.start === 'alphanumeric' && !UNICODE_ALPHANUMERIC_RE.test(first))
    return false
  if (boundary.end === 'alpha' && !UNICODE_ALPHA_RE.test(last))
    return false
  if (boundary.end === 'alphanumeric' && !UNICODE_ALPHANUMERIC_RE.test(last))
    return false

  return true
}

// ----------------------------------------------------------
// ASCII BOUNDARY
// For rules that operate on ASCII-only input (username).
// ----------------------------------------------------------

const ASCII_ALPHA_RE = /^[a-z]$/
const ASCII_ALPHANUMERIC_RE = /^[a-z0-9]$/

/**
 * Check ASCII Boundary
 * Validates that the first and last characters satisfy the boundary
 * constraint using ASCII-only lowercase letter/digit detection.
 *
 * @param value    - The string to check.
 * @param boundary - Resolved boundary with start and end constraints.
 * @param boundary.start
 * @param boundary.end
 * @returns True if boundary constraints are satisfied.
 */
export function checkAsciiBoundary(
  value: string,
  boundary: { readonly start: string, readonly end: string },
): boolean {
  const first = value.charAt(0)
  const last = value.charAt(value.length - 1)

  if (first === '' || last === '')
    return false
  if (boundary.start === 'alpha' && !ASCII_ALPHA_RE.test(first))
    return false
  if (boundary.start === 'alphanumeric' && !ASCII_ALPHANUMERIC_RE.test(first))
    return false
  if (boundary.end === 'alpha' && !ASCII_ALPHA_RE.test(last))
    return false
  if (boundary.end === 'alphanumeric' && !ASCII_ALPHANUMERIC_RE.test(last))
    return false

  return true
}
