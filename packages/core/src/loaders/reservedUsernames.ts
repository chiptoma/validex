// ==============================================================================
// RESERVED USERNAMES
// Curated list of usernames that platforms should not allow for registration.
// ------------------------------------------------------------------------------
// NOTE: Sourced from GitHub, Twitter/X, Instagram, and common conventions.
// ==============================================================================

// ----------------------------------------------------------
// CACHE
// ----------------------------------------------------------

let cache: ReadonlySet<string> | undefined

// ----------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------

/**
 * Load Reserved Usernames
 * Lazily imports JSON data and caches the reserved usernames set.
 *
 * @returns A promise resolving to the immutable set of reserved usernames.
 */
export async function loadReservedUsernames(): Promise<ReadonlySet<string>> {
  if (cache !== undefined)
    return cache

  const raw: string[] = (await import('../data/reservedUsernames.json')).default
  cache = new Set<string>(raw)
  return cache
}

/**
 * Get Reserved Usernames
 * Returns the cached reserved usernames set synchronously.
 * Throws if the data has not been loaded via `loadReservedUsernames` first.
 *
 * @returns The immutable set of reserved usernames.
 * @throws  {Error} When called before `loadReservedUsernames`.
 */
export function getReservedUsernames(): ReadonlySet<string> {
  if (cache === undefined) {
    throw new Error(
      'Reserved usernames not loaded. Call loadReservedUsernames() first.',
    )
  }
  return cache
}

/**
 * Reset Reserved Usernames Cache
 * Clears the cached set so subsequent calls to `loadReservedUsernames`
 * rebuild it from scratch. Intended for test isolation only.
 */
export function resetReservedUsernamesCache(): void {
  cache = undefined
}
