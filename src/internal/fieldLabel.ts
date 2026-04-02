// ==============================================================================
// FIELD LABEL
// Converts camelCase or snake_case field names to human-readable labels.
// ==============================================================================

// ----------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------

const CAMEL_SPLIT_RE = /([a-z])([A-Z])/g
const SEPARATOR_RE = /[_-]/g
const WORD_START_RE = /\b\w/g

// ----------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------

/**
 * Field Name To Label
 * Converts a camelCase or snake_case field name to Title Case for use
 * as a human-readable label in error messages.
 *
 * @param str - The field name string (e.g. 'firstName', 'last_name').
 * @returns The title-cased label string (e.g. 'First Name', 'Last Name').
 */
export function fieldNameToLabel(str: string): string {
  return str
    .replace(CAMEL_SPLIT_RE, '$1 $2')
    .replace(SEPARATOR_RE, ' ')
    .replace(WORD_START_RE, c => c.toUpperCase())
}
