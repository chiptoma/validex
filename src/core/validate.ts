// ==============================================================================
// VALIDATE
// Wraps Zod's safeParseAsync into a structured ValidationResult.
// ==============================================================================

import type { z } from 'zod'
import type { NestedErrors, ValidationResult } from '../types'

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
 * Transforms a flat list of Zod issues into a nested error object
 * matching the schema shape.
 *
 * @param issues - Array of Zod issues with path and message.
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
      if (current[segment] === undefined) {
        current[segment] = {}
      }
      current = current[segment] as Record<string, unknown>
    }

    const lastSegment = String(path.at(-1))
    const existing = current[lastSegment]
    if (Array.isArray(existing)) {
      existing.push(message)
    }
    else {
      current[lastSegment] = [message]
    }
  }

  return root as NestedErrors
}

// ----------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------

/**
 * Validate
 * Runs Zod's safeParseAsync and returns a structured ValidationResult.
 *
 * @param schema - The Zod schema to validate against.
 * @param data   - The unknown data to validate.
 * @returns A promise resolving to a typed ValidationResult.
 */
export async function validate<T extends z.ZodType>(
  schema: T,
  data: unknown,
): Promise<ValidationResult<z.output<T>>> {
  const result = await schema.safeParseAsync(data)

  if (result.success) {
    return {
      success: true,
      data: result.data as z.output<T>,
      errors: {},
      firstErrors: {},
      nestedErrors: {},
      issues: [],
    }
  }

  const rawIssues = result.error.issues as ReadonlyArray<{
    readonly path: readonly (string | number)[]
    readonly message: string
  }>

  const errors: Record<string, string[]> = {}
  const firstErrors: Record<string, string> = {}

  for (const issue of rawIssues) {
    const dotPath = buildDotPath(issue.path)
    if (errors[dotPath] === undefined) {
      errors[dotPath] = []
      firstErrors[dotPath] = issue.message
    }
    errors[dotPath].push(issue.message)
  }

  return {
    success: false,
    errors,
    firstErrors,
    nestedErrors: buildNestedErrors(rawIssues),
    issues: result.error.issues as ReadonlyArray<unknown>,
  }
}
