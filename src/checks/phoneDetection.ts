// ==============================================================================
// PHONE NUMBER DETECTION
// Isolated module for phone number detection via libphonenumber-js.
// ------------------------------------------------------------------------------
// NOTE: Uses dynamic import() so libphonenumber-js (~300kB) is only loaded
//       when this function is actually called, not when the barrel is imported.
// ==============================================================================

// ----------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------

/**
 * Contains Phone Number
 * Returns true when the value contains a phone number, detected via
 * libphonenumber-js. Uses dynamic import to avoid pulling the library
 * into consumers who never call this function.
 *
 * @param value - The string to scan for phone numbers.
 * @returns Resolves to true if at least one phone number is found.
 */
export async function containsPhoneNumber(value: string): Promise<boolean> {
  const { findPhoneNumbersInText } = await import('libphonenumber-js')
  return findPhoneNumbersInText(value).length > 0
}
