// ==============================================================================
// BUNDLE SIZE MEASUREMENT
// Measures Brotli-compressed bundle size for various import combinations.
// ------------------------------------------------------------------------------
// NOTE: Requires a built dist/ directory. Run `pnpm build` first.
// ==============================================================================

import { execSync } from 'node:child_process'
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'
import { brotliCompressSync, gzipSync } from 'node:zlib'

// ----------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------

const ESBUILD = join(process.cwd(), 'node_modules/.pnpm/node_modules/.bin/esbuild')
const TMP = join(process.cwd(), '.tmp-bundle')
const DIST = join(process.cwd(), 'dist/index.js')

const EXTERNALS = [
  '--external:zod',
  '--external:libphonenumber-js',
  '--external:libphonenumber-js/*',
  '--external:postal-codes-js',
  '--external:disposable-email-domains',
  '--external:fastify',
  '--external:fastify-plugin',
].join(' ')

// Data chunks are loaded on demand — exclude from measurement
const DATA_EXTERNALS = [
  '--external:./countryCodes*',
  '--external:./passwordsTier*',
  '--external:./creditCardPrefixes*',
  '--external:./currencyCodes*',
  '--external:./ibanPatterns*',
  '--external:./reservedUsernames*',
  '--external:./vatPatterns*',
].join(' ')

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

interface Measurement {
  name: string
  importStatement: string
  raw: number
  brotli: number
  gzip: number
}

// ----------------------------------------------------------
// MEASUREMENT
// ----------------------------------------------------------

/**
 * Measure
 * Bundles a single import statement and returns raw, Brotli, and gzip sizes.
 *
 * @param name            - Human-readable label for the measurement.
 * @param importStatement - ES module import to bundle.
 * @returns Measurement object with raw, brotli, and gzip byte counts.
 */
function measure(name: string, importStatement: string): Measurement {
  mkdirSync(TMP, { recursive: true })
  const entryPath = join(TMP, 'entry.mjs')
  const outPath = join(TMP, 'out.js')

  writeFileSync(entryPath, importStatement)

  execSync(
    `${ESBUILD} ${entryPath} --bundle --format=esm --tree-shaking=true --minify ${EXTERNALS} ${DATA_EXTERNALS} --outfile=${outPath}`,
    { stdio: 'pipe' },
  )

  const output = readFileSync(outPath)
  const brotli = brotliCompressSync(output)
  const gzip = gzipSync(output)

  unlinkSync(entryPath)
  unlinkSync(outPath)

  return { name, importStatement, raw: output.length, brotli: brotli.length, gzip: gzip.length }
}

// ----------------------------------------------------------
// RULE LIST
// ----------------------------------------------------------

const rules = [
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

// ----------------------------------------------------------
// EXECUTION
// ----------------------------------------------------------

const measurements: Measurement[] = []

// Baseline (setup + validate only)
measurements.push(measure('Core only (setup + validate)', `export { setup, validate } from '${DIST}'`))

// Individual rules
for (const rule of rules) {
  measurements.push(measure(rule, `export { ${rule} } from '${DIST}'`))
}

// Combinations
measurements.push(measure('Email + Password', `export { Email, Password } from '${DIST}'`))
measurements.push(measure('Form (Email+Password+PersonName+Phone)', `export { Email, Password, PersonName, Phone } from '${DIST}'`))
measurements.push(measure('All 25 rules', `export * from '${DIST}'`))

// ----------------------------------------------------------
// OUTPUT
// ----------------------------------------------------------

console.log('| Import | Raw (minified) | Brotli | Gzip |')
console.log('|--------|---------------|--------|------|')
for (const m of measurements) {
  const rawKb = (m.raw / 1024).toFixed(1)
  const brKb = (m.brotli / 1024).toFixed(1)
  const gzKb = (m.gzip / 1024).toFixed(1)
  console.log(`| ${m.name} | ${rawKb} kB | ${brKb} kB | ${gzKb} kB |`)
}

// Cleanup
try {
  execSync(`rm -rf ${TMP}`)
}
catch {}
