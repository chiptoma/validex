// ==============================================================================
// DISPOSABLE DOMAINS LOADER
// Async loader for known disposable/temporary email domain list.
// ------------------------------------------------------------------------------
// Uses the disposable-email-domains-js package. Preloading enables synchronous
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
 * Lazily imports disposable-email-domains-js and caches the domain set.
 *
 * @returns A ReadonlySet of known disposable email domains.
 */
export async function loadDisposableDomains(): Promise<ReadonlySet<string>> {
  if (cache !== undefined)
    return cache

  const { disposableEmailBlocklistSet } = await import('disposable-email-domains-js')
  cache = disposableEmailBlocklistSet()
  return cache
}

/**
 * Get Disposable Domains
 * Synchronously returns previously loaded disposable domains.
 * Throws if not yet loaded — call loadDisposableDomains() or
 * preloadData({ disposable: true }) first.
 *
 * @returns The ReadonlySet of disposable domains.
 */
export function getDisposableDomains(): ReadonlySet<string> {
  if (cache === undefined) {
    throw new Error('Disposable domains not loaded. Call loadDisposableDomains() or preloadData({ disposable: true }) first.')
  }
  return cache
}

/**
 * Clear Disposable Domains Cache
 * Evicts the cached set. Intended for testing only.
 */
export function clearDisposableDomainsCache(): void {
  cache = undefined
}
