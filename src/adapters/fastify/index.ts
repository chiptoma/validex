// ==============================================================================
// FASTIFY ADAPTER
// Public entry point for the validex Fastify integration.
// ==============================================================================

export { validateData, validateRequest } from './decorators'
export type { ValidateSource } from './decorators'
export { validexPlugin } from './plugin'
export type { ValidexFastifyOptions } from './plugin'
