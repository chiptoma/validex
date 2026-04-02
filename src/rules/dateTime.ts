// ==============================================================================
// DATE/TIME RULE
// Validates ISO 8601 datetime, date, and time strings with range constraints.
// ==============================================================================

import type { BaseRuleOptions } from '../types'
import { z } from 'zod'
import { createRule } from '../core/createRule'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * DateTimeOptions
 * Configuration options for the dateTime validation rule.
 */
export interface DateTimeOptions extends BaseRuleOptions {
  /** Format to validate: full ISO datetime, date-only, or time-only. */
  readonly format?: 'iso' | 'date' | 'time' | undefined
  /** Earliest allowed date/time (inclusive). */
  readonly min?: Date | string | undefined
  /** Latest allowed date/time (inclusive). */
  readonly max?: Date | string | undefined
  /** Whether future dates are accepted. */
  readonly allowFuture?: boolean | undefined
  /** Whether past dates are accepted. */
  readonly allowPast?: boolean | undefined
  /** Whether UTC offset suffixes are accepted. */
  readonly allowOffset?: boolean | undefined
  /** Whether local datetimes (no Z or offset) are accepted. */
  readonly allowLocal?: boolean | undefined
  /** Fractional-seconds precision (0-9). */
  readonly precision?: number | undefined
}

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Parse To Date
 * Safely converts a string or Date value into a Date instance.
 *
 * @param value - The value to convert.
 * @returns A Date instance.
 */
function parseToDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}

/**
 * Build DateTime Schema
 * Constructs the ISO datetime base schema with offset/local/precision.
 *
 * @param opts - Resolved dateTime options.
 * @returns A Zod string schema with datetime validation.
 */
function buildDateTimeSchema(opts: DateTimeOptions): z.ZodType {
  const datetimeOpts: { offset?: boolean, local?: boolean, precision?: number } = {}

  if (opts.allowOffset !== undefined) {
    datetimeOpts.offset = opts.allowOffset
  }
  if (opts.allowLocal !== undefined) {
    datetimeOpts.local = opts.allowLocal
  }
  if (opts.precision !== undefined) {
    datetimeOpts.precision = opts.precision
  }

  const check = z.string().datetime(datetimeOpts)
  const base = opts.normalize !== false ? z.string().trim() : z.string()

  return base.pipe(z.string().superRefine((v: string, ctx): void => {
    if (!check.safeParse(v).success) {
      ctx.addIssue({ code: 'custom', params: { code: 'invalid', namespace: 'dateTime', label: opts.label } })
    }
  }))
}

/**
 * Build Date Schema
 * Constructs the date-only base schema.
 *
 * @param opts - Resolved dateTime options.
 * @returns A Zod schema with date validation.
 */
function buildDateSchema(opts: DateTimeOptions): z.ZodType {
  const check = z.string().date()
  const base = opts.normalize !== false ? z.string().trim() : z.string()

  return base.pipe(z.string().superRefine((v: string, ctx): void => {
    if (!check.safeParse(v).success) {
      ctx.addIssue({ code: 'custom', params: { code: 'invalid', namespace: 'dateTime', label: opts.label } })
    }
  }))
}

/**
 * Build Time Schema
 * Constructs the time-only base schema with optional precision.
 *
 * @param opts - Resolved dateTime options.
 * @returns A Zod schema with time validation.
 */
function buildTimeSchema(opts: DateTimeOptions): z.ZodType {
  const timeOpts: { precision?: number } = {}
  if (opts.precision !== undefined) {
    timeOpts.precision = opts.precision
  }

  const check = z.string().time(timeOpts)
  const base = opts.normalize !== false ? z.string().trim() : z.string()

  return base.pipe(z.string().superRefine((v: string, ctx): void => {
    if (!check.safeParse(v).success) {
      ctx.addIssue({ code: 'custom', params: { code: 'invalid', namespace: 'dateTime', label: opts.label } })
    }
  }))
}

/**
 * Apply Range Refinements
 * Adds min/max/allowFuture/allowPast refine calls to a schema.
 *
 * @param schema - The base Zod schema to refine.
 * @param opts   - Resolved dateTime options.
 * @returns The schema with range refinements applied.
 */
function applyRangeRefinements(
  schema: z.ZodType,
  opts: DateTimeOptions,
): z.ZodType {
  let result = schema

  if (opts.min !== undefined) {
    const minDate = parseToDate(opts.min)
    result = result.refine(
      // SAFETY: refine callback on z.string() schema; v is always a string
      (v: unknown): boolean => new Date(v as string) >= minDate,
      { params: { code: 'tooEarly', namespace: 'dateTime', minimum: minDate.toISOString(), label: opts.label } },
    )
  }

  if (opts.max !== undefined) {
    const maxDate = parseToDate(opts.max)
    result = result.refine(
      // SAFETY: refine callback on z.string() schema; v is always a string
      (v: unknown): boolean => new Date(v as string) <= maxDate,
      { params: { code: 'tooLate', namespace: 'dateTime', maximum: maxDate.toISOString(), label: opts.label } },
    )
  }

  if (opts.allowFuture === false) {
    result = result.refine(
      // SAFETY: refine callback on z.string() schema; v is always a string
      (v: unknown): boolean => new Date(v as string) <= new Date(),
      { params: { code: 'noFuture', namespace: 'dateTime', label: opts.label } },
    )
  }

  if (opts.allowPast === false) {
    result = result.refine(
      // SAFETY: refine callback on z.string() schema; v is always a string
      (v: unknown): boolean => new Date(v as string) >= new Date(),
      { params: { code: 'noPast', namespace: 'dateTime', label: opts.label } },
    )
  }

  return result
}

// ----------------------------------------------------------
// RULE FACTORY
// ----------------------------------------------------------

/**
 * DateTime
 * Validates that a string is a valid ISO 8601 datetime, date, or time.
 * Supports range constraints, future/past restrictions, and precision.
 *
 * @param options - Per-call dateTime validation options.
 * @returns A Zod schema that validates date/time strings.
 */
export const DateTime = /* @__PURE__ */ createRule<DateTimeOptions>({
  name: 'dateTime',
  defaults: {},
  messages: {},
  build: (opts: DateTimeOptions): unknown => {
    let schema: z.ZodType

    switch (opts.format) {
      case 'date':
        schema = buildDateSchema(opts)
        break
      case 'time':
        schema = buildTimeSchema(opts)
        break
      case 'iso':
      case undefined:
        schema = buildDateTimeSchema(opts)
        break
    }

    if (opts.format !== 'time') {
      schema = applyRangeRefinements(schema, opts)
    }

    return schema
  },
})
