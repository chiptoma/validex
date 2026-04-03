// ==============================================================================
// VALIDATE
// Wraps Zod's safeParseAsync into a structured ValidationResult.
// Resolves cross-field constraints (sameAs, requiredWhen) after Zod parsing.
// ==============================================================================

import type { NestedErrors, ValidationResult } from '../types'
import type { IssueRecord } from './crossFieldResolver'

import { z } from 'zod'

import { initAugmentation } from '@augmentation'

import { resolveCrossFieldConstraints } from './crossFieldResolver'

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Build Dot Path
 * Joins a Zod issue path into a dot-separated string.
 *
 * @param path - Array of string or number path segments.
 * @returns A dot-separated path string (e.g. "billing.email").
 */
function buildDotPath(path: readonly (string | number)[]): string {
  return path.map(String).join('.')
}

/**
 * Build Nested Errors
 * Transforms a flat list of issues into a nested error object.
 *
 * @param issues - Array of issues with path and message.
 * @returns A recursively nested error object.
 */
function buildNestedErrors(
  issues: ReadonlyArray<{ readonly path: readonly (string | number)[], readonly message: string }>,
): NestedErrors {
  const root: Record<string, unknown> = {}

  for (const issue of issues) {
    const { path, message } = issue
    if (path.length === 0)
      continue

    let current: Record<string, unknown> = root
    for (let i = 0; i < path.length - 1; i++) {
      const segment = String(path[i])
      if (current[segment] === undefined)
        current[segment] = {}
      // SAFETY: nested object created above; always a Record at this point
      current = current[segment] as Record<string, unknown>
    }

    const lastSegment = String(path.at(-1))
    const existing = current[lastSegment]
    if (Array.isArray(existing))
      existing.push(message)
    else
      current[lastSegment] = [message]
  }

  // SAFETY: root is built to match NestedErrors shape; leaf values are string[] by construction
  return root as NestedErrors
}

/**
 * Collect Issues Into Maps
 * Merges an array of issues into errors/firstErrors maps.
 *
 * @param issues      - Issues to collect.
 * @param errors      - Mutable errors map.
 * @param firstErrors - Mutable firstErrors map.
 */
function collectIssues(
  issues: ReadonlyArray<IssueRecord>,
  errors: Record<string, string[]>,
  firstErrors: Record<string, string>,
): void {
  for (const issue of issues) {
    const dotPath = buildDotPath(issue.path)
    if (errors[dotPath] === undefined) {
      errors[dotPath] = []
      firstErrors[dotPath] = issue.message
    }
    errors[dotPath].push(issue.message)
  }
}

// ----------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------

/**
 * Validate
 * Runs Zod's safeParseAsync, resolves cross-field constraints (sameAs,
 * requiredWhen), and returns a structured ValidationResult.
 *
 * @param schema - The Zod schema to validate against.
 * @param data   - The unknown data to validate.
 * @returns A promise resolving to a typed ValidationResult.
 */
export async function validate<T extends z.ZodType>(
  schema: T,
  data: unknown,
): Promise<ValidationResult<z.output<T>>> {
  initAugmentation()
  const result = await schema.safeParseAsync(data)

  if (result.success)
    return handleSuccess(schema, result.data, data)

  return handleFailure(schema, result.error, data)
}

/**
 * Handle Success
 * Handles the success path, including cross-field checks.
 *
 * @param schema - The Zod schema.
 * @param parsed - The parsed data.
 * @param raw    - The raw input data.
 * @returns A ValidationResult (success or failure from cross-field checks).
 */
function handleSuccess<T extends z.ZodType>(
  schema: T,
  parsed: unknown,
  raw: unknown,
): ValidationResult<z.output<T>> {
  if (schema instanceof z.ZodObject) {
    // SAFETY: result.data is the parsed output of a z.object schema
    const crossIssues = resolveCrossFieldConstraints(schema, parsed as Record<string, unknown>, new Set(), raw)
    if (crossIssues.length > 0) {
      const errors: Record<string, string[]> = {}
      const firstErrors: Record<string, string> = {}
      collectIssues(crossIssues, errors, firstErrors)
      return { success: false, errors, firstErrors, nestedErrors: buildNestedErrors(crossIssues), issues: crossIssues }
    }
  }

  return {
    success: true,
    data: parsed as z.output<T>, // SAFETY: Zod safeParseAsync returns inferred output type on success
    errors: {},
    firstErrors: {},
    nestedErrors: {},
    issues: [],
  }
}

/**
 * Handle Failure
 * Handles the failure path, including cross-field checks on partial data.
 *
 * @param schema - The Zod schema.
 * @param error  - The Zod error.
 * @param raw    - The raw input data.
 * @returns A failure ValidationResult.
 */
function handleFailure<T extends z.ZodType>(
  schema: T,
  error: z.ZodError,
  raw: unknown,
): ValidationResult<z.output<T>> {
  // SAFETY: Zod issues always carry path and message; cast narrows the opaque issue type
  const rawIssues = error.issues as ReadonlyArray<{
    readonly path: readonly (string | number)[]
    readonly message: string
  }>

  const errors: Record<string, string[]> = {}
  const firstErrors: Record<string, string> = {}
  const fieldErrors = new Set<string>()

  for (const issue of rawIssues) {
    const dotPath = buildDotPath(issue.path)
    fieldErrors.add(dotPath)
    if (errors[dotPath] === undefined) {
      errors[dotPath] = []
      firstErrors[dotPath] = issue.message
    }
    errors[dotPath].push(issue.message)
  }

  if (schema instanceof z.ZodObject) {
    // SAFETY: raw input cast to Record for field access; non-object inputs produce empty parsed
    const rawObj = (typeof raw === 'object' && raw !== null) ? raw as Record<string, unknown> : {}
    const crossIssues = resolveCrossFieldConstraints(schema, rawObj, fieldErrors, raw)
    collectIssues(crossIssues, errors, firstErrors)

    if (crossIssues.length > 0) {
      const allIssues = [...rawIssues, ...crossIssues]
      return { success: false, errors, firstErrors, nestedErrors: buildNestedErrors(allIssues), issues: allIssues }
    }
  }

  return {
    success: false,
    errors,
    firstErrors,
    nestedErrors: buildNestedErrors(rawIssues),
    // SAFETY: issues escape hatch exposes raw Zod issues as ReadonlyArray<unknown> for consumers
    issues: error.issues as ReadonlyArray<unknown>,
  }
}
