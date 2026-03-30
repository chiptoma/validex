// ==============================================================================
// CHARACTER RESTRICTION CHECKS
// Pure predicate functions for character-set validation.
// ------------------------------------------------------------------------------
// NOTE: All functions are unicode-aware and have zero external dependencies.
// ==============================================================================

// ----------------------------------------------------------
// ALPHABETIC
// ----------------------------------------------------------

/**
 * Only Alpha
 * Returns true when every character is a unicode letter.
 *
 * @param value - The string to test.
 * @returns True if the string is non-empty and contains only letters.
 */
export function onlyAlpha(value: string): boolean {
  return /^\p{L}+$/u.test(value)
}

// ----------------------------------------------------------
// NUMERIC
// ----------------------------------------------------------

/**
 * Only Numeric
 * Returns true when every character is a digit (0-9).
 *
 * @param value - The string to test.
 * @returns True if the string is non-empty and contains only digits.
 */
export function onlyNumeric(value: string): boolean {
  return /^\d+$/.test(value)
}

// ----------------------------------------------------------
// ALPHANUMERIC
// ----------------------------------------------------------

/**
 * Only Alphanumeric
 * Returns true when every character is a unicode letter or digit.
 *
 * @param value - The string to test.
 * @returns True if the string is non-empty and contains only letters and digits.
 */
export function onlyAlphanumeric(value: string): boolean {
  return /^[\p{L}\d]+$/u.test(value)
}

// ----------------------------------------------------------
// ALPHANUMERIC + SPACE + HYPHEN
// ----------------------------------------------------------

/**
 * Only Alphanumeric Space Hyphen
 * Returns true when every character is a unicode letter, digit, whitespace,
 * or hyphen.
 *
 * @param value - The string to test.
 * @returns True if the string is non-empty and contains only the allowed set.
 */
export function onlyAlphanumericSpaceHyphen(value: string): boolean {
  return /^[\p{L}\d\s-]+$/u.test(value)
}

// ----------------------------------------------------------
// ALPHA + SPACE + HYPHEN
// ----------------------------------------------------------

/**
 * Only Alpha Space Hyphen
 * Returns true when every character is a unicode letter, whitespace,
 * or hyphen.
 *
 * @param value - The string to test.
 * @returns True if the string is non-empty and contains only the allowed set.
 */
export function onlyAlphaSpaceHyphen(value: string): boolean {
  return /^[\p{L}\s-]+$/u.test(value)
}
