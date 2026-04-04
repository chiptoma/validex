// ==============================================================================
// FASTIFY TEST HELPERS
// Shared utilities for all Fastify adapter tests.
// ==============================================================================

import type { FastifyInstance, LightMyRequestResponse } from 'fastify'

import type { ValidexFastifyOptions } from '../../../src'

import Fastify from 'fastify'

import { validexPlugin } from '../../../src'

// ----------------------------------------------------------
// ERROR RESPONSE TYPE
// ----------------------------------------------------------

/**
 * ErrorResponse
 * Shape returned by the default validex error handler (400 response).
 */
export interface ErrorResponse {
  readonly statusCode: number
  readonly error: string
  readonly errors: Readonly<Record<string, string>>
  readonly allErrors: Readonly<Record<string, readonly string[]>>
}

// ----------------------------------------------------------
// JSON PARSER
// ----------------------------------------------------------

/**
 * Parse JSON
 * Type-safe JSON parser for Fastify inject responses.
 *
 * @param response - The Fastify inject response.
 * @returns The parsed JSON body.
 */
export function parseJson<T = Record<string, unknown>>(response: LightMyRequestResponse): T {
  return response.json()
}

// ----------------------------------------------------------
// APP FACTORY
// ----------------------------------------------------------

/**
 * Create App
 * Creates a Fastify instance with the validex plugin registered.
 * Always call app.close() when done (or use withApp helper).
 *
 * @param options - Optional validex plugin options.
 * @returns A ready Fastify instance with validex registered.
 */
export async function createApp(options: ValidexFastifyOptions = {}): Promise<FastifyInstance> {
  const app = Fastify()
  await app.register(validexPlugin, options)
  return app
}
