// ==============================================================================
// IBAN PATTERNS LOADER
// Async loader for IBAN country validation patterns (~80 countries).
// ------------------------------------------------------------------------------
// Each entry maps a two-letter country code to its expected IBAN length and a
// regex that validates the full IBAN structure per the ECB IBAN registry.
// ==============================================================================

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/** IbanPattern — IBAN length and structural regex for one country. */
interface IbanPattern {
  readonly length: number
  readonly regex: RegExp
}

/** Shape of each entry in the JSON data file. */
interface RawIbanEntry {
  readonly country: string
  readonly length: number
  readonly regex: string
}

// ----------------------------------------------------------
// CACHE
// ----------------------------------------------------------

let cache: ReadonlyMap<string, IbanPattern> | undefined

// ----------------------------------------------------------
// LOADER
// ----------------------------------------------------------

/**
 * Load IBAN Patterns
 * Lazily imports JSON data and caches a Map of country codes to IBAN patterns.
 *
 * @returns A ReadonlyMap of two-letter country codes to IbanPattern entries.
 */
export async function loadIbanPatterns(): Promise<ReadonlyMap<string, IbanPattern>> {
  if (cache !== undefined)
    return cache

  const raw: RawIbanEntry[] = (await import('../data/ibanPatterns.json')).default
  const map = new Map<string, IbanPattern>()

  for (const entry of raw) {
    map.set(entry.country, {
      length: entry.length,
      regex: new RegExp(entry.regex),
    })
  }

  cache = map
  return cache
}

/**
 * Get IBAN Patterns
 * Synchronously returns previously loaded IBAN patterns.
 *
 * @returns The ReadonlyMap of country codes to IbanPattern entries.
 * @throws  When IBAN patterns have not been loaded yet.
 */
export function getIbanPatterns(): ReadonlyMap<string, IbanPattern> {
  if (cache === undefined) {
    throw new Error(
      'validex: IBAN patterns not loaded. Use parseAsync() or call preloadData() first.',
    )
  }
  return cache
}

/**
 * Clear IBAN Patterns Cache
 * Evicts the cached map. Intended for testing only.
 */
export function clearIbanPatternsCache(): void {
  cache = undefined
}

export type { IbanPattern }
