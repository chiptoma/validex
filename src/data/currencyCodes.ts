// ==============================================================================
// CURRENCY CODES LOADER
// Async loader for ISO 4217 currency codes.
// ------------------------------------------------------------------------------
// Includes all active currency codes plus precious metals (XAU, XAG, XPT, XPD),
// SDR (XDR), and bond market units (XBA, XBB, XBC, XBD).
// ==============================================================================

// ----------------------------------------------------------
// RAW DATA
// ----------------------------------------------------------

const CODES: readonly string[] = [
  'AED',
  'AFN',
  'ALL',
  'AMD',
  'ANG',
  'AOA',
  'ARS',
  'AUD',
  'AWG',
  'AZN',
  'BAM',
  'BBD',
  'BDT',
  'BGN',
  'BHD',
  'BIF',
  'BMD',
  'BND',
  'BOB',
  'BRL',
  'BSD',
  'BTN',
  'BWP',
  'BYN',
  'BZD',
  'CAD',
  'CDF',
  'CHF',
  'CLP',
  'CNY',
  'COP',
  'CRC',
  'CUP',
  'CVE',
  'CZK',
  'DJF',
  'DKK',
  'DOP',
  'DZD',
  'EGP',
  'ERN',
  'ETB',
  'EUR',
  'FJD',
  'FKP',
  'GBP',
  'GEL',
  'GHS',
  'GIP',
  'GMD',
  'GNF',
  'GTQ',
  'GYD',
  'HKD',
  'HNL',
  'HRK',
  'HTG',
  'HUF',
  'IDR',
  'ILS',
  'INR',
  'IQD',
  'IRR',
  'ISK',
  'JMD',
  'JOD',
  'JPY',
  'KES',
  'KGS',
  'KHR',
  'KMF',
  'KPW',
  'KRW',
  'KWD',
  'KYD',
  'KZT',
  'LAK',
  'LBP',
  'LKR',
  'LRD',
  'LSL',
  'LYD',
  'MAD',
  'MDL',
  'MGA',
  'MKD',
  'MMK',
  'MNT',
  'MOP',
  'MRU',
  'MUR',
  'MVR',
  'MWK',
  'MXN',
  'MYR',
  'MZN',
  'NAD',
  'NGN',
  'NIO',
  'NOK',
  'NPR',
  'NZD',
  'OMR',
  'PAB',
  'PEN',
  'PGK',
  'PHP',
  'PKR',
  'PLN',
  'PYG',
  'QAR',
  'RON',
  'RSD',
  'RUB',
  'RWF',
  'SAR',
  'SBD',
  'SCR',
  'SDG',
  'SEK',
  'SGD',
  'SHP',
  'SLE',
  'SOS',
  'SRD',
  'SSP',
  'STN',
  'SVC',
  'SYP',
  'SZL',
  'THB',
  'TJS',
  'TMT',
  'TND',
  'TOP',
  'TRY',
  'TTD',
  'TWD',
  'TZS',
  'UAH',
  'UGX',
  'USD',
  'UYU',
  'UZS',
  'VES',
  'VND',
  'VUV',
  'WST',
  'XAF',
  'XCD',
  'XOF',
  'XPF',
  'YER',
  'ZAR',
  'ZMW',
  'ZWL',
  'XAU',
  'XAG',
  'XPT',
  'XPD',
  'XDR',
  'XBA',
  'XBB',
  'XBC',
  'XBD',
]

// ----------------------------------------------------------
// CACHE
// ----------------------------------------------------------

let cache: ReadonlySet<string> | undefined

// ----------------------------------------------------------
// LOADER
// ----------------------------------------------------------

/**
 * Load Currency Codes
 * Lazily builds and caches a Set of all ISO 4217 currency codes.
 *
 * @returns A ReadonlySet containing every active ISO 4217 code.
 */
export async function loadCurrencyCodes(): Promise<ReadonlySet<string>> {
  if (cache !== undefined)
    return cache

  const result: ReadonlySet<string> = new Set(CODES)
  cache = result
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
