// ==============================================================================
// FASTIFY DECORATORS
// Thin validation wrappers used by the Fastify plugin as instance and request
// decorators.
// ==============================================================================

import type { ValidationResult } from '@validex/core'
import type { z } from 'zod'

import { validate } from '@validex/core'

// ----------------------------------------------------------
// DATA SOURCE
// ----------------------------------------------------------

/** ValidateSource - Allowed request data sources for validation. */
export type ValidateSource = 'body' | 'params' | 'query'

// ----------------------------------------------------------
// DECORATOR FUNCTIONS
// ----------------------------------------------------------

/**
 * Validate Data
 * Validates arbitrary data against a Zod schema. Used as the
 * instance-level decorator (app.validate).
 *
 * @param schema - The Zod schema to validate against.
 * @param data   - The unknown data to validate.
 * @returns A promise resolving to a typed ValidationResult.
 */
export async function validateData<T extends z.ZodType>(
  schema: T,
  data: unknown,
): Promise<ValidationResult<z.output<T>>> {
  return validate(schema, data)
}

/**
 * Validate Request
 * Validates request data from a specific source against a Zod schema.
 * Used as the request-level decorator (request.validate).
 *
 * @param schema  - The Zod schema to validate against.
 * @param sources - Object containing body, query, and params.
 * @param source  - Which request property to validate.
 * @returns A promise resolving to a typed ValidationResult.
 */
export async function validateRequest<T extends z.ZodType>(
  schema: T,
  sources: Readonly<{ body: unknown, query: unknown, params: unknown }>,
  source: ValidateSource = 'body',
): Promise<ValidationResult<z.output<T>>> {
  const data = sources[source]
  return validate(schema, data)
}
