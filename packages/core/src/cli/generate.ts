// ==============================================================================
// CLI GENERATE
// Pure functions for argument parsing, locale template generation, and value
// transformation. No I/O, no process.exit — fully unit-testable.
// ==============================================================================

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

/** Result of argument parsing — success with args or failure with message. */
type ParseResult
  = | { readonly ok: true, readonly args: CliArgs }
    | { readonly ok: false, readonly error: string }

// ----------------------------------------------------------
// ARGUMENT PARSING
// ----------------------------------------------------------

/**
 * Parse Args
 * Parses a raw argv array into structured CLI arguments.
 * Returns a result type instead of calling process.exit.
 *
 * @param argv - Raw process.argv array (includes node + script path).
 * @returns Parsed result or error message.
 */
export function parseArgs(argv: readonly string[]): ParseResult {
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
      const next: string | undefined = args[i + 1]
      if (next === undefined || next === '' || next.startsWith('-')) {
        return { ok: false, error: '--output requires a directory path' }
      }
      result.output = next
      i++
    }
    else if (!arg.startsWith('-')) {
      result.languages.push(arg)
    }
    else {
      return { ok: false, error: `Unknown option '${arg}'` }
    }
  }

  return { ok: true, args: result }
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
export function emptyValues(obj: unknown): unknown {
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
 * Generate Locale
 * Creates a translation template for the given language code.
 *
 * @param lang   - Target language code (e.g. 'fr', 'de').
 * @param source - The English locale object.
 * @param empty  - Whether to produce empty string values.
 * @returns The locale object for the target language.
 */
export function generateLocale(
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

/** CLI help text displayed with --help flag. */
export const HELP_TEXT = `
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
