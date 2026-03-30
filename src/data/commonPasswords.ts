// ==============================================================================
// COMMON PASSWORDS LOADER
// Async loader for the top 10,000 most common passwords from breach data.
// ------------------------------------------------------------------------------
// Passwords are organized into three cumulative tiers:
//   basic    — top 100 (inline)
//   moderate — top 1,000 (basic + tier2 JSON import)
//   strict   — top 10,000 (moderate + tier3 JSON import)
// ==============================================================================

/** Tier type for password strength checking granularity. */
type PasswordTier = 'basic' | 'moderate' | 'strict'

// ----------------------------------------------------------
// TIER 1 DATA (TOP 100)
// ----------------------------------------------------------

const TIER1: readonly string[] = [
  '123456',
  'password',
  '12345678',
  'qwerty',
  '123456789',
  '12345',
  '1234',
  '111111',
  '1234567',
  'dragon',
  '123123',
  'baseball',
  'abc123',
  'football',
  'monkey',
  'letmein',
  'shadow',
  'master',
  '666666',
  'qwertyuiop',
  '123321',
  'mustang',
  '1234567890',
  'michael',
  '654321',
  'superman',
  '1qaz2wsx',
  '7777777',
  '121212',
  '000000',
  'qazwsx',
  '123qwe',
  'killer',
  'trustno1',
  'jordan',
  'jennifer',
  'zxcvbnm',
  'asdfgh',
  'hunter',
  'buster',
  'soccer',
  'harley',
  'batman',
  'andrew',
  'tigger',
  'sunshine',
  'iloveyou',
  '2000',
  'charlie',
  'robert',
  'thomas',
  'hockey',
  'ranger',
  'daniel',
  'starwars',
  'klaster',
  '112233',
  'george',
  'computer',
  'michelle',
  'jessica',
  'pepper',
  '1111',
  'zxcvbn',
  '555555',
  '11111111',
  '131313',
  'freedom',
  '777777',
  'pass',
  'maggie',
  '159753',
  'aaaaaa',
  'ginger',
  'princess',
  'joshua',
  'cheese',
  'amanda',
  'summer',
  'love',
  'ashley',
  'nicole',
  'chelsea',
  'biteme',
  'matthew',
  'access',
  'yankees',
  '987654321',
  'dallas',
  'austin',
  'thunder',
  'taylor',
  'matrix',
  'mobilemail',
  'master1',
  'diamond',
  'whatever',
  'bailey',
  'nothing',
  'phoenix',
]

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
    const result: ReadonlySet<string> = new Set(TIER1)
    cache.basic = result
    return result
  }

  if (tier === 'moderate') {
    const { default: tier2 } = await import('./passwords-tier2.json')
    const result: ReadonlySet<string> = new Set([...TIER1, ...tier2])
    cache.moderate = result
    return result
  }

  const { default: tier2 } = await import('./passwords-tier2.json')
  const { default: tier3 } = await import('./passwords-tier3.json')
  const result: ReadonlySet<string> = new Set([...TIER1, ...tier2, ...tier3])
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
