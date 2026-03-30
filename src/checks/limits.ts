// ==============================================================================
// LIMIT CHECKS
// Pure predicate functions for string length and repetition constraints.
// ==============================================================================

// ----------------------------------------------------------
// WORD LIMIT
// ----------------------------------------------------------

const WHITESPACE_RE = /\s+/

/**
 * Max Words
 * Returns true if value has at most `max` words.
 *
 * @param value - The string to inspect.
 * @param max   - Maximum number of words allowed (inclusive).
 * @returns True if the word count is at most `max`.
 */
export function maxWords(value: string, max: number): boolean {
  const words = value.split(WHITESPACE_RE).filter(segment => segment.length > 0)
  return words.length <= max
}

// ----------------------------------------------------------
// CONSECUTIVE CHARACTER LIMIT
// ----------------------------------------------------------

/**
 * Max Consecutive
 * Returns true if no single character repeats more than `max` times
 * consecutively. Handles unicode characters (emoji, CJK, etc.).
 *
 * @param value - The string to inspect.
 * @param max   - Maximum allowed consecutive repetitions (inclusive).
 * @returns True if no character appears more than `max` times in a row.
 */
export function maxConsecutive(value: string, max: number): boolean {
  const chars = Array.from(value)
  let count = 1

  for (let i = 1; i < chars.length; i++) {
    if (chars[i] === chars[i - 1]) {
      count++
      if (count > max) {
        return false
      }
    }
    else {
      count = 1
    }
  }

  return true
}

// ----------------------------------------------------------
// WHITESPACE CHECK
// ----------------------------------------------------------

const ANY_WHITESPACE_RE = /\s/

/**
 * No Spaces
 * Returns true if value contains no whitespace characters.
 *
 * @param value - The string to inspect.
 * @returns True if the string has no spaces, tabs, or newlines.
 */
export function noSpaces(value: string): boolean {
  return !ANY_WHITESPACE_RE.test(value)
}
