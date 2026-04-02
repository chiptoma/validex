// ==============================================================================
// COMMON PASSWORDS LOADER
// Async loader for the top 10,000 most common passwords from breach data.
// ------------------------------------------------------------------------------
// Data source: SecLists xato-net-10-million-passwords (MIT license)
// https://github.com/danielmiessler/SecLists
// Derived from real breach datasets (RockYou, LinkedIn, Adobe, etc.)
//
// Passwords are organized into three cumulative tiers:
//   basic    — top 100 (tier1 JSON import)
//   moderate — top 1,000 (basic + tier2 JSON import)
//   strict   — top 10,000 (moderate + tier3 JSON import)
// ==============================================================================

/** Tier type for password strength checking granularity. */
type PasswordTier = 'basic' | 'moderate' | 'strict'

// ----------------------------------------------------------
// CACHE
// ----------------------------------------------------------

const cache: Record<PasswordTier, ReadonlySet<string> | undefined> = {
  basic: undefined,
  moderate: undefined,
  strict: undefined,
}

// ----------------------------------------------------------
// LOADER
// ----------------------------------------------------------

/**
 * Load Common Passwords
 * Lazily loads and caches common passwords for the requested tier.
 *
 * @param tier - Granularity level: basic (100), moderate (1k), strict (10k).
 * @returns A ReadonlySet containing all passwords for the requested tier.
 */
export async function loadCommonPasswords(
  tier: PasswordTier = 'basic',
): Promise<ReadonlySet<string>> {
  const cached = cache[tier]
  if (cached !== undefined)
    return cached

  if (tier === 'basic') {
    const { default: tier1 } = await import('../data/passwordsTier1.json')
    const result: ReadonlySet<string> = new Set(tier1)
    cache.basic = result
    return result
  }

  if (tier === 'moderate') {
    const { default: tier1 } = await import('../data/passwordsTier1.json')
    const { default: tier2 } = await import('../data/passwordsTier2.json')
    const result: ReadonlySet<string> = new Set([...tier1, ...tier2])
    cache.moderate = result
    return result
  }

  const { default: tier1 } = await import('../data/passwordsTier1.json')
  const { default: tier2 } = await import('../data/passwordsTier2.json')
  const { default: tier3 } = await import('../data/passwordsTier3.json')
  const result: ReadonlySet<string> = new Set([...tier1, ...tier2, ...tier3])
  cache.strict = result
  return result
}

/**
 * Get Common Passwords
 * Synchronously returns previously loaded common passwords for a tier.
 *
 * @param tier - Granularity level to retrieve (must have been loaded first).
 * @returns The ReadonlySet of passwords for the specified tier.
 * @throws When the requested tier has not been loaded yet.
 */
export function getCommonPasswords(
  tier: PasswordTier = 'basic',
): ReadonlySet<string> {
  const cached = cache[tier]
  if (cached === undefined) {
    throw new Error(
      'validex: Common passwords not loaded. Use parseAsync() or call preloadData() first.',
    )
  }
  return cached
}

/**
 * Clear Common Passwords Cache
 * Evicts cached password sets. Intended for testing only.
 */
export function clearCommonPasswordsCache(): void {
  cache.basic = undefined
  cache.moderate = undefined
  cache.strict = undefined
}
