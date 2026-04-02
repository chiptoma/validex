// ==============================================================================
// DISPOSABLE DOMAINS LOADER
// Async loader for known disposable/temporary email domain list.
// ------------------------------------------------------------------------------
// Uses the disposable-email-domains package. Preloading enables synchronous
// validation when Email({ blockDisposable: true }) is used.
// ==============================================================================

// ----------------------------------------------------------
// CACHE
// ----------------------------------------------------------

let cache: ReadonlySet<string> | undefined

// ----------------------------------------------------------
// LOADER
// ----------------------------------------------------------

/**
 * Load Disposable Domains
 * Lazily imports disposable-email-domains and caches the domain set.
 *
 * @returns A ReadonlySet of known disposable email domains.
 */
export async function loadDisposableDomains(): Promise<ReadonlySet<string>> {
  if (cache !== undefined)
    return cache

  // SAFETY: disposable-email-domains default export is a string array by package contract
  const raw = (await import('disposable-email-domains')).default as readonly string[]
  cache = new Set(raw)
  return cache
}

/**
 * Get Disposable Domains
 * Synchronously returns previously loaded disposable domains, or undefined
 * if not yet loaded. Returns undefined rather than throwing so the email
 * rule can fall back to its own async import.
 *
 * @returns The ReadonlySet of disposable domains, or undefined.
 */
export function getDisposableDomains(): ReadonlySet<string> | undefined {
  return cache
}

/**
 * Clear Disposable Domains Cache
 * Evicts the cached set. Intended for testing only.
 */
export function clearDisposableDomainsCache(): void {
  cache = undefined
}
