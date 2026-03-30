// ==============================================================================
// CREATE RULE
// Factory function for building validex rules with three-tier merge.
// ==============================================================================

import type { BaseRuleOptions, CreateRuleConfig, RuleFactory } from '../types'
import { z } from 'zod'
import { getConfig } from '../config/index'
import { mergeThreeTiers } from '../config/merge'
import { registerMessages } from './errorMap'

// ----------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------

const RESERVED_NAMESPACES: ReadonlyArray<string> = ['base', 'string', 'confirmation']
const FALLBACK_MESSAGE = 'Validation failed'

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Assert Not Reserved
 * Throws if the given name is a reserved namespace.
 *
 * @param name - The rule namespace to check.
 */
function assertNotReserved(name: string): void {
  if (RESERVED_NAMESPACES.includes(name)) {
    throw new Error(
      `validex: "${name}" is a reserved namespace and cannot be used as a rule name`,
    )
  }
}

/**
 * Apply Empty To Undefined
 * Wraps a schema with z.preprocess to convert empty strings to undefined.
 *
 * @param schema - The Zod schema to wrap.
 * @returns A new schema with the preprocess transform applied.
 */
function applyEmptyToUndefined(schema: z.ZodType): z.ZodType {
  return z.preprocess(
    (val: unknown): unknown => (val === '' ? undefined : val),
    schema,
  )
}

/**
 * Apply Custom Fn
 * Appends a .refine() that runs the user's custom validation function.
 *
 * @param schema    - The Zod schema to refine.
 * @param customFn  - The custom validation function.
 * @param namespace - The rule namespace for error params.
 * @returns A new schema with the custom refine applied.
 */
function applyCustomFn(
  schema: z.ZodType,
  customFn: (value: string) => true | string | Promise<true | string>,
  namespace: string,
): z.ZodType {
  return schema.superRefine(async (value: unknown, ctx) => {
    if (typeof value !== 'string')
      return
    const result: true | string = await customFn(value)
    if (result === true)
      return
    const errorMsg = typeof result === 'string' ? result : FALLBACK_MESSAGE
    ctx.addIssue({
      code: 'custom',
      message: errorMsg,
      params: { code: 'custom', namespace },
    })
  })
}

// ----------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------

/**
 * Create Rule
 * Factory that builds a reusable validation rule with three-tier merge,
 * empty-to-undefined preprocessing, and optional custom validation.
 *
 * @param config - The rule configuration object.
 * @returns A RuleFactory function that accepts per-call options.
 */
export function createRule<T extends BaseRuleOptions>(
  config: CreateRuleConfig<T>,
): RuleFactory<T> {
  assertNotReserved(config.name)
  let messagesRegistered = false

  return (options?: Partial<T>): unknown => {
    if (!messagesRegistered) {
      registerMessages(config.name, config.messages)
      messagesRegistered = true
    }
    const globals = getConfig().rules?.[config.name] ?? {}
    const mergedOpts = mergeThreeTiers(
      config.defaults as Record<string, unknown>,
      globals,
      (options ?? {}) as Record<string, unknown>,
    ) as T

    // SAFETY: config.build returns unknown but always produces a ZodType
    const baseSchema = config.build(mergedOpts) as z.ZodType

    let schema: z.ZodType = mergedOpts.emptyToUndefined !== false
      ? applyEmptyToUndefined(baseSchema)
      : baseSchema

    if (mergedOpts.customFn !== undefined) {
      // Use .pipe() so customFn only runs after base schema passes
      const customRefine = applyCustomFn(z.string(), mergedOpts.customFn, config.name)
      schema = schema.pipe(customRefine)
    }

    return schema
  }
}
