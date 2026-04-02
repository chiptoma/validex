// ==============================================================================
// CREDIT CARD PREFIXES LOADER
// Async loader for credit card issuer identification data.
// ------------------------------------------------------------------------------
// Each entry maps a lowercase issuer identifier to its known IIN/BIN prefixes
// and valid card lengths. Range-based prefixes (e.g. Mastercard 2221-2720) are
// stored as boundary strings; the consuming rule handles range comparison.
// ==============================================================================

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/** CardIssuer -- identification data for a single card network. */
interface CardIssuer {
  readonly name: string
  readonly prefixes: readonly string[]
  readonly lengths: readonly number[]
}

/** Shape of each entry in the JSON data file. */
interface RawIssuerEntry {
  readonly id: string
  readonly name: string
  readonly prefixes: string[]
  readonly lengths: number[]
}

// ----------------------------------------------------------
// CACHE
// ----------------------------------------------------------

let cache: ReadonlyMap<string, CardIssuer> | undefined

// ----------------------------------------------------------
// LOADER
// ----------------------------------------------------------

/**
 * Load Credit Card Prefixes
 * Lazily imports JSON data and caches a Map of issuer identifiers to CardIssuer data.
 *
 * @returns A ReadonlyMap of issuer keys to CardIssuer entries.
 */
export async function loadCreditCardPrefixes(): Promise<ReadonlyMap<string, CardIssuer>> {
  if (cache !== undefined)
    return cache

  const raw: RawIssuerEntry[] = (await import('../data/creditCardPrefixes.json')).default
  const map = new Map<string, CardIssuer>()

  for (const entry of raw) {
    map.set(entry.id, {
      name: entry.name,
      prefixes: entry.prefixes,
      lengths: entry.lengths,
    })
  }

  cache = map
  return cache
}

/**
 * Get Credit Card Prefixes
 * Synchronously returns previously loaded credit card prefix data.
 *
 * @returns The ReadonlyMap of issuer keys to CardIssuer entries.
 * @throws  When credit card prefixes have not been loaded yet.
 */
export function getCreditCardPrefixes(): ReadonlyMap<string, CardIssuer> {
  if (cache === undefined) {
    throw new Error(
      'validex: Credit card prefixes not loaded. Use parseAsync() or call preloadData() first.',
    )
  }
  return cache
}

/**
 * Clear Credit Card Prefixes Cache
 * Evicts the cached map. Intended for testing only.
 */
export function clearCreditCardPrefixesCache(): void {
  cache = undefined
}

export type { CardIssuer }
