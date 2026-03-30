// ==============================================================================
// CONTENT DETECTION CHECKS
// Pure predicate functions for detecting content types within strings.
// ------------------------------------------------------------------------------
// NOTE: containsPhoneNumber is the only function with an external dependency
//       (libphonenumber-js). All others use regex-based detection.
// ==============================================================================

import { findPhoneNumbersInText } from 'libphonenumber-js'

// ----------------------------------------------------------
// EMAIL DETECTION
// ----------------------------------------------------------

const EMAIL_RE = /[\w.%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i

/**
 * Contains Email
 * Returns true when the value contains what looks like an email address.
 *
 * @param value - The string to scan for email addresses.
 * @returns True if an email-like pattern is detected.
 *
 * NOTE: Optimised for recall over precision — false positives are acceptable.
 */
export function containsEmail(value: string): boolean {
  return EMAIL_RE.test(value)
}

// ----------------------------------------------------------
// URL DETECTION
// ----------------------------------------------------------

const URL_PROTOCOL_RE = /https?:\/\/\S+/i
const URL_WWW_RE = /\bwww\.\S+/i

/**
 * Contains URL
 * Returns true when the value contains what looks like a URL.
 *
 * @param value - The string to scan for URLs.
 * @returns True if a URL-like pattern is detected.
 *
 * NOTE: Detects both protocol-prefixed (http/https) and www-prefixed URLs.
 */
export function containsUrl(value: string): boolean {
  return URL_PROTOCOL_RE.test(value) || URL_WWW_RE.test(value)
}

// ----------------------------------------------------------
// HTML DETECTION
// ----------------------------------------------------------

const HTML_TAG_RE = /<[a-z/][^>]*>/i

/**
 * Contains HTML
 * Returns true when the value contains HTML-like tags.
 *
 * @param value - The string to scan for HTML tags.
 * @returns True if an HTML tag pattern is detected.
 *
 * NOTE: Avoids false positives on comparison operators and emoticons.
 */
export function containsHtml(value: string): boolean {
  return HTML_TAG_RE.test(value)
}

// ----------------------------------------------------------
// PHONE NUMBER DETECTION
// ----------------------------------------------------------

/**
 * Contains Phone Number
 * Returns true when the value contains a phone number, detected via
 * libphonenumber-js.
 *
 * @param value - The string to scan for phone numbers.
 * @returns True if at least one phone number is found.
 */
export function containsPhoneNumber(value: string): boolean {
  return findPhoneNumbersInText(value).length > 0
}
