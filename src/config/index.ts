// ==============================================================================
// CONFIGURATION API
// Public configuration interface for validex.
// ==============================================================================

import type { GlobalConfig, PreloadOptions } from '../types'
import { deepMergeTwo } from './merge'
import { getConfig as getStoreConfig, isInitialized, setConfig } from './store'

/**
 * Setup
 * Configures validex globally. Deep merges with existing config if called
 * multiple times. Registers the customError handler with Zod.
 *
 * @param config - Partial configuration to apply.
 */
export function setup(config?: Partial<GlobalConfig>): void {
  if (config !== undefined) {
    const current = getStoreConfig()
    // SAFETY: GlobalConfig and Record<string, unknown> are structurally compatible
    // plain objects; double cast bridges the typed config to the untyped deep merge
    const merged = deepMergeTwo(
      current as unknown as Record<string, unknown>,
      config as unknown as Record<string, unknown>,
    )
    setConfig(merged as unknown as GlobalConfig)
  }
  else if (!isInitialized()) {
    setConfig(getStoreConfig())
  }
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
 * @param _options - Which data files to preload.
 * @returns A promise that resolves when all requested data is loaded.
 */
export async function preloadData(_options: PreloadOptions): Promise<void> {
  // Data loading will be implemented in Phase 3.
  // Each data file has its own loadX() function that will be called here.
  await Promise.resolve()
}

export { resetConfig } from './store'
