// ==============================================================================
// CUSTOM ERROR HANDLER
// Registers a customError handler with Zod 4 via z.config().
// ==============================================================================

import { z } from 'zod'
import { getErrorMessage } from './errorMap'
import { getParams } from './getParams'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * IssueAdapter
 * Subset of Zod issue fields used by getParams, with path narrowed
 * from PropertyKey[] to (string | number)[].
 */
interface IssueAdapter {
  readonly code?: string | undefined
  readonly path?: ReadonlyArray<string | number> | undefined
  readonly minimum?: unknown
  readonly maximum?: unknown
  readonly expected?: string | undefined
  readonly received?: string | undefined
  readonly input?: unknown
  readonly format?: string | undefined
  readonly params?: Readonly<Record<string, unknown>> | undefined
}

// ----------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------

const NATIVE_CODES = new Set([
  'too_small',
  'too_big',
  'invalid_type',
  'invalid_format',
  'invalid_string',
])

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Adapt Issue
 * Narrows a Zod raw issue (with PropertyKey[] path) to IssueAdapter.
 *
 * @param issue - The raw Zod issue record.
 * @returns An IssueAdapter with path narrowed to (string | number)[].
 */
function adaptIssue(issue: Record<string, unknown>): IssueAdapter {
  const rawPath = issue['path']
  const path = Array.isArray(rawPath)
    ? (rawPath as unknown[]).filter(
        (s): s is string | number =>
          typeof s === 'string' || typeof s === 'number',
      )
    : undefined

  return {
    code: typeof issue['code'] === 'string' ? issue['code'] : undefined,
    path,
    minimum: issue['minimum'],
    maximum: issue['maximum'],
    expected: typeof issue['expected'] === 'string' ? issue['expected'] : undefined,
    received: typeof issue['received'] === 'string' ? issue['received'] : undefined,
    input: issue['input'],
    format: typeof issue['format'] === 'string' ? issue['format'] : undefined,
    params: issue['params'] as Readonly<Record<string, unknown>> | undefined,
  }
}

/**
 * Is Validex Issue
 * Checks whether the issue carries validex-specific params.
 *
 * @param params - The issue params record.
 * @returns True if the issue has validex code and namespace.
 */
function isValidexIssue(params: Readonly<Record<string, unknown>>): boolean {
  return params['code'] !== undefined && params['namespace'] !== undefined
}

// ----------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------

/**
 * Register Custom Error
 * Registers the validex customError handler with Zod 4.
 * Wraps any previously registered handler so it is still called
 * for issues that validex does not handle.
 */
export function registerCustomError(): void {
  const prev = z.config().customError

  z.config({
    customError(issue) {
      const adapted = adaptIssue(issue as unknown as Record<string, unknown>)
      const params = adapted.params ?? {}

      const shouldHandle = isValidexIssue(params)
        || (adapted.code !== undefined && NATIVE_CODES.has(adapted.code))

      /* v8 ignore start -- defensive fallthrough; prev handler may be undefined or return undefined */
      if (!shouldHandle) {
        return prev?.(issue) ?? undefined
      }
      /* v8 ignore stop */

      const errorParams = getParams(adapted)
      const msg = getErrorMessage(
        errorParams.namespace,
        errorParams.code,
        { ...errorParams },
      )

      return { message: msg }
    },
  })
}
