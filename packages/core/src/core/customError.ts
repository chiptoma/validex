// ==============================================================================
// CUSTOM ERROR HANDLER
// Registers a customError handler with Zod 4 via z.config().
// ==============================================================================

import { z } from 'zod'
import { getConfig } from '../config/store'
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
    // SAFETY: Array.isArray guard ensures rawPath is an array; elements filtered by type predicate below
    ? (rawPath as unknown[]).filter(
        (s): s is string | number =>
          typeof s === 'string' || typeof s === 'number',
      )
    : undefined

  return {
    /* c8 ignore start -- defensive ternary guards; Zod always provides code/expected/received as strings when present */
    code: typeof issue['code'] === 'string' ? issue['code'] : undefined,
    path,
    minimum: issue['minimum'],
    maximum: issue['maximum'],
    expected: typeof issue['expected'] === 'string' ? issue['expected'] : undefined,
    received: typeof issue['received'] === 'string' ? issue['received'] : undefined,
    input: issue['input'],
    format: typeof issue['format'] === 'string' ? issue['format'] : undefined,
    /* c8 ignore stop */
    // SAFETY: Zod issues have untyped params; narrowed via isValidexIssue guard
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

let _registered = false

/**
 * Ensure Custom Error
 * Idempotent guard — registers the customError handler at most once.
 * Safe to call from hot paths (validate, createRule, setup).
 */
export function ensureCustomError(): void {
  if (_registered)
    return
  registerCustomError()
}

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
      // SAFETY: Zod 4 customError issue is an opaque object; cast to Record for field access in adaptIssue
      const adapted = adaptIssue(issue as unknown as Record<string, unknown>)
      const params = adapted.params ?? {}

      const shouldHandle = isValidexIssue(params)
        || (adapted.code !== undefined && NATIVE_CODES.has(adapted.code))

      /* c8 ignore start -- defensive fallthrough; prev handler may be undefined or return undefined */
      if (!shouldHandle) {
        return prev?.(issue) ?? undefined
      }
      /* c8 ignore stop */

      const errorParams = getParams(adapted)
      const config = getConfig()
      const i18n = config.i18n

      // --- Resolve message ---
      let msg: string

      if (i18n.enabled && i18n.t !== undefined) {
        // i18n with t(): translate message with all params (label already translated)
        msg = i18n.t(errorParams.key, { ...errorParams })
      }
      else if (i18n.enabled) {
        // i18n without t(): return the key itself (consumer translates externally)
        msg = errorParams.key
      }
      else {
        // No i18n: English interpolation (current behavior)
        msg = getErrorMessage(
          errorParams.namespace,
          errorParams.code,
          { ...errorParams },
        )
      }

      // --- Apply message.transform if configured ---
      if (config.message?.transform !== undefined) {
        msg = config.message.transform({
          key: errorParams.key,
          code: errorParams.code,
          namespace: errorParams.namespace,
          path: errorParams.path,
          label: errorParams.label,
          message: msg,
          params: { ...errorParams },
        })
      }

      return { message: msg }
    },
  })
  _registered = true
}

/**
 * Reset Custom Error Flag
 * Resets the registration flag so registerCustomError can re-register.
 *
 * @internal
 */
export function _resetCustomErrorFlag(): void {
  _registered = false
}
