// ==============================================================================
// COUNTRY CODES LOADER
// Async loader for ISO 3166-1 country codes (249 entries).
// ------------------------------------------------------------------------------
// Data is stored in countryCodes.json and lazily loaded into a Map keyed by
// alpha-2 code. Use loadCountryCodes() before accessing via getCountryCodes().
// ==============================================================================

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/** CountryData — a single ISO 3166-1 country entry. */
interface CountryData {
  readonly alpha2: string
  readonly alpha3: string
  readonly name: string
}

// ----------------------------------------------------------
// CACHE
// ----------------------------------------------------------

let cache: ReadonlyMap<string, CountryData> | undefined

// ----------------------------------------------------------
// LOADER
// ----------------------------------------------------------

/**
 * Load Country Codes
 * Lazily imports the JSON dataset and builds a lookup Map keyed by alpha-2.
 *
 * @returns A ReadonlyMap of alpha-2 codes to CountryData entries.
 */
export async function loadCountryCodes(): Promise<ReadonlyMap<string, CountryData>> {
  if (cache !== undefined)
    return cache

  const raw: readonly CountryData[] = (await import('../data/countryCodes.json')).default
  const map = new Map<string, CountryData>()

  for (const entry of raw) {
    map.set(entry.alpha2, entry)
  }

  cache = map
  return cache
}

/**
 * Get Country Codes
 * Synchronously returns previously loaded country codes.
 *
 * @returns The ReadonlyMap of alpha-2 codes to CountryData entries.
 * @throws When country codes have not been loaded yet.
 */
export function getCountryCodes(): ReadonlyMap<string, CountryData> {
  if (cache === undefined) {
    throw new Error(
      'validex: Country codes not loaded. Use parseAsync() or call preloadData() first.',
    )
  }
  return cache
}

/**
 * Clear Country Codes Cache
 * Evicts the cached map. Intended for testing only.
 */
export function clearCountryCodesCache(): void {
  cache = undefined
}

export type { CountryData }
