// ==============================================================================
// CHARACTER RESTRICTION CHECKS
// Pure predicate functions for character-set validation.
// ------------------------------------------------------------------------------
// NOTE: All functions are unicode-aware and have zero external dependencies.
// ==============================================================================

// ----------------------------------------------------------
// ALPHABETIC
// ----------------------------------------------------------

const ALPHA_RE = /^\p{L}+$/u

/**
 * Only Alpha
 * Returns true when every character is a unicode letter.
 *
 * @param value - The string to test.
 * @returns True if the string is non-empty and contains only letters.
 */
export function onlyAlpha(value: string): boolean {
  return ALPHA_RE.test(value)
}

// ----------------------------------------------------------
// NUMERIC
// ----------------------------------------------------------

const NUMERIC_RE = /^\d+$/

/**
 * Only Numeric
 * Returns true when every character is a digit (0-9).
 *
 * @param value - The string to test.
 * @returns True if the string is non-empty and contains only digits.
 */
export function onlyNumeric(value: string): boolean {
  return NUMERIC_RE.test(value)
}

// ----------------------------------------------------------
// ALPHANUMERIC
// ----------------------------------------------------------

const ALPHANUMERIC_RE = /^[\p{L}\d]+$/u

/**
 * Only Alphanumeric
 * Returns true when every character is a unicode letter or digit.
 *
 * @param value - The string to test.
 * @returns True if the string is non-empty and contains only letters and digits.
 */
export function onlyAlphanumeric(value: string): boolean {
  return ALPHANUMERIC_RE.test(value)
}

// ----------------------------------------------------------
// ALPHANUMERIC + SPACE + HYPHEN
// ----------------------------------------------------------

const ALPHANUMERIC_SPACE_HYPHEN_RE = /^[\p{L}\d\s-]+$/u

/**
 * Only Alphanumeric Space Hyphen
 * Returns true when every character is a unicode letter, digit, whitespace,
 * or hyphen.
 *
 * @param value - The string to test.
 * @returns True if the string is non-empty and contains only the allowed set.
 */
export function onlyAlphanumericSpaceHyphen(value: string): boolean {
  return ALPHANUMERIC_SPACE_HYPHEN_RE.test(value)
}

// ----------------------------------------------------------
// ALPHA + SPACE + HYPHEN
// ----------------------------------------------------------

const ALPHA_SPACE_HYPHEN_RE = /^[\p{L}\s-]+$/u

/**
 * Only Alpha Space Hyphen
 * Returns true when every character is a unicode letter, whitespace,
 * or hyphen.
 *
 * @param value - The string to test.
 * @returns True if the string is non-empty and contains only the allowed set.
 */
export function onlyAlphaSpaceHyphen(value: string): boolean {
  return ALPHA_SPACE_HYPHEN_RE.test(value)
}
