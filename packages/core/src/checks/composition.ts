// ==============================================================================
// CHARACTER COMPOSITION CHECKS
// Pure predicate functions for character-class counting.
// ------------------------------------------------------------------------------
// NOTE: All functions are unicode-aware via \p{} regex properties.
// ==============================================================================

// ----------------------------------------------------------
// INTERNAL HELPERS
// ----------------------------------------------------------

/**
 * Count Matches
 * Counts regex matches in a string.
 *
 * @param value   - The string to search.
 * @param pattern - A global RegExp to match against.
 * @returns The number of matches found.
 */
function countMatches(value: string, pattern: RegExp): number {
  const matches = value.match(pattern)
  return matches ? matches.length : 0
}

/**
 * In Range
 * Checks whether a count falls within [min, max].
 *
 * @param count - The measured count.
 * @param min   - Minimum required (inclusive).
 * @param max   - Maximum allowed (inclusive), or undefined for no upper bound.
 * @returns True if count >= min and (max is undefined or count <= max).
 */
function inRange(
  count: number,
  min: number,
  max: number | undefined,
): boolean {
  return count >= min && (max === undefined || count <= max)
}

// ----------------------------------------------------------
// COMPOSITION CHECKS
// ----------------------------------------------------------

/** Unicode uppercase letter pattern. */
const UPPERCASE_RE: Readonly<RegExp> = /\p{Lu}/gu

/** Unicode lowercase letter pattern. */
const LOWERCASE_RE: Readonly<RegExp> = /\p{Ll}/gu

/** Unicode decimal digit pattern. */
const DIGIT_RE: Readonly<RegExp> = /\p{Nd}/gu

/** Special character pattern (not letter, not digit, not whitespace). */
const SPECIAL_RE: Readonly<RegExp> = /[^\p{L}\p{Nd}\s]/gu

/**
 * Has Uppercase
 * Checks that the string contains uppercase letters within the given bounds.
 *
 * @param value - The string to inspect.
 * @param min   - Minimum number of uppercase letters required.
 * @param max   - Maximum number of uppercase letters allowed (optional).
 * @returns True if the uppercase letter count is within [min, max].
 */
export function hasUppercase(
  value: string,
  min: number,
  max?: number,
): boolean {
  return inRange(countMatches(value, UPPERCASE_RE), min, max)
}

/**
 * Has Lowercase
 * Checks that the string contains lowercase letters within the given bounds.
 *
 * @param value - The string to inspect.
 * @param min   - Minimum number of lowercase letters required.
 * @param max   - Maximum number of lowercase letters allowed (optional).
 * @returns True if the lowercase letter count is within [min, max].
 */
export function hasLowercase(
  value: string,
  min: number,
  max?: number,
): boolean {
  return inRange(countMatches(value, LOWERCASE_RE), min, max)
}

/**
 * Has Digits
 * Checks that the string contains digit characters within the given bounds.
 *
 * @param value - The string to inspect.
 * @param min   - Minimum number of digits required.
 * @param max   - Maximum number of digits allowed (optional).
 * @returns True if the digit count is within [min, max].
 */
export function hasDigits(
  value: string,
  min: number,
  max?: number,
): boolean {
  return inRange(countMatches(value, DIGIT_RE), min, max)
}

/**
 * Has Special
 * Checks that the string contains special characters within the given bounds.
 * Special characters are those that are not letters, digits, or whitespace.
 *
 * @param value - The string to inspect.
 * @param min   - Minimum number of special characters required.
 * @param max   - Maximum number of special characters allowed (optional).
 * @returns True if the special character count is within [min, max].
 */
export function hasSpecial(
  value: string,
  min: number,
  max?: number,
): boolean {
  return inRange(countMatches(value, SPECIAL_RE), min, max)
}
