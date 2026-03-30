// ==============================================================================
// VAT PATTERNS LOADER
// Async loader for VAT number validation patterns by country code.
// ------------------------------------------------------------------------------
// Each entry maps an ISO 3166-1 alpha-2 country code (or special code like EL
// for Greece) to a RegExp that matches the VAT number WITHOUT the country
// prefix. Covers all EU member states plus GB, CH, and NO.
// ==============================================================================

// ----------------------------------------------------------
// RAW DATA
// Patterns match the full VAT number after prefix removal.
// ----------------------------------------------------------

const PATTERNS: ReadonlyArray<readonly [string, RegExp]> = [
  ['AT', /^U\d{8}$/],
  ['BE', /^[01]\d{9}$/],
  ['BG', /^\d{9,10}$/],
  ['HR', /^\d{11}$/],
  ['CY', /^\d{8}[A-Z]$/],
  ['CZ', /^\d{8,10}$/],
  ['DK', /^\d{8}$/],
  ['EE', /^\d{9}$/],
  ['FI', /^\d{8}$/],
  ['FR', /^[0-9A-Z]{2}\d{9}$/],
  ['DE', /^\d{9}$/],
  ['EL', /^\d{9}$/],
  ['HU', /^\d{8}$/],
  ['IE', /^(\d{7}[A-Z]{1,2}|\d[A-Z]\d{5}[A-Z])$/],
  ['IT', /^\d{11}$/],
  ['LV', /^\d{11}$/],
  ['LT', /^(\d{9}|\d{12})$/],
  ['LU', /^\d{8}$/],
  ['MT', /^\d{8}$/],
  ['NL', /^\d{9}B\d{2}$/],
  ['PL', /^\d{10}$/],
  ['PT', /^\d{9}$/],
  ['RO', /^\d{2,10}$/],
  ['SK', /^\d{10}$/],
  ['SI', /^\d{8}$/],
  ['ES', /^[A-Z0-9]\d{7}[A-Z0-9]$/],
  ['SE', /^\d{12}$/],
  ['GB', /^(\d{9}|\d{12}|GD\d{3}|HA\d{3})$/],
  ['CHE', /^\d{9}$/],
  ['NO', /^\d{9}MVA$/],
]

// ----------------------------------------------------------
// CACHE
// ----------------------------------------------------------

let cache: ReadonlyMap<string, RegExp> | undefined

// ----------------------------------------------------------
// LOADER
// ----------------------------------------------------------

/**
 * Load VAT Patterns
 * Lazily builds and caches a Map of country code to VAT RegExp.
 *
 * @returns A ReadonlyMap of country codes to VAT validation patterns.
 */
export async function loadVatPatterns(): Promise<ReadonlyMap<string, RegExp>> {
  if (cache !== undefined)
    return cache

  const map = new Map<string, RegExp>()

  for (const [code, pattern] of PATTERNS) {
    map.set(code, pattern)
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
