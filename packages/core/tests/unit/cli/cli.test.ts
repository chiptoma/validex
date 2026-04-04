// ==============================================================================
// CLI INTEGRATION TESTS
// Tests en.json locale integrity, errorMap alignment, and CLI binary behavior.
// Pure function tests are in generate.test.ts.
// ==============================================================================

import { execSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { RULE_DEFAULTS } from '@config/defaults'
import { MESSAGE_MAP } from '@core/errorMap'
import enLocale from '@locales/en.json'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

interface LocaleFile {
  lang: string
  validation: {
    labels: Record<string, string>
    messages: Record<string, Record<string, string>>
  }
}

// ----------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------

const CLI_PATH = join(import.meta.dirname, '..', '..', '..', 'src', 'cli', 'index.ts')
const TMP_DIR = join(import.meta.dirname, '..', '..', '_support', 'fixtures', '.cli-test-output')

const RULE_LABEL_KEYS = [
  'email',
  'personName',
  'businessName',
  'password',
  'passwordConfirmation',
  'phone',
  'website',
  'url',
  'username',
  'slug',
  'postalCode',
  'licenseKey',
  'uuid',
  'jwt',
  'dateTime',
  'token',
  'text',
  'country',
  'currency',
  'color',
  'creditCard',
  'iban',
  'vatNumber',
  'macAddress',
  'ipAddress',
  'string',
]

// Clean env without pnpm's npm_config_* vars that cause npm warnings in child processes
const cleanEnv = Object.fromEntries(
  Object.entries(process.env).filter(([k]) => !k.startsWith('npm_config_')),
)

/**
 * Run CLI
 * Executes the CLI binary as a child process with a clean environment.
 *
 * @param args - CLI arguments string.
 * @returns The stdout output.
 */
function runCli(args: string): string {
  return execSync(`tsx ${CLI_PATH} ${args}`, {
    encoding: 'utf-8',
    cwd: join(import.meta.dirname, '..', '..', '..'),
    env: cleanEnv,
  })
}

// ----------------------------------------------------------
// LOCALE FILE TESTS
// ----------------------------------------------------------

describe('en.json locale file', () => {
  it('has all 26 labels (25 rules + string namespace)', () => {
    const labels = enLocale.validation.labels
    for (const key of RULE_LABEL_KEYS) {
      expect(labels).toHaveProperty(key)
    }
    expect(Object.keys(labels)).toHaveLength(RULE_LABEL_KEYS.length)
  })

  it('has message count matching errorMap registry', () => {
    const localeMessages = enLocale.validation.messages
    let localeCount = 0
    for (const ns of Object.values(localeMessages)) {
      localeCount += Object.keys(ns).length
    }

    let mapCount = 0
    for (const ns of Object.values(MESSAGE_MAP)) {
      mapCount += Object.keys(ns).length
    }

    expect(localeCount).toBe(mapCount)
  })

  it('has matching namespace keys with MESSAGE_MAP', () => {
    const localeNamespaces = Object.keys(enLocale.validation.messages).sort()
    const mapNamespaces = Object.keys(MESSAGE_MAP).sort()
    expect(localeNamespaces).toEqual(mapNamespaces)
  })
})

// ----------------------------------------------------------
// ERROR MAP INTEGRATION TESTS
// ----------------------------------------------------------

describe('errorMap reads from en.json', () => {
  it('has identical messages between MESSAGE_MAP and en.json', () => {
    const messages = enLocale.validation.messages as Record<
      string,
      Record<string, string>
    >

    for (const [ns, codes] of Object.entries(messages)) {
      for (const [code, message] of Object.entries(codes)) {
        expect(MESSAGE_MAP[ns]?.[code]).toBe(message)
      }
    }
  })

  it('includes all RULE_DEFAULTS namespaces in messages', () => {
    const messageNamespaces = new Set(Object.keys(MESSAGE_MAP))
    const ruleNamespaces = Object.keys(RULE_DEFAULTS)

    for (const ns of ruleNamespaces) {
      if (ns === 'passwordConfirmation') {
        expect(messageNamespaces.has('confirmation')).toBe(true)
        continue
      }
      expect(messageNamespaces.has(ns)).toBe(true)
    }
  })
})

// ----------------------------------------------------------
// CLI BINARY TESTS
// Only tests that MUST spawn a child process live here.
// ----------------------------------------------------------

describe('cli binary', () => {
  beforeEach(() => {
    if (!existsSync(TMP_DIR)) {
      mkdirSync(TMP_DIR, { recursive: true })
    }
  })

  afterEach(() => {
    if (existsSync(TMP_DIR)) {
      rmSync(TMP_DIR, { recursive: true, force: true })
    }
  })

  it('exits with error when no arguments are provided', () => {
    expect(() => runCli('')).toThrow()
  })

  it('produces a valid locale file with correct keys', () => {
    runCli(`fr --output ${TMP_DIR}`)
    const content = JSON.parse(
      readFileSync(join(TMP_DIR, 'fr.json'), 'utf-8'),
    ) as LocaleFile

    expect(content.lang).toBe('fr')
    const enKeys = Object.keys(enLocale.validation.messages).sort()
    const frKeys = Object.keys(content.validation.messages).sort()
    expect(frKeys).toEqual(enKeys)
  })

  it('creates nested output directory and multiple files', () => {
    const subDir = join(TMP_DIR, 'nested', 'locales')
    runCli(`fr de --empty --output ${subDir}`)

    expect(existsSync(join(subDir, 'fr.json'))).toBe(true)
    expect(existsSync(join(subDir, 'de.json'))).toBe(true)

    const content = JSON.parse(
      readFileSync(join(subDir, 'fr.json'), 'utf-8'),
    ) as LocaleFile
    expect(content.validation.labels['email']).toBe('')
  })
})
