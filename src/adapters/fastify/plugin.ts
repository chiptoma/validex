// ==============================================================================
// FASTIFY PLUGIN
// Registers validex validation as Fastify instance and request decorators,
// with optional route-level preValidation via Zod schemas.
// ==============================================================================

import type {
  FastifyInstance,
  FastifyReply,
  FastifyRequest,
} from 'fastify'
import type { z } from 'zod'
import type { GlobalConfig, PreloadOptions, ValidationResult } from '../../types'
import type { ValidateSource } from './decorators'
import fp from 'fastify-plugin'
import { preloadData, setup } from '../../config'
import { validate } from '../../core/validate'
import { validateData, validateRequest } from './decorators'

// ----------------------------------------------------------
// MODULE AUGMENTATION
// ----------------------------------------------------------

/**
 * RequestValidateFn
 * Request-level validate function signature for module augmentation.
 *
 * @internal
 */
type RequestValidateFn = <T extends z.ZodType>(
  schema: T,
  opts?: { readonly source?: ValidateSource },
) => Promise<ValidationResult<z.output<T>>>

declare module 'fastify' {
  /** Augmented FastifyInstance with validex decorator. */
  interface FastifyInstance {
    validate: typeof validateData
  }
  /** Augmented FastifyRequest with validex decorator. */
  interface FastifyRequest {
    validate: RequestValidateFn
  }
}

// ----------------------------------------------------------
// PLUGIN OPTIONS
// ----------------------------------------------------------

/**
 * ValidexFastifyOptions
 * Configuration accepted by the validex Fastify plugin.
 */
export interface ValidexFastifyOptions {
  /** Global rule defaults passed to setup(). */
  readonly rules?: GlobalConfig['rules']
  /** Data files to preload at registration time. */
  readonly preload?: PreloadOptions
  /** Custom handler invoked when route-level validation fails. */
  readonly errorHandler?: (
    result: ValidationResult<unknown>,
    request: FastifyRequest,
    reply: FastifyReply,
  ) => void | Promise<void>
}

// ----------------------------------------------------------
// ZOD SCHEMA GUARD
// ----------------------------------------------------------

/**
 * Is Zod Schema
 * Type guard that checks whether a value looks like a Zod schema
 * by verifying the presence of a safeParseAsync method.
 *
 * @param value - The value to inspect.
 * @returns True when the value exposes safeParseAsync.
 */
function isZodSchema(value: unknown): value is z.ZodType {
  return (
    typeof value === 'object'
    && value !== null
    && 'safeParseAsync' in value
    && typeof (value as Record<string, unknown>)['safeParseAsync'] === 'function'
  )
}

// ----------------------------------------------------------
// HOOK HANDLERS
// ----------------------------------------------------------

/**
 * Attach Request Validate
 * PreHandler hook that binds a validate function onto each request.
 *
 * @param request - The incoming Fastify request.
 * @param _reply  - The Fastify reply (unused).
 * @returns A resolved promise after attaching the decorator.
 */
async function attachRequestValidate(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  request.validate = async <T extends z.ZodType>(
    schema: T,
    opts?: { readonly source?: ValidateSource },
  ): Promise<ValidationResult<z.output<T>>> => {
    const source = opts?.source ?? 'body'
    return validateRequest(schema, {
      body: request.body,
      query: request.query,
      params: request.params,
    }, source)
  }
}

/**
 * Build PreValidation Hook
 * Returns an async preValidation hook that validates the request body
 * against a Zod schema stored in route config.validex.body.
 *
 * @param errorHandler - Optional custom error handler from plugin options.
 * @returns An async preValidation hook function.
 */
function buildPreValidationHook(
  errorHandler?: ValidexFastifyOptions['errorHandler'],
): (request: FastifyRequest, reply: FastifyReply) => Promise<void> {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const routeConfig = request.routeOptions.config as unknown as Record<string, unknown>
    const validexConfig = routeConfig['validex']
    if (typeof validexConfig !== 'object' || validexConfig === null)
      return

    const bodySchema = (validexConfig as Record<string, unknown>)['body']
    if (!isZodSchema(bodySchema))
      return

    const result = await validate(bodySchema, request.body)
    if (result.success)
      return

    if (errorHandler !== undefined) {
      await errorHandler(result, request, reply)
      return
    }

    await reply.status(400).send({
      statusCode: 400,
      error: 'Validation Error',
      errors: result.firstErrors,
      allErrors: result.errors,
    })
  }
}

// ----------------------------------------------------------
// PLUGIN
// ----------------------------------------------------------

/**
 * Validex Plugin Implementation
 * Sets up validex on a Fastify instance via app.register().
 * Registers app.validate, request.validate, and a preValidation hook.
 * Wrapped with fastify-plugin to expose decorators at the parent scope.
 *
 * @param app     - The Fastify instance.
 * @param options - Plugin configuration.
 * @returns A promise that resolves when setup is complete.
 */
async function validexPluginImpl(
  app: FastifyInstance,
  options: ValidexFastifyOptions = {},
): Promise<void> {
  if (options.rules !== undefined) {
    setup({ rules: options.rules })
  }

  if (options.preload !== undefined) {
    await preloadData(options.preload)
  }

  app.decorate('validate', validateData)
  app.decorateRequest('validate', undefined as unknown as FastifyRequest['validate'])
  app.addHook('preHandler', attachRequestValidate)
  app.addHook('preValidation', buildPreValidationHook(options.errorHandler))
}

/**
 * Validex Plugin
 * Fastify 5 plugin that registers validex decorators and hooks.
 * Register via app.register(validexPlugin, options).
 */
export const validexPlugin = fp(validexPluginImpl, {
  name: 'validex',
  fastify: '5.x',
})
