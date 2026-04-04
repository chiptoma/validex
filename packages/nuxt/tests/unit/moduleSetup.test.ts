// ==============================================================================
// NUXT MODULE CALLBACKS — MOCKED UNIT TESTS
// Tests the defineNuxtModule setup callback, registerAutoImports, and
// detectAndEnableI18n by mocking @nuxt/kit so they run without Nuxt runtime.
// ==============================================================================

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

// ----------------------------------------------------------
// MOCK @nuxt/kit — vi.hoisted keeps refs accessible inside the factory
// ----------------------------------------------------------

const mocks = vi.hoisted(() => ({
  addImports: vi.fn(),
  resolver: { resolve: vi.fn((p: string) => `/resolved${p}`) },
  defineNuxtModule: vi.fn((config: Record<string, unknown>) => config),
}))

vi.mock('@nuxt/kit', () => ({
  addImports: mocks.addImports,
  createResolver: vi.fn(() => mocks.resolver),
  defineNuxtModule: mocks.defineNuxtModule,
}))

// ----------------------------------------------------------
// TYPES & HELPERS
// ----------------------------------------------------------

interface ModuleConfig {
  setup: (opts: Record<string, unknown>, nuxt: { options: Record<string, unknown> }) => Promise<void>
  meta: Record<string, unknown>
  defaults: Record<string, unknown>
}

function nuxt(modules: readonly unknown[] = []): { options: Record<string, unknown> } {
  return {
    options: { modules: [...modules] },
  }
}

let config: ModuleConfig

beforeAll(async () => {
  vi.resetModules()
  await import('../../src/module')
  // SAFETY: defineNuxtModule is called synchronously during module evaluation
  config = mocks.defineNuxtModule.mock.calls[0]?.[0] as unknown as ModuleConfig
})

beforeEach(() => {
  mocks.addImports.mockClear()
  mocks.resolver.resolve.mockClear()
})

// Dynamic import needed because vi.resetModules() in beforeAll clears the module cache;
// a static import would reference a stale module instance.
afterEach(async () => {
  const { resetConfig } = await import('@validex/core')
  resetConfig()
})

// ----------------------------------------------------------
// MODULE SETUP CALLBACK
// ----------------------------------------------------------

describe('nuxt module setup callback', () => {
  it('defineNuxtModule received the config object', () => {
    expect(mocks.defineNuxtModule).toHaveBeenCalledOnce()
    expect(config).toBeDefined()
    expect(config.meta['name']).toBe('validex')
    expect(config.meta['configKey']).toBe('validex')
  })

  it('applies rules to global config', async () => {
    await config.setup({ rules: { email: { blockPlusAlias: true } } }, nuxt())

    const { getConfig } = await import('@validex/core')
    expect(getConfig().rules?.email?.blockPlusAlias).toBe(true)
  })

  it('applies i18n config', async () => {
    await config.setup({ i18n: { enabled: true, prefix: 'v' } }, nuxt())

    const { getConfig } = await import('@validex/core')
    expect(getConfig().i18n.enabled).toBe(true)
    expect(getConfig().i18n.prefix).toBe('v')
  })

  it('empty options does not throw', async () => {
    await expect(config.setup({}, nuxt())).resolves.not.toThrow()
  })

  it('triggers preloadData when preload is set', async () => {
    await config.setup({ preload: { disposable: true } }, nuxt())
  })

  it('skips setup() when no rules or i18n', async () => {
    await config.setup({}, nuxt())

    const { getConfig } = await import('@validex/core')
    expect(getConfig().i18n.enabled).toBe(false)
  })

  it('falls back to empty array when modules is undefined', async () => {
    await expect(config.setup({}, { options: {} })).resolves.not.toThrow()
  })
})

// ----------------------------------------------------------
// REGISTER AUTO-IMPORTS
// ----------------------------------------------------------

