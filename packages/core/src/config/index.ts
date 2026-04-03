// ==============================================================================
// CONFIGURATION API
// Public configuration interface for validex.
// ==============================================================================

import type { GlobalConfig, PreloadOptions } from '../types'

import { initAugmentation } from '@augmentation'

import { deepMergeTwo } from './merge'
import { getConfig as getStoreConfig, isInitialized, setConfig } from './store'

/**
 * Configure
 * Deep-merges the given config into the current global configuration.
 * Can be called multiple times — each call merges, never replaces.
 * Does NOT register the Zod customError handler (use setup() for that).
 *
 * @param config - Partial configuration to merge.
 */
export function configure(config: Partial<GlobalConfig>): void {
  const current = getStoreConfig()
  // SAFETY: GlobalConfig and Record<string, unknown> are structurally compatible
  // plain objects; double cast bridges the typed config to the untyped deep merge
  const merged = deepMergeTwo(
    current as unknown as Record<string, unknown>,
    config as unknown as Record<string, unknown>,
  )
  setConfig(merged as unknown as GlobalConfig)
}

/**
 * Setup
 * Configures validex globally and registers the customError handler with Zod.
 * Deep merges with existing config if called multiple times.
 *
 * @param config - Partial configuration to apply.
 */
export function setup(config?: Partial<GlobalConfig>): void {
  if (config !== undefined) {
    configure(config)
  }
  else if (!isInitialized()) {
    setConfig(getStoreConfig())
  }
  initAugmentation()
}

/**
 * Get Config
 * Returns the current global configuration.
 *
 * @returns The current readonly global configuration.
 */
export function getConfig(): Readonly<GlobalConfig> {
  return getStoreConfig()
}

/**
 * Preload Data
 * Preloads async data files at startup so that sync .parse() works everywhere.
 * Safe to call multiple times — already-loaded data is cached.
 *
 * @param options - Which data files to preload.
 * @returns A promise that resolves when all requested data is loaded.
 */
export async function preloadData(options: PreloadOptions): Promise<void> {
  const tasks: Promise<unknown>[] = []

  if (options.disposable === true) {
    const { loadDisposableDomains } = await import('../loaders/disposableDomains')
    tasks.push(loadDisposableDomains())
  }

  if (options.passwords !== undefined && options.passwords !== false) {
    const tier = options.passwords === true ? 'basic' : options.passwords
    const { loadCommonPasswords } = await import('../loaders/commonPasswords')
    tasks.push(loadCommonPasswords(tier))
  }

  if (options.reserved === true) {
    const { loadReservedUsernames } = await import('../loaders/reservedUsernames')
    tasks.push(loadReservedUsernames())
  }

  if (options.phone !== undefined) {
    const { loadPhoneParser } = await import('../loaders/phoneParser')
    tasks.push(loadPhoneParser(options.phone))
  }

  if (options.countryCodes === true) {
    const { loadCountryCodes } = await import('../loaders/countryCodes')
    tasks.push(loadCountryCodes())
  }

  if (options.currencyCodes === true) {
    const { loadCurrencyCodes } = await import('../loaders/currencyCodes')
    tasks.push(loadCurrencyCodes())
  }

  if (options.ibanPatterns === true) {
    const { loadIbanPatterns } = await import('../loaders/ibanPatterns')
    tasks.push(loadIbanPatterns())
  }

  if (options.vatPatterns === true) {
    const { loadVatPatterns } = await import('../loaders/vatPatterns')
    tasks.push(loadVatPatterns())
  }

  if (options.creditCardPrefixes === true) {
    const { loadCreditCardPrefixes } = await import('../loaders/creditCardPrefixes')
    tasks.push(loadCreditCardPrefixes())
  }

  if (options.postalCodes === true) {
    const { loadPostalCodes } = await import('../loaders/postalCodes')
    tasks.push(loadPostalCodes())
  }

  await Promise.all(tasks)
}

export { resetConfig } from './store'
