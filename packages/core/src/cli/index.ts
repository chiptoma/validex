#!/usr/bin/env node
// ==============================================================================
// VALIDEX CLI
// Generates translation template files from the English locale.
// ==============================================================================

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/** Parsed command-line arguments for the CLI. */
interface CliArgs {
  languages: string[]
  output: string
  empty: boolean
  help: boolean
}

// ----------------------------------------------------------
// LOCALE LOADING
// ----------------------------------------------------------

/**
 * Load English Locale
 * Reads the bundled en.json from the package.
 *
 * @returns The parsed English locale object.
 */
function loadEnglishLocale(): Record<string, unknown> {
  const currentDir = dirname(fileURLToPath(import.meta.url))
  const localePath = join(currentDir, '..', 'locales', 'en.json')

  if (!existsSync(localePath)) {
    console.error(`Error: English locale not found at ${localePath}`)
    process.exit(1)
  }

  // SAFETY: en.json is a known JSON object; JSON.parse returns unknown, cast narrows to Record
  return JSON.parse(readFileSync(localePath, 'utf-8')) as Record<string, unknown>
}

// ----------------------------------------------------------
// ARGUMENT PARSING
// ----------------------------------------------------------

/**
 * Parse Arguments
 * Parses process.argv into structured CLI arguments.
 *
 * @param argv - Raw process.argv array.
 * @returns Parsed CLI arguments.
 */
function parseArgs(argv: string[]): CliArgs {
  const args = argv.slice(2)
  const result: CliArgs = {
    languages: [],
    output: '.',
    empty: false,
    help: false,
  }

  for (let i = 0; i < args.length; i++) {
    const arg: string | undefined = args[i]
    if (arg === undefined)
      continue

    if (arg === '--help' || arg === '-h') {
      result.help = true
    }
    else if (arg === '--empty' || arg === '-e') {
      result.empty = true
    }
    else if (arg === '--output' || arg === '-o') {
      const next = args[i + 1]
      if (next === undefined || next === '' || next.startsWith('-')) {
        console.error('Error: --output requires a directory path')
        process.exit(1)
      }
      result.output = next
      i++
    }
    else if (!arg.startsWith('-')) {
      result.languages.push(arg)
    }
    else {
      console.error(`Error: Unknown option '${arg}'`)
      process.exit(1)
    }
  }

  return result
}

// ----------------------------------------------------------
// TEMPLATE GENERATION
// ----------------------------------------------------------

/**
 * Empty Values
 * Recursively replaces all string values with empty strings.
 *
 * @param obj - The object to process.
 * @returns A new object with all string values set to "".
 */
function emptyValues(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return ''
  }
  if (Array.isArray(obj)) {
    return obj.map(emptyValues)
  }
  if (typeof obj === 'object' && obj !== null) {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = emptyValues(value)
    }
    return result
  }
  return obj
}

/**
 * Generate Locale File
 * Creates a translation template for the given language code.
 *
 * @param lang   - Target language code (e.g. 'fr', 'de').
 * @param source - The English locale object.
 * @param empty  - Whether to produce empty string values.
 * @returns The locale object for the target language.
 */
function generateLocale(
  lang: string,
  source: Record<string, unknown>,
  empty: boolean,
): Record<string, unknown> {
  const locale = empty
    // SAFETY: emptyValues preserves object structure; returns Record when input is Record
    ? emptyValues(source) as Record<string, unknown>
    : structuredClone(source)

  locale['lang'] = lang
  return locale
}

// ----------------------------------------------------------
// HELP TEXT
// ----------------------------------------------------------

const HELP_TEXT = `
validex - Generate translation template files

Usage:
  validex <language...> [options]

Arguments:
  language    One or more language codes (e.g. fr de es)

Options:
  -o, --output <dir>   Output directory (default: current directory)
  -e, --empty          Generate files with empty string values
  -h, --help           Show this help message

Examples:
  validex fr de es
  validex fr --empty --output ./locales
  validex ja --output src/i18n
`.trim()

// ----------------------------------------------------------
// MAIN
// ----------------------------------------------------------

/**
 * Main
 * Entry point for the CLI.
 */
function main(): void {
  const cliArgs = parseArgs(process.argv)

  if (cliArgs.help) {
    console.warn(HELP_TEXT)
    process.exit(0)
  }

  if (cliArgs.languages.length === 0) {
    console.error('Error: At least one language code is required')
    console.error('Run "validex --help" for usage information')
    process.exit(1)
  }

  const enLocale = loadEnglishLocale()

  if (!existsSync(cliArgs.output)) {
    mkdirSync(cliArgs.output, { recursive: true })
  }

  for (const lang of cliArgs.languages) {
    const locale = generateLocale(lang, enLocale, cliArgs.empty)
    const filePath = join(cliArgs.output, `${lang}.json`)
    writeFileSync(filePath, `${JSON.stringify(locale, null, 2)}\n`, 'utf-8')
    console.warn(`Created ${filePath}`)
  }
}

main()
