// ==============================================================================
// CLI TESTS
// Validates the English locale file, errorMap integration, and CLI behavior.
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

/**
 * Run CLI
 * Executes the CLI as a child process using tsx.
 *
 * @param args - CLI arguments string.
 * @returns The stdout output.
 */
function runCli(args: string): string {
  return execSync(`npx tsx ${CLI_PATH} ${args}`, {
    encoding: 'utf-8',
    cwd: join(import.meta.dirname, '..', '..', '..'),
  })
}

// ----------------------------------------------------------
// LOCALE FILE TESTS
// ----------------------------------------------------------

describe('en.json locale file', () => {
  it('should have all 26 labels (25 rules + string namespace)', () => {
    const labels = enLocale.validation.labels
    for (const key of RULE_LABEL_KEYS) {
      expect(labels).toHaveProperty(key)
    }
    expect(Object.keys(labels)).toHaveLength(RULE_LABEL_KEYS.length)
  })

  it('should have message count matching errorMap registry', () => {
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

  it('should have matching namespace keys with MESSAGE_MAP', () => {
    const localeNamespaces = Object.keys(enLocale.validation.messages).sort()
    const mapNamespaces = Object.keys(MESSAGE_MAP).sort()
    expect(localeNamespaces).toEqual(mapNamespaces)
  })
})

// ----------------------------------------------------------
// ERROR MAP INTEGRATION TESTS
// ----------------------------------------------------------

describe('errorMap reads from en.json', () => {
  it('should have identical messages between MESSAGE_MAP and en.json', () => {
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

  it('should include all RULE_DEFAULTS namespaces in messages', () => {
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
// CLI TESTS
// ----------------------------------------------------------

describe('cli', { timeout: 30_000 }, () => {
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

  it('should error when no arguments are provided', () => {
    expect(() => runCli('')).toThrow()
  })

  it('should create a file for a language', () => {
    runCli(`fr --output ${TMP_DIR}`)
    const filePath = join(TMP_DIR, 'fr.json')
    expect(existsSync(filePath)).toBe(true)
  })

  it('should produce empty values with --empty', () => {
    runCli(`fr --empty --output ${TMP_DIR}`)
    const filePath = join(TMP_DIR, 'fr.json')
    const content = JSON.parse(readFileSync(filePath, 'utf-8')) as LocaleFile

    expect(content.lang).toBe('fr')
    expect(content.validation.messages['base']?.['required']).toBe('')
    expect(content.validation.labels['email']).toBe('')
  })

  it('should create files in the specified --output directory', () => {
    const subDir = join(TMP_DIR, 'nested', 'locales')
    runCli(`de --output ${subDir}`)
    expect(existsSync(join(subDir, 'de.json'))).toBe(true)
  })

  it('should generate files with same keys as en.json', () => {
    runCli(`es --output ${TMP_DIR}`)
    const content = JSON.parse(
      readFileSync(join(TMP_DIR, 'es.json'), 'utf-8'),
    ) as LocaleFile

    const enMessages = enLocale.validation.messages as Record<string, Record<string, string>>
    const enKeys = Object.keys(enMessages).sort()
    const esKeys = Object.keys(content.validation.messages).sort()
    expect(esKeys).toEqual(enKeys)

    for (const ns of enKeys) {
      const enNs = enMessages[ns]
      if (enNs === undefined)
        continue
      const enCodes = Object.keys(enNs).sort()
      const esNs = content.validation.messages[ns]
      if (esNs === undefined)
        continue
      const esCodes = Object.keys(esNs).sort()
      expect(esCodes).toEqual(enCodes)
    }
  })

  it('should create multiple files for multiple languages', () => {
    runCli(`fr de ja --output ${TMP_DIR}`)
    expect(existsSync(join(TMP_DIR, 'fr.json'))).toBe(true)
    expect(existsSync(join(TMP_DIR, 'de.json'))).toBe(true)
    expect(existsSync(join(TMP_DIR, 'ja.json'))).toBe(true)
  })
})
