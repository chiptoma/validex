// ==============================================================================
// NUXT MODULE
// Nuxt module definition for validex using @nuxt/kit. Also exports standalone
// helpers for use outside of a Nuxt context.
// ------------------------------------------------------------------------------
// NOTE: @nuxt/kit is a regular dependency so the module import works at runtime.
// ==============================================================================

import type { Resolver } from '@nuxt/kit'
import type { GlobalConfig, I18nConfig, PreloadOptions } from '@validex/core'
import { addImports, createResolver, defineNuxtModule } from '@nuxt/kit'
import { preloadData, setup } from '@validex/core'

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

// ----------------------------------------------------------
// NUXT MODULE (DEFAULT EXPORT)
// ----------------------------------------------------------

export default defineNuxtModule<ValidexNuxtOptions>({
  meta: {
    name: 'validex',
    configKey: 'validex',
    compatibility: { nuxt: '>=3.0.0' },
  },
  defaults: {},
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url)

    if (options.rules !== undefined || options.i18n !== undefined) {
      setup(buildConfig(options))
    }

    registerAutoImports(resolver)
    detectAndEnableI18n(nuxt.options.modules ?? [], options)

    if (options.preload !== undefined) {
      await preloadData(options.preload)
    }
  },
})

// ----------------------------------------------------------
// AUTO-IMPORTS
// ----------------------------------------------------------

/**
 * Register Auto Imports
 * Registers all 25 rules, core utilities, and the composable as Nuxt
 * auto-imports so they are available without explicit import statements.
 *
 * @param resolver - The Nuxt module resolver instance.
 */
function registerAutoImports(resolver: Resolver): void {
  const core = '@validex/core'

  addImports([
    { name: 'BusinessName', from: core },
    { name: 'Color', from: core },
    { name: 'Country', from: core },
    { name: 'CreditCard', from: core },
    { name: 'Currency', from: core },
    { name: 'DateTime', from: core },
    { name: 'Email', from: core },
    { name: 'Iban', from: core },
    { name: 'IpAddress', from: core },
    { name: 'Jwt', from: core },
    { name: 'LicenseKey', from: core },
    { name: 'MacAddress', from: core },
    { name: 'Password', from: core },
    { name: 'PasswordConfirmation', from: core },
    { name: 'PersonName', from: core },
    { name: 'Phone', from: core },
    { name: 'PostalCode', from: core },
    { name: 'Slug', from: core },
    { name: 'Text', from: core },
    { name: 'Token', from: core },
    { name: 'Url', from: core },
    { name: 'Username', from: core },
    { name: 'Uuid', from: core },
    { name: 'VatNumber', from: core },
    { name: 'Website', from: core },
    { name: 'validate', from: core },
    { name: 'setup', as: 'validexSetup', from: core },
    { name: 'useValidation', from: resolver.resolve('./composables') },
  ])
}

// ----------------------------------------------------------
// I18N DETECTION
// ----------------------------------------------------------

/**
 * Detect And Enable I18n
 * Checks the installed Nuxt modules for @nuxtjs/i18n and auto-enables
 * validex i18n mode when found and not already explicitly enabled.
 *
 * @param modules - The raw modules array from nuxt.options.modules.
 * @param options - The validex module options.
 */
function detectAndEnableI18n(
  modules: readonly unknown[],
  options: ValidexNuxtOptions,
): void {
  const hasI18n = modules.some((m: unknown) => {
    let name = ''
    if (typeof m === 'string') {
      name = m
    }
    else if (Array.isArray(m) && typeof m[0] === 'string') {
      name = m[0]
    }
    return name === '@nuxtjs/i18n' || name === 'nuxt-i18n'
  })
  if (hasI18n && options.i18n?.enabled !== true) {
    setup({ i18n: { enabled: true } })
  }
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

  // SAFETY: config is built from validated NuxtOptions fields; structurally matches Partial<GlobalConfig>
  return config as Partial<GlobalConfig>
}

// ----------------------------------------------------------
// STANDALONE HELPERS
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
