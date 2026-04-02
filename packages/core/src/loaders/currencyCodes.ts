// ==============================================================================
// CURRENCY CODES LOADER
// Async loader for ISO 4217 currency codes.
// ------------------------------------------------------------------------------
// Includes all active currency codes plus precious metals (XAU, XAG, XPT, XPD),
// SDR (XDR), and bond market units (XBA, XBB, XBC, XBD).
// ==============================================================================

// ----------------------------------------------------------
// CACHE
// ----------------------------------------------------------

let cache: ReadonlySet<string> | undefined

// ----------------------------------------------------------
// LOADER
// ----------------------------------------------------------

/**
 * Load Currency Codes
 * Lazily imports and caches a Set of all ISO 4217 currency codes.
 *
 * @returns A ReadonlySet containing every active ISO 4217 code.
 */
export async function loadCurrencyCodes(): Promise<ReadonlySet<string>> {
  if (cache !== undefined)
    return cache

  const raw: string[] = (await import('../data/currencyCodes.json')).default
  cache = new Set(raw)
  return cache
}

/**
 * Get Currency Codes
 * Synchronously returns previously loaded currency codes.
 *
 * @returns The ReadonlySet of ISO 4217 currency codes.
 * @throws When currency codes have not been loaded yet.
 */
export function getCurrencyCodes(): ReadonlySet<string> {
  if (cache === undefined) {
    throw new Error(
      'validex: Currency codes not loaded. Use parseAsync() or call preloadData() first.',
    )
  }
  return cache
}

/**
 * Clear Currency Codes Cache
 * Evicts the cached set. Intended for testing only.
 */
export function clearCurrencyCodesCache(): void {
  cache = undefined
}
