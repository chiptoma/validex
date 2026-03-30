// ==============================================================================
// VAT PATTERNS LOADER
// Async loader for VAT number validation patterns by country code.
// ------------------------------------------------------------------------------
// Each entry maps an ISO 3166-1 alpha-2 country code (or special code like EL
// for Greece) to a RegExp that matches the VAT number WITHOUT the country
// prefix. Covers all EU member states plus GB, CH, and NO.
// ==============================================================================

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/** Shape of each entry in the JSON data file. */
interface RawVatEntry {
  readonly country: string
  readonly regex: string
}

// ----------------------------------------------------------
// CACHE
// ----------------------------------------------------------

let cache: ReadonlyMap<string, RegExp> | undefined

// ----------------------------------------------------------
// LOADER
// ----------------------------------------------------------

/**
 * Load VAT Patterns
 * Lazily imports JSON data and caches a Map of country code to VAT RegExp.
 *
 * @returns A ReadonlyMap of country codes to VAT validation patterns.
 */
export async function loadVatPatterns(): Promise<ReadonlyMap<string, RegExp>> {
  if (cache !== undefined)
    return cache

  const raw: RawVatEntry[] = (await import('./vat-patterns.json')).default
  const map = new Map<string, RegExp>()

  for (const entry of raw) {
    map.set(entry.country, new RegExp(entry.regex))
  }

  cache = map
  return cache
}

/**
 * Get VAT Patterns
 * Synchronously returns previously loaded VAT patterns.
 *
 * @returns The ReadonlyMap of country codes to VAT validation patterns.
 * @throws  When VAT patterns have not been loaded yet.
 */
export function getVatPatterns(): ReadonlyMap<string, RegExp> {
  if (cache === undefined) {
    throw new Error(
      'validex: VAT patterns not loaded. Use parseAsync() or call preloadData() first.',
    )
  }
  return cache
}

/**
 * Clear VAT Patterns Cache
 * Evicts the cached map. Intended for testing only.
 */
export function clearVatPatternsCache(): void {
  cache = undefined
}