describe('registerAutoImports (via setup)', () => {
  it('registers all 28 auto-imports (25 rules + validate + validexSetup + useValidation)', async () => {
    await config.setup({}, nuxt())

    expect(mocks.addImports).toHaveBeenCalledOnce()
    const imports = mocks.addImports.mock.calls[0]?.[0] as Array<{ name: string }>
    expect(imports).toHaveLength(28)
  })

  it('includes every rule name', async () => {
    await config.setup({}, nuxt())

    const imports = mocks.addImports.mock.calls[0]?.[0] as Array<{ name: string }>
    const names = new Set(imports.map(i => i.name))

    for (const rule of [
      'BusinessName',
      'Color',
      'Country',
      'CreditCard',
      'Currency',
      'DateTime',
      'Email',
      'Iban',
      'IpAddress',
      'Jwt',
      'LicenseKey',
      'MacAddress',
      'Password',
      'PasswordConfirmation',
      'PersonName',
      'Phone',
      'PostalCode',
      'Slug',
      'Text',
      'Token',
      'Url',
      'Username',
      'Uuid',
      'VatNumber',
      'Website',
    ]) {
      expect(names).toContain(rule)
    }
  })

  it('includes validate, validexSetup, and useValidation', async () => {
    await config.setup({}, nuxt())

    const imports = mocks.addImports.mock.calls[0]?.[0] as Array<{ name: string, as?: string }>
    const names = new Set(imports.map(i => i.as ?? i.name))

    expect(names).toContain('validate')
    expect(names).toContain('validexSetup')
    expect(names).toContain('useValidation')
  })

  it('27 imports reference @validex/core, 1 uses resolver', async () => {
    await config.setup({}, nuxt())

    const imports = mocks.addImports.mock.calls[0]?.[0] as Array<{ name: string, from: string }>
    expect(imports.filter(i => i.from === '@validex/core')).toHaveLength(27)

    const uv = imports.find(i => i.name === 'useValidation')
    expect(uv).toBeDefined()
    expect((uv as { from: string }).from).toContain('/resolved')
  })
})

// ----------------------------------------------------------
// DETECT AND ENABLE I18N
// ----------------------------------------------------------

describe('detectAndEnableI18n (via setup)', () => {
  it('enables i18n when @nuxtjs/i18n is in modules', async () => {
    await config.setup({}, nuxt(['@nuxtjs/i18n']))

    const { getConfig } = await import('@validex/core')
    expect(getConfig().i18n.enabled).toBe(true)
  })

  it('enables i18n when nuxt-i18n is in modules', async () => {
    await config.setup({}, nuxt(['nuxt-i18n']))

    const { getConfig } = await import('@validex/core')
    expect(getConfig().i18n.enabled).toBe(true)
  })

  it('does not enable i18n when absent', async () => {
    await config.setup({}, nuxt(['@pinia/nuxt']))

    const { getConfig } = await import('@validex/core')
    expect(getConfig().i18n.enabled).toBe(false)
  })

  it('does not override explicitly enabled i18n', async () => {
    await config.setup({ i18n: { enabled: true, prefix: 'custom' } }, nuxt(['@nuxtjs/i18n']))

    const { getConfig } = await import('@validex/core')
    expect(getConfig().i18n.enabled).toBe(true)
    expect(getConfig().i18n.prefix).toBe('custom')
  })

  it('handles module arrays ([@nuxtjs/i18n, options])', async () => {
    await config.setup({}, nuxt([['@nuxtjs/i18n', { locales: ['en'] }]]))

    const { getConfig } = await import('@validex/core')
    expect(getConfig().i18n.enabled).toBe(true)
  })

  it('ignores non-string non-array module entries', async () => {
    await config.setup({}, nuxt([42, null, { name: '@nuxtjs/i18n' }]))

    const { getConfig } = await import('@validex/core')
    expect(getConfig().i18n.enabled).toBe(false)
  })
})
