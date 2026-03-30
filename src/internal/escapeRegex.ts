// ==============================================================================
// ESCAPE REGEX
// Escapes special regex metacharacters for safe use in dynamic patterns.
// ==============================================================================

const ESCAPE_REGEX_RE = /[-.*+?^${}()|[\]\\]/g

/**
 * Escape Regex Chars
 * Escapes special regex characters in a string so it can be safely
 * embedded inside a character class or pattern literal.
 *
 * @param str - The string to escape.
 * @returns The escaped string safe for use in a regex pattern.
 */
export function escapeRegexChars(str: string): string {
  return str.replace(ESCAPE_REGEX_RE, '\\$&')
}
