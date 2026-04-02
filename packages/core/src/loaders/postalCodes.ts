// ==============================================================================
// POSTAL CODES LOADER
// Async loader for the postcode-validator module.
// ------------------------------------------------------------------------------
// Lazily loads postcode-validator on first use. When preloaded via
// preloadData({ postalCodes: true }), enables synchronous creation-time
// country validation.
// ==============================================================================

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * PostcodeModule
 * The postcode-validator module shape used by the PostalCode rule.
 */
interface PostcodeModule {
  readonly postcodeValidator: (postcode: string, country: string) => boolean
  readonly postcodeValidatorExistsForCountry: (country: string) => boolean
}

// ----------------------------------------------------------
// CACHE
// ----------------------------------------------------------

let cache: PostcodeModule | undefined

// ----------------------------------------------------------
// LOADER
// ----------------------------------------------------------

/**
 * Load Postal Codes
 * Lazily imports the postcode-validator module and caches it.
 *
 * @returns The postcode-validator module.
 */
export async function loadPostalCodes(): Promise<PostcodeModule> {
  if (cache !== undefined)
    return cache

  const mod = await import('postcode-validator')
  cache = {
    postcodeValidator: mod.postcodeValidator,
    postcodeValidatorExistsForCountry: mod.postcodeValidatorExistsForCountry,
  }
  return cache
}

/**
 * Get Postal Codes
 * Returns the cached postcode-validator module, or undefined if not yet loaded.
 *
 * @returns The cached module, or undefined.
 */
export function getPostalCodes(): PostcodeModule | undefined {
  return cache
}

/**
 * Clear Postal Codes Cache
 * Resets the cached module. Used for testing.
 */
export function clearPostalCodesCache(): void {
  cache = undefined
}
