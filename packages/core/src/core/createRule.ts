// ==============================================================================
// CREATE RULE
// Factory function for building validex rules with three-tier merge.
// ==============================================================================

import type { BaseRuleOptions, CreateRuleOptions, RuleFactory } from '../types'

import { z } from 'zod'

import { initAugmentation } from '@augmentation'
import { RULE_DEFAULTS } from '@config/defaults'
import { getConfig } from '@config/index'
import { mergeThreeTiers } from '@config/merge'

import { registerCrossField } from './crossFieldRegistry'
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
 * Wraps a schema to reject empty strings with a validex-coded required error,
 * then pass non-empty values through to the inner schema.
 *
 * @param schema - The Zod schema to wrap.
 * @param label  - Explicit label for the required error.
 * @returns A new schema with the empty-to-required transform applied.
 */
function applyEmptyToUndefined(schema: z.ZodType, label?: string): z.ZodType {
  return z.preprocess(
    (val: unknown): unknown => {
      if (val === '')
        return undefined
      if (val === null)
        return undefined
      return val
    },
    z.unknown().superRefine((val: unknown, ctx) => {
      if (val === undefined || val === null) {
        ctx.addIssue({ code: 'custom', params: { code: 'required', namespace: 'base', label } })
      }
    }).pipe(schema),
  )
}

/**
 * Apply Custom Fn
 * Appends a .refine() that runs the user's custom validation function.
 *
 * @param schema    - The Zod schema to refine.
 * @param customFn  - The custom validation function.
 * @param namespace - The rule namespace for error params.
 * @param label     - Explicit label for error messages.
 * @returns A new schema with the custom refine applied.
 */
function applyCustomFn(
  schema: z.ZodType,
  customFn: (value: string) => true | string | Promise<true | string>,
  namespace: string,
  label?: string,
): z.ZodType {
  return schema.superRefine(async (value: unknown, ctx) => {
    /* v8 ignore next 2 -- defensive type guard; schema is z.string() so value is always string */
    if (typeof value !== 'string')
      return
    const result: true | string = await customFn(value)
    if (result === true)
      return
    const errorMsg = typeof result === 'string' ? result : FALLBACK_MESSAGE
    const params: Record<string, unknown> = { code: 'custom', namespace }
    if (label !== undefined)
      params['label'] = label
    ctx.addIssue({
      code: 'custom',
      message: errorMsg,
      params,
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
  config: CreateRuleOptions<T>,
): RuleFactory<T> {
  assertNotReserved(config.name)
  let messagesRegistered = false

  return (options?: Partial<T>): unknown => {
    initAugmentation()
    if (!messagesRegistered) {
      if (Object.keys(config.messages).length > 0) {
        registerMessages(config.name, config.messages)
      }
      messagesRegistered = true
    }
    const tier1Defaults = RULE_DEFAULTS[config.name] ?? {}
    // SAFETY: Options are plain objects flowing through three-tier merge
    const tier1 = { ...tier1Defaults, ...config.defaults } as Record<string, unknown>
    // SAFETY: RuleDefaults values are plain option objects; cast bridges typed config to untyped merge
    const globals = ((getConfig().rules as Record<string, Record<string, unknown>> | undefined)?.[config.name] ?? {})
    const mergedOpts = mergeThreeTiers(
      tier1,
      globals,
      // SAFETY: Options are plain objects flowing through three-tier merge
      (options ?? {}) as Record<string, unknown>,
    ) as T // SAFETY: Merge result conforms to T by construction; all keys validated by TypeScript at call site

    // SAFETY: build() always returns a ZodType; unknown used in interface for loose coupling
    const baseSchema = config.build(mergedOpts) as z.ZodType

    let schema: z.ZodType = mergedOpts.emptyToUndefined !== false
      ? applyEmptyToUndefined(baseSchema, mergedOpts.label)
      : baseSchema

    if (mergedOpts.customFn !== undefined) {
      // Use .pipe() so customFn only runs after base schema passes
      const customRefine = applyCustomFn(z.string(), mergedOpts.customFn, config.name, mergedOpts.label)
      schema = schema.pipe(customRefine)
    }

    if (mergedOpts.sameAs !== undefined || mergedOpts.requiredWhen !== undefined || mergedOpts.label !== undefined) {
      registerCrossField(schema, {
        sameAs: mergedOpts.sameAs,
        requiredWhen: mergedOpts.requiredWhen,
        label: mergedOpts.label,
      })
    }

    return schema
  }
}
