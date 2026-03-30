// ==============================================================================
// NUXT MODULE
// Nuxt module definition for validex. Works without Nuxt as a hard dependency.
// ------------------------------------------------------------------------------
// NOTE: Nuxt is an optional peer dependency. The createNuxtModule() function
//       returns a plain module definition object consumable by defineNuxtModule.
// ==============================================================================

import type { GlobalConfig, I18nConfig, PreloadOptions } from '../../types'
import { preloadData, setup } from '../../config'

// ----------------------------------------------------------
// MODULE OPTIONS
// ----------------------------------------------------------

/**
 * ValidexNuxtI18nOptions
 * I18n-specific options for the Nuxt module configuration.
 */
export interface ValidexNuxtI18nOptions {
  readonly enabled?: boolean
  readonly prefix?: string
  readonly separator?: string
  readonly pathMode?: I18nConfig['pathMode']
}

/**
 * ValidexNuxtOptions
 * Options accepted by the validex Nuxt module via nuxt.config.ts.
 */
export interface ValidexNuxtOptions {
  readonly rules?: GlobalConfig['rules']
  readonly i18n?: ValidexNuxtI18nOptions
  readonly preload?: PreloadOptions
}

/**
 * NuxtModuleDefinition
 * Plain object describing the Nuxt module, compatible with defineNuxtModule.
 */
export interface NuxtModuleDefinition {
  readonly meta: {
    readonly name: string
    readonly configKey: string
    readonly compatibility: { readonly nuxt: string }
  }
  readonly defaults: ValidexNuxtOptions
  readonly setup: (options: ValidexNuxtOptions) => Promise<void>
}

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Build Config
 * Converts Nuxt module options into a Partial<GlobalConfig> suitable
 * for the setup() call. Only includes fields that are explicitly set.
 *
 * @param opts - The Nuxt module options.
 * @returns A partial GlobalConfig for the setup function.
 */
function buildConfig(opts: ValidexNuxtOptions): Partial<GlobalConfig> {
  const config: Record<string, unknown> = {}

  if (opts.rules !== undefined) {
    config['rules'] = opts.rules
  }

  if (opts.i18n !== undefined) {
    const i18n: Record<string, unknown> = {
      enabled: opts.i18n.enabled ?? false,
    }
    if (opts.i18n.prefix !== undefined) {
      i18n['prefix'] = opts.i18n.prefix
    }
    if (opts.i18n.separator !== undefined) {
      i18n['separator'] = opts.i18n.separator
    }
    if (opts.i18n.pathMode !== undefined) {
      i18n['pathMode'] = opts.i18n.pathMode
    }
    config['i18n'] = i18n
  }

  return config as Partial<GlobalConfig>
}

// ----------------------------------------------------------
// SETUP
// ----------------------------------------------------------

/**
 * Setup Validex
 * Applies validex configuration from Nuxt module options and optionally
 * preloads async data. Can be used standalone outside of Nuxt.
 *
 * @param options - The module options to apply.
 * @returns A promise that resolves when setup and preloading complete.
 */
export async function setupValidex(
  options: ValidexNuxtOptions = {},
): Promise<void> {
  setup(buildConfig(options))

  if (options.preload !== undefined) {
    await preloadData(options.preload)
  }
}

// ----------------------------------------------------------
// NUXT I18N DETECTION
// ----------------------------------------------------------

/**
 * Detect Nuxt I18n
 * Checks whether @nuxtjs/i18n is present in the list of installed modules.
 * Returns true when the i18n module name is found.
 *
 * @param installedModules - Array of module name strings from Nuxt config.
 * @returns Whether @nuxtjs/i18n is detected.
 */
export function detectNuxtI18n(
  installedModules: readonly string[],
): boolean {
  return installedModules.some(
    mod => mod === '@nuxtjs/i18n' || mod === 'nuxt-i18n',
  )
}

// ----------------------------------------------------------
// MODULE FACTORY
// ----------------------------------------------------------

/**
 * Create Nuxt Module
 * Returns a plain module definition object that can be passed to
 * Nuxt's defineNuxtModule(). Does not import @nuxt/kit directly.
 *
 * @returns A NuxtModuleDefinition compatible with defineNuxtModule.
 */
export function createNuxtModule(): NuxtModuleDefinition {
  return {
    meta: {
      name: 'validex',
      configKey: 'validex',
      compatibility: { nuxt: '>=3.0.0' },
    },
    defaults: {},
    setup: setupValidex,
  }
}
