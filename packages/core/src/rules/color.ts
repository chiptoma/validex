// ==============================================================================
// COLOR RULE
// Validates CSS color strings in hex, rgb, or hsl format.
// ==============================================================================

import type { BaseRuleOptions } from '../types'

import { z } from 'zod'

import { createRule } from '@core/createRule'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * ColorOptions
 * Options for the color validation rule.
 */
export interface ColorOptions extends BaseRuleOptions {
  /** Color format to validate. Defaults to 'hex'. */
  readonly format?: 'hex' | 'rgb' | 'hsl' | 'any' | undefined
  /** Whether to allow alpha channel values. Defaults to true. */
  readonly alpha?: boolean | undefined
}

// ----------------------------------------------------------
// PATTERNS
// ----------------------------------------------------------

const HEX_ALPHA = /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const HEX_NO_ALPHA = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

const RGB_ALPHA = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+)\s*)?\)$/
const RGB_NO_ALPHA = /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/

const HSL_ALPHA = /^hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*(,\s*(0|1|0?\.\d+)\s*)?\)$/
const HSL_NO_ALPHA = /^hsl\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*\)$/

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Get Hex Pattern
 * Returns the appropriate hex regex based on alpha support.
 *
 * @param alpha - Whether alpha channel is allowed.
 * @returns The hex color regex pattern.
 */
function getHexPattern(alpha: boolean): RegExp {
  return alpha ? HEX_ALPHA : HEX_NO_ALPHA
}

/**
 * Get Rgb Pattern
 * Returns the appropriate rgb regex based on alpha support.
 *
 * @param alpha - Whether alpha channel is allowed.
 * @returns The rgb color regex pattern.
 */
function getRgbPattern(alpha: boolean): RegExp {
  return alpha ? RGB_ALPHA : RGB_NO_ALPHA
}

/**
 * Get Hsl Pattern
 * Returns the appropriate hsl regex based on alpha support.
 *
 * @param alpha - Whether alpha channel is allowed.
 * @returns The hsl color regex pattern.
 */
function getHslPattern(alpha: boolean): RegExp {
  return alpha ? HSL_ALPHA : HSL_NO_ALPHA
}

/**
 * Matches Any Format
 * Tests a value against all color format patterns.
 *
 * @param value - The string to test.
 * @param alpha - Whether alpha channel is allowed.
 * @returns True if the value matches any color format.
 */
function matchesAnyFormat(value: string, alpha: boolean): boolean {
  return (
    getHexPattern(alpha).test(value)
    || getRgbPattern(alpha).test(value)
    || getHslPattern(alpha).test(value)
  )
}

// ----------------------------------------------------------
// RULE FACTORY
// ----------------------------------------------------------

/**
 * Color
 * Validates that a string is a valid CSS color in the specified format.
 * Supports hex, rgb, hsl, or any format with optional alpha channel.
 *
 * @param options - Optional color validation options.
 * @returns A Zod schema that validates color strings.
 */
export const Color = /* @__PURE__ */ createRule<ColorOptions>({
  name: 'color',
  defaults: {},
  messages: {},
  build: (opts: ColorOptions): z.ZodType => {
    const format = opts.format ?? 'hex'
    const alpha = opts.alpha !== false

    const base = opts.normalize !== false
      ? z.string().transform((v: string): string => v.trim().toLowerCase())
      : z.string()

    return base.pipe(
      z.string().refine(
        (v: string): boolean => {
          switch (format) {
            case 'hex': return getHexPattern(alpha).test(v)
            case 'rgb': return getRgbPattern(alpha).test(v)
            case 'hsl': return getHslPattern(alpha).test(v)
            case 'any': return matchesAnyFormat(v, alpha)
            /* c8 ignore start -- exhaustive default; format is constrained to hex|rgb|hsl|any by TypeScript */
            default: return false
            /* c8 ignore stop */
          }
        },
        { params: { code: 'invalid', namespace: 'color', label: opts.label } },
      ),
    )
  },
})
