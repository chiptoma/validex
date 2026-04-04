// ==============================================================================
// CLI GENERATE — UNIT TESTS
// Tests parseArgs, emptyValues, and generateLocale pure functions directly.
// ==============================================================================

import { emptyValues, generateLocale, HELP_TEXT, parseArgs } from '@cli/generate'
import { describe, expect, it } from 'vitest'

// ----------------------------------------------------------
// PARSE ARGS
// ----------------------------------------------------------

describe('parseArgs', () => {
  const argv = (...args: string[]): readonly string[] => ['node', 'validex', ...args]

  it('parses a single language', () => {
    const result = parseArgs(argv('fr'))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.args.languages).toEqual(['fr'])
      expect(result.args.output).toBe('.')
      expect(result.args.empty).toBe(false)
    }
  })

  it('parses multiple languages', () => {
    const result = parseArgs(argv('fr', 'de', 'ja'))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.args.languages).toEqual(['fr', 'de', 'ja'])
    }
  })

  it('parses --output flag', () => {
    const result = parseArgs(argv('fr', '--output', './locales'))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.args.output).toBe('./locales')
    }
  })

  it('parses -o shorthand', () => {
    const result = parseArgs(argv('fr', '-o', './out'))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.args.output).toBe('./out')
    }
  })

  it('parses --empty flag', () => {
    const result = parseArgs(argv('fr', '--empty'))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.args.empty).toBe(true)
    }
  })

  it('parses -e shorthand', () => {
    const result = parseArgs(argv('fr', '-e'))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.args.empty).toBe(true)
    }
  })

  it('parses --help flag', () => {
    const result = parseArgs(argv('--help'))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.args.help).toBe(true)
    }
  })

  it('parses -h shorthand', () => {
    const result = parseArgs(argv('-h'))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.args.help).toBe(true)
    }
  })

  it('parses combined flags', () => {
    const result = parseArgs(argv('fr', 'de', '--empty', '--output', './i18n'))
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.args.languages).toEqual(['fr', 'de'])
      expect(result.args.empty).toBe(true)
      expect(result.args.output).toBe('./i18n')
    }
  })

  it('returns error for --output without value', () => {
    const result = parseArgs(argv('fr', '--output'))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('--output')
    }
  })

  it('returns error for --output with flag as value', () => {
    const result = parseArgs(argv('fr', '--output', '--empty'))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('--output')
    }
  })

  it('returns error for unknown option', () => {
    const result = parseArgs(argv('--unknown'))
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toContain('Unknown option')
    }
  })

  it('returns empty languages when none provided', () => {
    const result = parseArgs(argv())
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.args.languages).toEqual([])
    }
  })
})

// ----------------------------------------------------------
// EMPTY VALUES
// ----------------------------------------------------------

describe('emptyValues', () => {
  it('replaces string values with empty strings', () => {
    expect(emptyValues('hello')).toBe('')
  })

  it('recurses into nested objects', () => {
    const input = { a: { b: 'value' } }
    expect(emptyValues(input)).toEqual({ a: { b: '' } })
  })

  it('handles arrays of strings', () => {
    expect(emptyValues(['a', 'b'])).toEqual(['', ''])
  })

  it('handles arrays of objects', () => {
    expect(emptyValues([{ x: 'y' }])).toEqual([{ x: '' }])
  })

  it('preserves numbers', () => {
    expect(emptyValues(42)).toBe(42)
  })

  it('preserves booleans', () => {
    expect(emptyValues(true)).toBe(true)
  })

  it('preserves null', () => {
    expect(emptyValues(null)).toBeNull()
  })

  it('handles deeply nested structure', () => {
    const input = { l1: { l2: { l3: 'deep' } } }
    expect(emptyValues(input)).toEqual({ l1: { l2: { l3: '' } } })
  })

  it('does not mutate original object', () => {
    const input = { key: 'value' }
    emptyValues(input)
    expect(input.key).toBe('value')
  })
})

// ----------------------------------------------------------
// GENERATE LOCALE
// ----------------------------------------------------------

describe('generateLocale', () => {
  const source: Record<string, unknown> = {
    validation: {
      labels: { email: 'Email' },
      messages: { base: { required: 'This field is required' } },
    },
  }

  it('sets lang property to the target language', () => {
    const result = generateLocale('fr', source, false)
    expect(result['lang']).toBe('fr')
  })

  it('preserves source structure when empty=false', () => {
    const result = generateLocale('de', source, false)
    expect((result['validation'] as Record<string, unknown>)['labels']).toEqual({ email: 'Email' })
  })

  it('empties all string values when empty=true', () => {
    const result = generateLocale('ja', source, true)
    const labels = (result['validation'] as Record<string, unknown>)['labels'] as Record<string, string>
    expect(labels['email']).toBe('')
  })

  it('does not mutate source object', () => {
    generateLocale('fr', source, false)
    expect(source['lang']).toBeUndefined()
  })

  it('does not mutate source when empty=true', () => {
    generateLocale('fr', source, true)
    const labels = (source['validation'] as Record<string, unknown>)['labels'] as Record<string, string>
    expect(labels['email']).toBe('Email')
  })
})

// ----------------------------------------------------------
// HELP TEXT
// ----------------------------------------------------------

describe('help text', () => {
  it('contains usage instructions', () => {
    expect(HELP_TEXT).toContain('Usage:')
    expect(HELP_TEXT).toContain('--output')
    expect(HELP_TEXT).toContain('--empty')
    expect(HELP_TEXT).toContain('--help')
  })

  it('contains examples', () => {
    expect(HELP_TEXT).toContain('Examples:')
    expect(HELP_TEXT).toContain('validex fr de es')
  })
})
