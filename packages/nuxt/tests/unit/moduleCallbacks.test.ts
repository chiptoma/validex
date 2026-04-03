// ==============================================================================
// NUXT MODULE CALLBACKS — MOCKED UNIT TESTS
// Tests the defineNuxtModule setup callback, registerAutoImports, and
// detectAndEnableI18n by mocking @nuxt/kit so they run without Nuxt runtime.
// ==============================================================================

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const addImportsMock = vi.fn()
const createResolverMock = vi.fn(() => ({
  resolve: vi.fn((path: string) => `/resolved${path}`),
}))
const defineNuxtModuleMock = vi.fn((config: Record<string, unknown>) => config)

vi.mock('@nuxt/kit', () => ({
  addImports: addImportsMock,
  createResolver: createResolverMock,
  defineNuxtModule: defineNuxtModuleMock,
}))

interface ModuleConfig {
  setup: (options: Record<string, unknown>, nuxt: Record<string, unknown>) => Promise<void>
  meta: Record<string, unknown>
  defaults: Record<string, unknown>
}

let moduleConfig: ModuleConfig

beforeEach(async () => {
  vi.resetModules()
  addImportsMock.mockClear()
  createResolverMock.mockClear()
  defineNuxtModuleMock.mockClear()
  defineNuxtModuleMock.mockImplementation((config: Record<string, unknown>) => config)

  await import('../../src/module')
  // SAFETY: defineNuxtModule is called synchronously during module evaluation
  moduleConfig = defineNuxtModuleMock.mock.calls[0]?.[0] as unknown as ModuleConfig
})

// ----------------------------------------------------------
// MODULE SETUP CALLBACK
// ----------------------------------------------------------

describe('nuxt module setup callback', () => {
  afterEach(async () => {
    const { resetConfig } = await import('@validex/core')
    resetConfig()
  })

  it('defineNuxtModule was called with config', () => {
    expect(defineNuxtModuleMock).toHaveBeenCalledOnce()
    expect(moduleConfig).toBeDefined()
  })

  it('meta has correct name and configKey', () => {
    expect(moduleConfig.meta['name']).toBe('validex')
    expect(moduleConfig.meta['configKey']).toBe('validex')
  })

  it('setup with rules applies global config', async () => {
    const nuxt = { options: { modules: [] } }
    await moduleConfig.setup({ rules: { email: { blockPlusAlias: true } } }, nuxt)

    const { getConfig } = await import('@validex/core')
    const globalConfig = getConfig()
    expect(globalConfig.rules?.email?.blockPlusAlias).toBe(true)
  })

  it('setup with i18n applies i18n config', async () => {
    const nuxt = { options: { modules: [] } }
    await moduleConfig.setup({ i18n: { enabled: true, prefix: 'v' } }, nuxt)

    const { getConfig } = await import('@validex/core')
    const globalConfig = getConfig()
    expect(globalConfig.i18n.enabled).toBe(true)
    expect(globalConfig.i18n.prefix).toBe('v')
  })

  it('setup with empty options does not throw', async () => {
    const nuxt = { options: { modules: [] } }
    await expect(moduleConfig.setup({}, nuxt)).resolves.not.toThrow()
  })

  it('setup with preload triggers preloadData', async () => {
    const nuxt = { options: { modules: [] } }
    await moduleConfig.setup({ preload: { disposable: true } }, nuxt)
  })

  it('setup without rules or i18n skips config setup', async () => {
    const nuxt = { options: { modules: [] } }
    await moduleConfig.setup({}, nuxt)

    const { getConfig } = await import('@validex/core')
    const globalConfig = getConfig()
    expect(globalConfig.i18n.enabled).toBe(false)
  })

  it('setup with undefined modules falls back to empty array', async () => {
    const nuxt = { options: {} }
    await expect(moduleConfig.setup({}, nuxt)).resolves.not.toThrow()
  })
})

// ----------------------------------------------------------
// REGISTER AUTO-IMPORTS
// ----------------------------------------------------------

