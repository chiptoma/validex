// ==============================================================================
// IBAN PATTERNS LOADER
// Async loader for IBAN country validation patterns (~80 countries).
// ------------------------------------------------------------------------------
// Each entry maps a two-letter country code to its expected IBAN length and a
// regex that validates the full IBAN structure per the ECB IBAN registry.
// ==============================================================================

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/** IbanPattern — IBAN length and structural regex for one country. */
interface IbanPattern {
  readonly length: number
  readonly regex: RegExp
}

// ----------------------------------------------------------
// RAW DATA
// ECB IBAN registry patterns as [countryCode, length, regex].
// ----------------------------------------------------------

/**
 *
 */
type RawEntry = readonly [code: string, length: number, pattern: RegExp]

const RAW_ENTRIES: readonly RawEntry[] = [
  ['AD', 24, /^AD\d{10}[A-Z0-9]{12}$/],
  ['AE', 23, /^AE\d{21}$/],
  ['AL', 28, /^AL\d{10}[A-Z0-9]{16}$/],
  ['AT', 20, /^AT\d{18}$/],
  ['AZ', 28, /^AZ\d{2}[A-Z]{4}[A-Z0-9]{20}$/],
  ['BA', 20, /^BA\d{18}$/],
  ['BE', 16, /^BE\d{14}$/],
  ['BG', 22, /^BG\d{2}[A-Z]{4}\d{6}[A-Z0-9]{8}$/],
  ['BH', 22, /^BH\d{2}[A-Z]{4}[A-Z0-9]{14}$/],
  ['BI', 27, /^BI\d{25}$/],
  ['BR', 29, /^BR\d{25}[A-Z][A-Z0-9]$/],
  ['BY', 28, /^BY\d{2}[A-Z0-9]{4}\d{4}[A-Z0-9]{16}$/],
  ['CH', 21, /^CH\d{7}[A-Z0-9]{12}$/],
  ['CR', 22, /^CR\d{2}0\d{17}$/],
  ['CY', 28, /^CY\d{10}[A-Z0-9]{16}$/],
  ['CZ', 24, /^CZ\d{22}$/],
  ['DE', 22, /^DE\d{20}$/],
  ['DK', 18, /^DK\d{16}$/],
  ['DO', 28, /^DO\d{2}[A-Z0-9]{4}\d{20}$/],
  ['EE', 20, /^EE\d{18}$/],
  ['EG', 29, /^EG\d{27}$/],
  ['ES', 24, /^ES\d{22}$/],
  ['FI', 18, /^FI\d{16}$/],
  ['FO', 18, /^FO\d{16}$/],
  ['FR', 27, /^FR\d{12}[A-Z0-9]{11}\d{2}$/],
  ['GB', 22, /^GB\d{2}[A-Z]{4}\d{14}$/],
  ['GE', 22, /^GE\d{2}[A-Z]{2}\d{16}$/],
  ['GI', 23, /^GI\d{2}[A-Z]{4}[A-Z0-9]{15}$/],
  ['GL', 18, /^GL\d{16}$/],
  ['GR', 27, /^GR\d{9}[A-Z0-9]{16}$/],
  ['GT', 28, /^GT\d{2}[A-Z0-9]{24}$/],
  ['HR', 21, /^HR\d{19}$/],
  ['HU', 28, /^HU\d{26}$/],
  ['IE', 22, /^IE\d{2}[A-Z]{4}\d{14}$/],
  ['IL', 23, /^IL\d{25}$/],
  ['IQ', 23, /^IQ\d{2}[A-Z]{4}\d{15}$/],
  ['IS', 26, /^IS\d{24}$/],
  ['IT', 27, /^IT\d{2}[A-Z]\d{10}[A-Z0-9]{12}$/],
  ['JO', 30, /^JO\d{2}[A-Z]{4}\d{4}[A-Z0-9]{18}$/],
  ['KW', 30, /^KW\d{2}[A-Z]{4}[A-Z0-9]{22}$/],
  ['KZ', 20, /^KZ\d{5}[A-Z0-9]{13}$/],
  ['LB', 28, /^LB\d{6}[A-Z0-9]{20}$/],
  ['LC', 32, /^LC\d{2}[A-Z]{4}[A-Z0-9]{24}$/],
  ['LI', 21, /^LI\d{7}[A-Z0-9]{12}$/],
  ['LT', 20, /^LT\d{18}$/],
  ['LU', 20, /^LU\d{5}[A-Z0-9]{13}$/],
  ['LV', 21, /^LV\d{2}[A-Z]{4}[A-Z0-9]{13}$/],
  ['LY', 25, /^LY\d{23}$/],
  ['MC', 27, /^MC\d{12}[A-Z0-9]{11}\d{2}$/],
  ['MD', 24, /^MD\d{2}[A-Z0-9]{20}$/],
  ['ME', 22, /^ME\d{20}$/],
  ['MK', 19, /^MK\d{5}[A-Z0-9]{10}\d{2}$/],
  ['MR', 27, /^MR\d{25}$/],
  ['MT', 31, /^MT\d{2}[A-Z]{4}\d{5}[A-Z0-9]{18}$/],
  ['MU', 30, /^MU\d{2}[A-Z]{4}\d{19}[A-Z]{3}$/],
  ['NL', 18, /^NL\d{2}[A-Z]{4}\d{10}$/],
  ['NO', 15, /^NO\d{13}$/],
  ['PK', 24, /^PK\d{2}[A-Z]{4}[A-Z0-9]{16}$/],
  ['PL', 28, /^PL\d{26}$/],
  ['PS', 29, /^PS\d{2}[A-Z]{4}[A-Z0-9]{21}$/],
  ['PT', 25, /^PT\d{23}$/],
  ['QA', 29, /^QA\d{2}[A-Z]{4}[A-Z0-9]{21}$/],
  ['RO', 24, /^RO\d{2}[A-Z]{4}[A-Z0-9]{16}$/],
  ['RS', 22, /^RS\d{20}$/],
  ['SA', 24, /^SA\d{4}[A-Z0-9]{18}$/],
  ['SC', 31, /^SC\d{2}[A-Z]{4}\d{20}[A-Z]{3}$/],
  ['SE', 24, /^SE\d{22}$/],
  ['SI', 19, /^SI\d{17}$/],
  ['SK', 24, /^SK\d{22}$/],
  ['SM', 27, /^SM\d{2}[A-Z]\d{10}[A-Z0-9]{12}$/],
  ['ST', 25, /^ST\d{23}$/],
  ['SV', 28, /^SV\d{2}[A-Z]{4}\d{20}$/],
  ['TL', 23, /^TL\d{21}$/],
  ['TN', 24, /^TN\d{22}$/],
  ['TR', 26, /^TR\d{7}[A-Z0-9]{17}$/],
  ['UA', 29, /^UA\d{8}[A-Z0-9]{19}$/],
  ['VA', 22, /^VA\d{20}$/],
  ['VG', 24, /^VG\d{2}[A-Z]{4}\d{16}$/],
  ['XK', 20, /^XK\d{18}$/],
]

