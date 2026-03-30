// ==============================================================================
// NORMALIZERS
// Per-rule normalize utility functions.
// ------------------------------------------------------------------------------
// These are thin wrappers used by rules that need programmatic normalization
// beyond what Zod's built-in .trim()/.toLowerCase() provides. Most rules
// apply normalization directly via Zod method chains in their build function.
// ==============================================================================

/**
 * Normalize Trim
 * Trims leading and trailing whitespace from a string.
 *
 * @param value - The string to trim.
 * @returns The trimmed string.
 */
export function normalizeTrim(value: string): string {
  return value.trim()
}

/**
 * Normalize Lowercase
 * Converts a string to lowercase after trimming.
 *
 * @param value - The string to normalize.
 * @returns The lowercased and trimmed string.
 */
export function normalizeLowercase(value: string): string {
  return value.trim().toLowerCase()
}

/**
 * Normalize Uppercase
 * Converts a string to uppercase after trimming.
 *
 * @param value - The string to normalize.
 * @returns The uppercased and trimmed string.
 */
export function normalizeUppercase(value: string): string {
  return value.trim().toUpperCase()
}