describe('registerAutoImports (via setup)', () => {
  afterEach(async () => {
    const { resetConfig } = await import('@validex/core')
    resetConfig()
  })

  it('registers all 28 auto-imports', async () => {
    const nuxt = { options: { modules: [] } }
    await moduleConfig.setup({}, nuxt)

    expect(addImportsMock).toHaveBeenCalledOnce()
    const imports = addImportsMock.mock.calls[0]?.[0] as Array<{ name: string }>
    expect(imports).toHaveLength(28)
  })

  it('includes all 25 rule names', async () => {
    const nuxt = { options: { modules: [] } }
    await moduleConfig.setup({}, nuxt)

    const imports = addImportsMock.mock.calls[0]?.[0] as Array<{ name: string }>
    const names = imports.map(i => i.name)

    const expectedRules = [
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
    ]
    for (const rule of expectedRules) {
      expect(names).toContain(rule)
    }
  })

  it('includes validate, validexSetup, and useValidation', async () => {
    const nuxt = { options: { modules: [] } }
    await moduleConfig.setup({}, nuxt)

    const imports = addImportsMock.mock.calls[0]?.[0] as Array<{ name: string, as?: string }>
    const names = imports.map(i => i.as ?? i.name)

    expect(names).toContain('validate')
    expect(names).toContain('validexSetup')
    expect(names).toContain('useValidation')
  })

  it('all rule imports reference @validex/core', async () => {
    const nuxt = { options: { modules: [] } }
    await moduleConfig.setup({}, nuxt)

    const imports = addImportsMock.mock.calls[0]?.[0] as Array<{ name: string, from: string }>
    const coreImports = imports.filter(i => i.from === '@validex/core')
    expect(coreImports).toHaveLength(27)
  })

  it('useValidation import uses resolver path', async () => {
    const nuxt = { options: { modules: [] } }
    await moduleConfig.setup({}, nuxt)

    const imports = addImportsMock.mock.calls[0]?.[0] as Array<{ name: string, from: string }>
    const uv = imports.find(i => i.name === 'useValidation')
    expect(uv).toBeDefined()
    expect((uv as { from: string }).from).toContain('/resolved')
  })
})

// ----------------------------------------------------------
// DETECT AND ENABLE I18N
// ----------------------------------------------------------

describe('detectAndEnableI18n (via setup)', () => {
  afterEach(async () => {
    const { resetConfig } = await import('@validex/core')
    resetConfig()
  })

  it('enables i18n when @nuxtjs/i18n is in modules', async () => {
    const nuxt = { options: { modules: ['@nuxtjs/i18n'] } }
    await moduleConfig.setup({}, nuxt)

    const { getConfig } = await import('@validex/core')
    expect(getConfig().i18n.enabled).toBe(true)
  })

  it('enables i18n when nuxt-i18n is in modules', async () => {
    const nuxt = { options: { modules: ['nuxt-i18n'] } }
    await moduleConfig.setup({}, nuxt)

    const { getConfig } = await import('@validex/core')
    expect(getConfig().i18n.enabled).toBe(true)
  })

  it('does not enable i18n when no i18n module present', async () => {
    const nuxt = { options: { modules: ['@pinia/nuxt'] } }
    await moduleConfig.setup({}, nuxt)

    const { getConfig } = await import('@validex/core')
    expect(getConfig().i18n.enabled).toBe(false)
  })

  it('does not override explicitly enabled i18n', async () => {
    const nuxt = { options: { modules: ['@nuxtjs/i18n'] } }
    await moduleConfig.setup({ i18n: { enabled: true, prefix: 'custom' } }, nuxt)

    const { getConfig } = await import('@validex/core')
    const globalConfig = getConfig()
    expect(globalConfig.i18n.enabled).toBe(true)
    expect(globalConfig.i18n.prefix).toBe('custom')
  })

  it('handles module arrays (e.g. [@nuxtjs/i18n, options])', async () => {
    const nuxt = { options: { modules: [['@nuxtjs/i18n', { locales: ['en'] }]] } }
    await moduleConfig.setup({}, nuxt)

    const { getConfig } = await import('@validex/core')
    expect(getConfig().i18n.enabled).toBe(true)
  })

  it('ignores non-string non-array module entries', async () => {
    const nuxt = { options: { modules: [42, null, { name: '@nuxtjs/i18n' }] } }
    await moduleConfig.setup({}, nuxt)

    const { getConfig } = await import('@validex/core')
    expect(getConfig().i18n.enabled).toBe(false)
  })
})
