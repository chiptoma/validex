// ==============================================================================
// TEXT RULE
// Validates free-form text with content detection and word/character limits.
// ==============================================================================

import type { FormatRuleOptions, Range } from '../types'
import { z } from 'zod'
import { containsEmail, containsHtml, containsPhoneNumber, containsUrl } from '../checks/detection'
import { maxConsecutive, maxWords } from '../checks/limits'
import { createRule } from '../core/createRule'
import { resolveRange } from '../internal/resolveRange'

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
export const text = /* @__PURE__ */ createRule<TextOptions>({
  name: 'text',
  defaults: {},
  messages: {
    invalid: '{{label}} is not valid text',
    noEmails: '{{label}} must not contain email addresses',
    noUrls: '{{label}} must not contain URLs',
    noPhoneNumbers: '{{label}} must not contain phone numbers',
    noHtml: '{{label}} must not contain HTML',
    maxWords: '{{label}} must have at most {{maximum}} words',
    maxConsecutive:
      '{{label}} must not have more than {{maximum}} consecutive characters',
  },
  build: (opts: TextOptions): unknown => {
    const range = resolveRange(opts.length)
    const wordsRange = resolveRange(opts.words)
    const consecutiveRange = resolveRange(opts.consecutive)

    const base = opts.normalize !== false
      ? z.string().trim()
      : z.string()

    const lengthSchema = buildLengthSchema(range)
    let schema: z.ZodType = base.pipe(lengthSchema)

    if (opts.regex !== undefined) {
      const pattern = opts.regex
      schema = schema.pipe(z.string().refine(
        (v: string): boolean => pattern.test(v),
        { params: { code: 'invalid', namespace: 'text' } },
      ))
    }

    schema = applyContentDetection(schema, opts)
    schema = applyLimits(schema, wordsRange, consecutiveRange)

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
 * @returns A Zod string schema with length constraints applied.
 */
function buildLengthSchema(
  range: { readonly min?: number, readonly max?: number } | undefined,
): z.ZodString {
  let schema = z.string()

  if (range?.min !== undefined) {
    schema = schema.min(range.min)
  }
  if (range?.max !== undefined) {
    schema = schema.max(range.max)
  }

  return schema
}

/**
 * Apply Content Detection
 * Conditionally adds refine checks for email, URL, HTML, and phone detection.
 *
 * @param schema - The Zod schema to extend.
 * @param opts   - The resolved text options.
 * @returns The schema with content detection refines applied.
 */
function applyContentDetection(schema: z.ZodType, opts: TextOptions): z.ZodType {
  let result = schema

  if (opts.noEmails === true) {
    result = result.pipe(z.string().refine(
      (v: string): boolean => !containsEmail(v),
      { params: { code: 'noEmails', namespace: 'text' } },
    ))
  }

  if (opts.noUrls === true) {
    result = result.pipe(z.string().refine(
      (v: string): boolean => !containsUrl(v),
      { params: { code: 'noUrls', namespace: 'text' } },
    ))
  }

  if (opts.noHtml === true) {
    result = result.pipe(z.string().refine(
      (v: string): boolean => !containsHtml(v),
      { params: { code: 'noHtml', namespace: 'text' } },
    ))
  }

  if (opts.noPhoneNumbers === true) {
    result = result.pipe(z.string().refine(
      (v: string): boolean => !containsPhoneNumber(v),
      { params: { code: 'noPhoneNumbers', namespace: 'text' } },
    ))
  }

  return result
}

/**
 * Apply Limits
 * Adds word count and consecutive character refines when configured.
 *
 * @param schema          - The Zod schema to extend.
 * @param wordsRange      - Resolved word count range.
 * @param consecutiveRange - Resolved consecutive character range.
 * @returns The schema with limit refines applied.
 */
function applyLimits(
  schema: z.ZodType,
  wordsRange: { readonly max?: number } | undefined,
  consecutiveRange: { readonly max?: number } | undefined,
): z.ZodType {
  let result = schema

  if (wordsRange?.max !== undefined) {
    const limit = wordsRange.max
    result = result.pipe(z.string().refine(
      (v: string): boolean => maxWords(v, limit),
      { params: { code: 'maxWords', namespace: 'text', maximum: limit } },
    ))
  }

  if (consecutiveRange?.max !== undefined) {
    const limit = consecutiveRange.max
    result = result.pipe(z.string().refine(
      (v: string): boolean => maxConsecutive(v, limit),
      { params: { code: 'maxConsecutive', namespace: 'text', maximum: limit } },
    ))
  }

  return result
}
