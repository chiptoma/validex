// ==============================================================================
// PARSE HELPERS
// Shared parse wrappers and error code extractors used across tests.
// ==============================================================================

import type { z } from 'zod'

import { getParams } from '@core/getParams'

// ----------------------------------------------------------
// PARSE WRAPPERS
// ----------------------------------------------------------

/**
 * Parse
 * Wraps safeParse for concise test assertions.
 *
 * @param schema - The Zod schema to parse with.
 * @param value  - The value to parse.
 * @returns The safe parse result.
 */
export function parse(
  schema: unknown,
  value: unknown,
): { success: boolean, data?: unknown, error?: { issues: readonly unknown[] } } {
  return (schema as z.ZodType).safeParse(value)
}

/**
 * Parse Async
 * Wraps safeParseAsync for concise test assertions.
 *
 * @param schema - The Zod schema to parse with.
 * @param value  - The value to parse.
 * @returns The safe parse result.
 */
export async function parseAsync(
  schema: unknown,
  value: unknown,
): Promise<{ success: boolean, data?: unknown, error?: { issues: readonly unknown[] } }> {
  return (schema as z.ZodType).safeParseAsync(value)
}

// ----------------------------------------------------------
// FIRST PARAMS EXTRACTORS
// ----------------------------------------------------------

/**
 * Parses value against schema synchronously and returns getParams() of the
 * first issue. Throws if the parse succeeds.
 *
 * @param schema - The Zod schema to parse with.
 * @param value  - The value to parse.
 * @returns The extracted params from the first issue.
 */
export function firstParams(
  schema: unknown,
  value: unknown,
): ReturnType<typeof getParams> {
  const result = (schema as z.ZodType).safeParse(value)
  if (result.success)
    throw new Error(`Expected parse to fail for value: ${String(value)}`)
  return getParams(result.error.issues[0] as Parameters<typeof getParams>[0])
}

/**
 * Parses value against schema asynchronously and returns getParams() of the
 * first issue. Throws if the parse succeeds.
 *
 * @param schema - The Zod schema to parse with.
 * @param value  - The value to parse.
 * @returns The extracted params from the first issue.
 */
export async function firstParamsAsync(
  schema: unknown,
  value: unknown,
): Promise<ReturnType<typeof getParams>> {
  const result = await (schema as z.ZodType).safeParseAsync(value)
  if (result.success)
    throw new Error(`Expected parse to fail for value: ${String(value)}`)
  return getParams(result.error.issues[0] as Parameters<typeof getParams>[0])
}

// ----------------------------------------------------------
// ERROR CODE EXTRACTORS
// ----------------------------------------------------------

/**
 * Get Error Codes
 * Synchronously parses and extracts validex error codes from issues.
 *
 * @param schema - The Zod schema to parse with.
 * @param value  - The value to parse.
 * @returns Array of error code strings.
 */
export function getErrorCodes(schema: unknown, value: unknown): ReadonlyArray<string> {
  const result = (schema as z.ZodType).safeParse(value)
  if (result.success)
    return []
  return result.error.issues.map((issue) => {
    const params = getParams(issue as Parameters<typeof getParams>[0])
    return params.code
  })
}

/**
 * Get Async Error Codes
 * Async parses and extracts validex error codes from issues.
 *
 * @param schema - The Zod schema to parse with.
 * @param value  - The value to parse.
 * @returns Array of error code strings.
 */
export async function getAsyncErrorCodes(schema: unknown, value: unknown): Promise<ReadonlyArray<string>> {
  const result = await (schema as z.ZodType).safeParseAsync(value)
  if (result.success)
    return []
  return result.error.issues.map((issue) => {
    const params = getParams(issue as Parameters<typeof getParams>[0])
    return params.code
  })
}
