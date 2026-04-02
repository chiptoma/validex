// ==============================================================================
// SIZE-LIMIT CONFIGURATION
// Measures real-world bundle sizes with tree-shaking.
// ==============================================================================

const EXTERNAL = [
  'zod',
  'libphonenumber-js',
  'libphonenumber-js/core',
  'postcode-validator',
  'disposable-email-domains',
]

// Data chunks loaded on demand via dynamic import() — excluded from
// measurement because real bundlers (Vite, webpack) keep them as
// lazy chunks outside the initial bundle.
const LAZY_DATA = [
  './countryCodes*',
  './passwordsTier*',
  './creditCardPrefixes*',
  './currencyCodes*',
  './ibanPatterns*',
  './reservedUsernames*',
  './vatPatterns*',
  './postalCodes*',
  './phoneParser*',
  './commonPasswords*',
  './phoneDetection*',
  './disposableDomains*',
]

/**
 * Externalize lazy-loaded data chunks so esbuild skips them —
 * matching real bundler behavior where dynamic imports are
 * code-split into separate chunks.
 *
 * @param config - esbuild config from size-limit.
 * @returns Modified config with lazy data externalized.
 */
const ENTRY = 'packages/core/dist/index.js'

function withLazyExternals(config) {
  return { ...config, external: [...(config.external || []), ...LAZY_DATA] }
}

export default [
  {
    name: 'Core only (setup + validate)',
    path: ENTRY,
    import: '{ setup, validate, getParams }',
    limit: '8 kB',
    ignore: EXTERNAL,
    modifyEsbuildConfig: withLazyExternals,
  },
  {
    name: 'Single rule (Email)',
    path: ENTRY,
    import: '{ Email }',
    limit: '12 kB',
    ignore: EXTERNAL,
    modifyEsbuildConfig: withLazyExternals,
  },
  {
    name: 'Email + Password',
    path: ENTRY,
    import: '{ Email, Password }',
    limit: '15 kB',
    ignore: EXTERNAL,
    modifyEsbuildConfig: withLazyExternals,
  },
  {
    name: 'Form (4 rules)',
    path: ENTRY,
    import: '{ Email, Password, PersonName, Phone }',
    limit: '20 kB',
    ignore: EXTERNAL,
    modifyEsbuildConfig: withLazyExternals,
  },
  {
    name: 'All rules',
    path: ENTRY,
    import: '*',
    limit: '35 kB',
    ignore: EXTERNAL,
    modifyEsbuildConfig: withLazyExternals,
  },
]
