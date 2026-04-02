// ==============================================================================
// PHONE PARSER LOADER
// Async loader for libphonenumber-js parser with metadata variant selection.
// ------------------------------------------------------------------------------
// Caches parsers per metadata variant (min, mobile, max, custom) to avoid
// repeated dynamic imports. Preloading enables synchronous phone validation.
// ==============================================================================

import type { CountryCode, PhoneNumber } from 'libphonenumber-js'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/** Parser function type matching libphonenumber-js signature. */
export type PhoneParser = (value: string, country?: CountryCode) => PhoneNumber

/** Supported metadata variant types. */
type PhoneMetadata = 'min' | 'mobile' | 'max' | 'custom'

// ----------------------------------------------------------
// CACHE
// ----------------------------------------------------------

const cache = new Map<string, PhoneParser>()

// ----------------------------------------------------------
// LOADER
// ----------------------------------------------------------

/**
 * Load Phone Parser
 * Dynamically imports the correct libphonenumber-js bundle based on metadata type.
 *
 * @param metadata   - The metadata bundle to load.
 * @param customPath - Path to custom metadata file (when metadata is 'custom').
 * @returns The parsePhoneNumberWithError function for the requested bundle.
 */
export async function loadPhoneParser(
  metadata: PhoneMetadata = 'min',
  customPath?: string,
): Promise<PhoneParser> {
  const cached = cache.get(metadata)
  if (cached !== undefined)
    return cached

  let parser: PhoneParser
  switch (metadata) {
    case 'min': {
      const mod = await import('libphonenumber-js')
      parser = mod.parsePhoneNumberWithError
      break
    }
    case 'mobile': {
      const mod = await import('libphonenumber-js/mobile')
      parser = mod.parsePhoneNumberWithError
      break
    }
    case 'max': {
      const mod = await import('libphonenumber-js/max')
      parser = mod.parsePhoneNumberWithError
      break
    }
    /* c8 ignore start -- custom metadata requires user-provided path; not testable without fixtures */
    case 'custom': {
      if (customPath === undefined || customPath === '') {
        throw new Error('validex: Phone metadata "custom" requires customMetadataPath')
      }
      const core = await import('libphonenumber-js/core')
      // SAFETY: dynamic import of user-provided metadata path; typed as unknown for safety
      const meta = await import(customPath) as { default: unknown }
      // SAFETY: core.parsePhoneNumberWithError with explicit metadata matches PhoneParser shape
      parser = ((v: string, c?: CountryCode) =>
        // SAFETY: custom metadata default export is the metadata object by user contract; c cast avoids overload mismatch
        core.parsePhoneNumberWithError(v, c as CountryCode, meta.default as Parameters<typeof core.parsePhoneNumberWithError>[2])) as PhoneParser
      break
    }
    /* c8 ignore stop */
  }

  cache.set(metadata, parser)
  return parser
}

/**
 * Get Phone Parser
 * Synchronously returns a previously loaded phone parser, or undefined.
 *
 * @param metadata - The metadata variant to retrieve.
 * @returns The cached parser function, or undefined.
 */
export function getPhoneParser(metadata: PhoneMetadata = 'min'): PhoneParser | undefined {
  return cache.get(metadata)
}

/**
 * Clear Phone Parser Cache
 * Evicts all cached parsers. Intended for testing only.
 */
export function clearPhoneParserCache(): void {
  cache.clear()
}
