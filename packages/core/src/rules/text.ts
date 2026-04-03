// ==============================================================================
// TEXT RULE
// Validates free-form text with content detection and word/character limits.
// ==============================================================================

import type { FormatRuleOptions, Range } from '../types'

import { z } from 'zod'

import { createRule } from '@core/createRule'
import { applyLengthCheck } from '@internal/lengthCheck'
import { resolveRange } from '@internal/resolveRange'

import '../augmentation'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * TextOptions
 * Configuration options for the text validation rule.
 */
export interface TextOptions extends FormatRuleOptions {
  /** Length constraints for the text string. */
  readonly length?: Range | undefined
  /** Word count constraints. */
  readonly words?: Range | undefined
  /** Consecutive character repetition constraints. */
  readonly consecutive?: Range | undefined
  /** Reject text that contains email addresses. */
  readonly noEmails?: boolean | undefined
  /** Reject text that contains URLs. */
  readonly noUrls?: boolean | undefined
  /** Reject text that contains phone numbers. */
  readonly noPhoneNumbers?: boolean | undefined
  /** Reject text that contains HTML tags. */
  readonly noHtml?: boolean | undefined
}

// ----------------------------------------------------------
// RULE FACTORY
// ----------------------------------------------------------

/**
 * Text
 * Validates free-form text with optional content detection,
 * word limits, and consecutive character restrictions.
 *
 * @param options - Per-call text validation options.
 * @returns A Zod schema that validates text strings.
 */
export const Text = /* @__PURE__ */ createRule<TextOptions>({
  name: 'text',
  defaults: {},
  messages: {},
  build: (opts: TextOptions): unknown => {
    const range = resolveRange(opts.length)
    const wordsRange = resolveRange(opts.words)
    const consecutiveRange = resolveRange(opts.consecutive)

    const base = opts.normalize !== false
      ? z.string().trim()
      : z.string()

    const lengthSchema = buildLengthSchema(range, opts.label)
    // SAFETY: lengthSchema is z.string().superRefine(); output is string-compatible
    let schema: z.ZodType = base.pipe(lengthSchema as z.ZodType<string, string>)

    if (opts.regex !== undefined) {
      const pattern = opts.regex
      schema = schema.pipe(z.string().refine(
        (v: string): boolean => pattern.test(v),
        { params: { code: 'invalid', namespace: 'text', label: opts.label } },
      ))
    }

    if (opts.noEmails === true) {
      schema = schema.noEmails({ namespace: 'text', label: opts.label })
    }
    if (opts.noUrls === true) {
      schema = schema.noUrls({ namespace: 'text', label: opts.label })
    }
    if (opts.noHtml === true) {
      schema = schema.noHtml({ namespace: 'text', label: opts.label })
    }
    if (opts.noPhoneNumbers === true) {
      schema = schema.noPhoneNumbers({ namespace: 'text', label: opts.label })
    }

    if (wordsRange?.min !== undefined) {
      schema = schema.minWords({ min: wordsRange.min, namespace: 'text', label: opts.label })
    }
    if (wordsRange?.max !== undefined) {
      schema = schema.maxWords({ max: wordsRange.max, namespace: 'text', label: opts.label })
    }
    if (consecutiveRange?.max !== undefined) {
      schema = schema.maxConsecutive({ max: consecutiveRange.max, namespace: 'text', label: opts.label })
    }

    return schema
  },
})

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Build Length Schema
 * Creates a base z.string() with optional min/max constraints.
 *
 * @param range - Resolved range with optional min and max.
 * @param label  - Explicit label for error messages.
 * @returns A Zod string schema with length constraints applied.
 */
function buildLengthSchema(
  range: { readonly min?: number, readonly max?: number } | undefined,
  label?: string,
): z.ZodType {
  const min = range?.min
  const max = range?.max

  return z.string().superRefine((v: string, ctx): void => {
    applyLengthCheck(v, min, max, label, ctx)
  })
}