// ----------------------------------------------------------
// CACHE
// ----------------------------------------------------------

let cache: ReadonlyMap<string, IbanPattern> | undefined

// ----------------------------------------------------------
// LOADER
// ----------------------------------------------------------

/**
 * Load IBAN Patterns
 * Lazily builds and caches a Map of country codes to IBAN patterns.
 *
 * @returns A ReadonlyMap of two-letter country codes to IbanPattern entries.
 */
export async function loadIbanPatterns(): Promise<ReadonlyMap<string, IbanPattern>> {
  if (cache !== undefined)
    return cache

  const map = new Map<string, IbanPattern>()

  for (const [code, length, regex] of RAW_ENTRIES) {
    map.set(code, { length, regex })
  }

  cache = map
  return cache
}

/**
 * Get IBAN Patterns
 * Synchronously returns previously loaded IBAN patterns.
 *
 * @returns The ReadonlyMap of country codes to IbanPattern entries.
 * @throws  When IBAN patterns have not been loaded yet.
 */
export function getIbanPatterns(): ReadonlyMap<string, IbanPattern> {
  if (cache === undefined) {
    throw new Error(
      'validex: IBAN patterns not loaded. Use parseAsync() or call preloadData() first.',
    )
  }
  return cache
}

/**
 * Clear IBAN Patterns Cache
 * Evicts the cached map. Intended for testing only.
 */
export function clearIbanPatternsCache(): void {
  cache = undefined
}

export type { IbanPattern }
