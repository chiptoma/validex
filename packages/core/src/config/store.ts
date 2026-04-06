// ==============================================================================
// CONFIG STORE
// Module-level singleton for global configuration state.
// ==============================================================================

import type { GlobalConfig } from '../types'

import { _resetCustomErrorFlag } from '@core/customError'

/**
 * Default i18n configuration.
 */
const DEFAULT_I18N: GlobalConfig['i18n'] = {
  enabled: false,
  prefix: 'validation',
  separator: '.',
  pathMode: 'semantic',
}

/**
 * Default global configuration.
 */
const DEFAULT_CONFIG: GlobalConfig = {
  i18n: DEFAULT_I18N,
  label: { fallback: 'derived' },
}

let config: GlobalConfig = { ...DEFAULT_CONFIG, i18n: { ...DEFAULT_I18N } }
let initialized = false

/**
 * Get Config
 * Returns the current global configuration.
 *
 * @returns The current readonly global configuration.
 */
export function getConfig(): Readonly<GlobalConfig> {
  return config
}

/**
 * Set Config
 * Replaces the current global configuration.
 *
 * @param newConfig - The new configuration to set.
 */
export function setConfig(newConfig: GlobalConfig): void {
  config = newConfig
  initialized = true
}

/**
 * Is Initialized
 * Returns whether setup() has been called.
 *
 * @returns True if the config store has been explicitly initialized.
 */
export function isInitialized(): boolean {
  return initialized
}

/**
 * Reset Config
 * Resets configuration to defaults. Used for testing only.
 */
export function resetConfig(): void {
  config = { ...DEFAULT_CONFIG, i18n: { ...DEFAULT_I18N } }
  initialized = false
  _resetCustomErrorFlag()
}
