// ==============================================================================
// JWT TEST HELPERS
// Shared helpers for building test JWT tokens across test files.
// ==============================================================================

// ----------------------------------------------------------
// TOKEN BUILDERS
// ----------------------------------------------------------

/**
 * Builds a base64url JWT string from header and payload objects.
 * Uses a dummy signature since we only validate structure.
 *
 * @param header  - The JWT header object.
 * @param payload - The JWT payload object.
 * @returns A base64url-encoded JWT string.
 */
export function makeJwt(header: object, payload: object): string {
  const h = btoa(JSON.stringify(header))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  const p = btoa(JSON.stringify(payload))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return `${h}.${p}.test-signature`
}

/**
 * Returns the current Unix timestamp in seconds.
 *
 * @returns Current time as integer seconds since epoch.
 */
export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000)
}
