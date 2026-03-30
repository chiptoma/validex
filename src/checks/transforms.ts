// ==============================================================================
// TRANSFORM FUNCTIONS
// Pure transform functions for string normalization and conversion.
// ==============================================================================

// ----------------------------------------------------------
// EMPTY HANDLING
// ----------------------------------------------------------

/**
 * Empty To Undefined
 * Converts empty strings and null to undefined. All other values pass through.
 *
 * @param value - The value to inspect.
 * @returns Undefined if value is `""` or `null`, otherwise the original value.
 */
export function emptyToUndefined(value: unknown): unknown {
  if (value === '' || value === null) {
    return undefined
  }
  return value
}

// ----------------------------------------------------------
// CASE TRANSFORMS
// ----------------------------------------------------------

/**
 * To Title Case
 * Converts a string to Title Case. Handles hyphens, apostrophes, and unicode.
 *
 * @param value - The string to transform.
 * @returns The title-cased string.
 */
export function toTitleCase(value: string): string {
  return value
    .toLowerCase()
    .split(' ')
    .map(word =>
      word
        .split('-')
        .map(segment => capitalizeSegment(segment))
        .join('-'),
    )
    .join(' ')
}

const CAPITALIZE_RE = /(?:^|(?<='))./gu

/**
 * Capitalize Segment
 * Capitalizes a word segment, handling apostrophes within the segment.
 *
 * @param segment - The segment to capitalize.
 * @returns The segment with first letter and post-apostrophe letters capitalized.
 */
function capitalizeSegment(segment: string): string {
  if (segment.length === 0) {
    return segment
  }

  return segment.replace(
    CAPITALIZE_RE,
    char => char.toUpperCase(),
  )
}

// ----------------------------------------------------------
// SLUG TRANSFORM
// ----------------------------------------------------------

const SLUG_NON_ALNUM_RE = /[^a-z\d]+/g
const SLUG_MULTI_HYPHEN_RE = /-+/g
const SLUG_EDGE_HYPHEN_RE = /^-|-$/g

/**
 * To Slug
 * Converts a string to a URL-safe slug. Lowercases, replaces non-alphanumeric
 * characters with hyphens, collapses multiple hyphens, and trims edge hyphens.
 *
 * @param value - The string to transform.
 * @returns The slugified string.
 */
export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(SLUG_NON_ALNUM_RE, '-')
    .replace(SLUG_MULTI_HYPHEN_RE, '-')
    .replace(SLUG_EDGE_HYPHEN_RE, '')
}

// ----------------------------------------------------------
// HTML / WHITESPACE TRANSFORMS
// ----------------------------------------------------------

const HTML_STRIP_RE = /<[^>]*>/g

/**
 * Strip HTML
 * Removes HTML tags from a string.
 *
 * @param value - The string containing HTML.
 * @returns The string with all HTML tags removed.
 */
export function stripHtml(value: string): string {
  return value.replace(HTML_STRIP_RE, '')
}

const MULTI_WHITESPACE_RE = /\s+/g

/**
 * Collapse Whitespace
 * Collapses multiple whitespace characters into a single space and trims.
 *
 * @param value - The string to normalize.
 * @returns The string with collapsed whitespace.
 */
export function collapseWhitespace(value: string): string {
  return value.replace(MULTI_WHITESPACE_RE, ' ').trim()
}
