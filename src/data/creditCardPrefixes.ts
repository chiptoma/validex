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

// ----------------------------------------------------------
// RAW DATA
// ----------------------------------------------------------

const ISSUERS: ReadonlyArray<readonly [string, CardIssuer]> = [
  [
    'visa',
    {
      name: 'Visa',
      prefixes: ['4'],
      lengths: [13, 16, 19],
    },
  ],
  [
    'mastercard',
    {
      name: 'Mastercard',
      prefixes: ['51', '52', '53', '54', '55', '2221-2720'],
      lengths: [16],
    },
  ],
  [
    'amex',
    {
      name: 'American Express',
      prefixes: ['34', '37'],
      lengths: [15],
    },
  ],
  [
    'discover',
    {
      name: 'Discover',
      prefixes: ['6011', '644', '645', '646', '647', '648', '649', '65'],
      lengths: [16, 17, 18, 19],
    },
  ],
  [
    'diners',
    {
      name: 'Diners Club',
      prefixes: ['300', '301', '302', '303', '304', '305', '36', '38'],
      lengths: [14, 16, 17, 18, 19],
    },
  ],
  [
    'jcb',
    {
      name: 'JCB',
      prefixes: ['3528-3589'],
      lengths: [15, 16, 17, 18, 19],
    },
  ],
  [
    'unionpay',
    {
      name: 'UnionPay',
      prefixes: ['62'],
      lengths: [16, 17, 18, 19],
    },
  ],
]

// ----------------------------------------------------------
// CACHE
// ----------------------------------------------------------

let cache: ReadonlyMap<string, CardIssuer> | undefined

// ----------------------------------------------------------
// LOADER
// ----------------------------------------------------------

/**
 * Load Credit Card Prefixes
 * Lazily builds and caches a Map of issuer identifiers to CardIssuer data.
 *
 * @returns A ReadonlyMap of issuer keys to CardIssuer entries.
 */
export async function loadCreditCardPrefixes(): Promise<ReadonlyMap<string, CardIssuer>> {
  if (cache !== undefined)
    return cache

  const map = new Map<string, CardIssuer>()

  for (const [key, issuer] of ISSUERS) {
    map.set(key, issuer)
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
