// ==============================================================================
// UUID RULE
// Validates UUID strings with optional version filtering and normalization.
// ==============================================================================

import type { BaseRuleOptions } from '../types'
import { z } from 'zod'
import { createRule } from '../core/createRule'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * UUIDOptions
 * Configuration options for the UUID validation rule.
 */
export interface UUIDOptions extends BaseRuleOptions {
  /** UUID version to accept (1-8 or 'any'). Defaults to 'any'. */
  readonly version?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 'any' | undefined
}

// ----------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------

const UUID_VERSION_INDEX = 14

// ----------------------------------------------------------
// RULE FACTORY
// ----------------------------------------------------------

/**
 * UUID
 * Validates that a string is a valid UUID, optionally restricted to a
 * specific version. Normalizes to lowercase + trimmed by default.
 *
 * @param options - Per-call UUID validation options.
 * @returns A Zod schema that validates UUID strings.
 */
export const uuid = /* @__PURE__ */ createRule<UUIDOptions>({
  name: 'uuid',
  defaults: {},
  messages: {
    invalid: '{{label}} is not a valid UUID',
  },
  build: (opts: UUIDOptions): unknown => {
    let schema = opts.normalize !== false
      ? z.string().trim().toLowerCase().uuid()
      : z.string().uuid()

    if (opts.version !== undefined && opts.version !== 'any') {
      const expected = String(opts.version)
      schema = schema.refine(
        (v: string): boolean => v.charAt(UUID_VERSION_INDEX) === expected,
        { params: { code: 'invalid', namespace: 'uuid' } },
      )
    }

    return schema
  },
})
