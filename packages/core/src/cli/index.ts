#!/usr/bin/env node
// ==============================================================================
// VALIDEX CLI
// Thin entry point — parses args, loads locale, writes files.
// All pure logic lives in ./generate.ts.
// ==============================================================================

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

import { generateLocale, HELP_TEXT, parseArgs } from './generate'

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
// MAIN
// ----------------------------------------------------------

/**
 * Main
 * Entry point for the CLI.
 */
function main(): void {
  const result = parseArgs(process.argv)

  if (!result.ok) {
    console.error(`Error: ${result.error}`)
    process.exit(1)
  }

  const { args } = result

  if (args.help) {
    console.warn(HELP_TEXT)
    process.exit(0)
  }

  if (args.languages.length === 0) {
    console.error('Error: At least one language code is required')
    console.error('Run "validex --help" for usage information')
    process.exit(1)
  }

  const enLocale = loadEnglishLocale()

  if (!existsSync(args.output)) {
    mkdirSync(args.output, { recursive: true })
  }

  for (const lang of args.languages) {
    const locale = generateLocale(lang, enLocale, args.empty)
    const filePath = join(args.output, `${lang}.json`)
    writeFileSync(filePath, `${JSON.stringify(locale, null, 2)}\n`, 'utf-8')
    console.warn(`Created ${filePath}`)
  }
}

main()
