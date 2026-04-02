// ==============================================================================
// TEST RULE CONTRACT
// Shared test harness that verifies the universal contract every rule must
// satisfy. Rule-specific tests are separate; this covers only the common
// guarantees.
// ==============================================================================

import type { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { getParams } from '../../../src/core/getParams'

// ----------------------------------------------------------
// CAMEL CASE PATTERN
// ----------------------------------------------------------

const CAMEL_CASE_RE = /^[a-z][a-zA-Z]*$/

// ----------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------

/**
 * Test Rule Contract
 * Runs a standardized set of tests against a rule factory to ensure it
 * satisfies the universal validex rule contract.
 *
 * @param ruleName    - Human-readable rule name for the test block title.
 * @param ruleFactory - Factory function that returns a Zod schema.
 * @param namespace   - Expected error namespace for the rule.
 */
export function testRuleContract(
  ruleName: string,
  ruleFactory: (opts?: Record<string, unknown>) => unknown,
  namespace: string,
): void {
  describe(`${ruleName} (universal contract)`, () => {
    it('accepts undefined when field is optional', () => {
      const schema = ruleFactory() as z.ZodType
      const optional = schema.optional()
      const result = optional.safeParse(undefined)

      expect(result.success).toBe(true)
    })

    it('converts empty string to undefined (emptyToUndefined: true)', () => {
      const schema = ruleFactory() as z.ZodType
      const result = schema.safeParse('')

      expect(result.success).toBe(false)

      if (!result.success) {
        const issue = result.error.issues[0]
        expect(issue).toBeDefined()

        const params = getParams(issue as Parameters<typeof getParams>[0])
        expect(params.code).toBe('required')
        expect(params.namespace).toBe('base')
      }
    })

    it('error issues have correct namespace', () => {
      const schema = ruleFactory() as z.ZodType
      const result = schema.safeParse(12345)

      expect(result.success).toBe(false)

      if (!result.success) {
        for (const issue of result.error.issues) {
          const params = getParams(issue as Parameters<typeof getParams>[0])
          expect([namespace, 'base']).toContain(params.namespace)
        }
      }
    })

    it('error codes are camelCase', () => {
      const schema = ruleFactory() as z.ZodType
      const result = schema.safeParse(12345)

      expect(result.success).toBe(false)

      if (!result.success) {
        for (const issue of result.error.issues) {
          const params = getParams(issue as Parameters<typeof getParams>[0])
          expect(params.code).toMatch(CAMEL_CASE_RE)
        }
      }
    })
  })
}
