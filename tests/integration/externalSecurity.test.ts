// ==============================================================================
// EXTERNAL SECURITY TESTS
// Hardening tests that run XSS and injection payloads against format-constrained
// rules, plus ReDoS resistance timing checks on adversarial inputs.
// ------------------------------------------------------------------------------
// Format-constrained rules (PersonName, BusinessName, Username, Slug, Email,
// LicenseKey) reject ALL payloads due to their strict character set and
// structural regex requirements. General-purpose rules like Text and Password
// are intentionally excluded because they accept arbitrary character sets.
// ==============================================================================

import type { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { BusinessName } from '../../src/rules/businessName'
import { email } from '../../src/rules/email'
import { LicenseKey } from '../../src/rules/licenseKey'
import { PersonName } from '../../src/rules/personName'
import { Slug } from '../../src/rules/slug'
import { text } from '../../src/rules/text'
import { Username } from '../../src/rules/username'
import injectionPayloads from '../fixtures/security.injection.json'
import xssPayloads from '../fixtures/security.xss.json'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

interface SecurityPayload {
  readonly value: string
  readonly note: string
}

interface RuleEntry {
  readonly name: string
  readonly factory: (...args: never[]) => unknown
}

// ----------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------

/**
 * Rules with strict format constraints that reject both XSS and injection
 * payloads by their structural regex or character set requirements.
 */
const FORMAT_RULES: ReadonlyArray<RuleEntry> = [
  { name: 'PersonName', factory: PersonName },
  { name: 'BusinessName', factory: BusinessName },
  { name: 'Username', factory: Username },
  { name: 'Slug', factory: Slug },
  { name: 'Email', factory: email },
  { name: 'LicenseKey', factory: LicenseKey },
]

/**
 * Additional payloads that are not present in the fixture files but cover
 * important edge cases. These are tested inline rather than modifying
 * the shared fixture files.
 */
const EXTRA_XSS_PAYLOADS: ReadonlyArray<SecurityPayload> = [
  {
    value: 'valid\x00<script>alert(1)</script>',
    note: 'Null byte splitting valid prefix from script tag',
  },
  {
    value: '\u003Cscript\u003Ealert(1)\u003C/script\u003E',
    note: 'Actual unicode chars (not escaped literals) for angle brackets',
  },
  {
    value: 'A'.repeat(100_000),
    note: '100k character overflow string',
  },
]

const REDOS_THRESHOLD_MS = 100

const ADVERSARIAL_INPUTS: ReadonlyArray<readonly [string, string]> = [
  ['a'.repeat(100_000), 'repeated single char (100k)'],
  ['ab'.repeat(50_000), 'alternating chars (100k)'],
  ['!@#$%'.repeat(20_000), 'repeated special chars (100k)'],
  [' '.repeat(100_000), 'repeated spaces (100k)'],
  ['<'.repeat(50_000) + '>'.repeat(50_000), 'nested angle brackets (100k)'],
]

const REDOS_RULES: ReadonlyArray<RuleEntry> = [
  { name: 'PersonName', factory: PersonName },
  { name: 'BusinessName', factory: BusinessName },
  { name: 'Username', factory: Username },
  { name: 'Slug', factory: Slug },
  { name: 'Email', factory: email },
  { name: 'Text', factory: text },
]

// ----------------------------------------------------------
// PART A — FORMAT RULES VS SECURITY PAYLOADS
// ----------------------------------------------------------

for (const { name, factory } of FORMAT_RULES) {
  describe(`${name} — XSS payloads`, () => {
    const schema = factory() as z.ZodType

    it.each(xssPayloads as SecurityPayload[])(
      'should reject XSS: "$note"',
      ({ value }: SecurityPayload) => {
        const result = schema.safeParse(value)
        expect(result.success).toBe(false)
      },
    )
  })

  describe(`${name} — injection payloads`, () => {
    const schema = factory() as z.ZodType

    it.each(injectionPayloads as SecurityPayload[])(
      'should reject injection: "$note"',
      ({ value }: SecurityPayload) => {
        const result = schema.safeParse(value)
        expect(result.success).toBe(false)
      },
    )
  })

  describe(`${name} — extra XSS payloads`, () => {
    const schema = factory() as z.ZodType

    it.each(EXTRA_XSS_PAYLOADS)(
      'should reject extra XSS: "$note"',
      ({ value }: SecurityPayload) => {
        const result = schema.safeParse(value)
        expect(result.success).toBe(false)
      },
    )
  })
}

// ----------------------------------------------------------
// PART B — REDOS RESISTANCE
// ----------------------------------------------------------

describe('reDoS resistance', () => {
  for (const { name, factory } of REDOS_RULES) {
    describe(name, () => {
      const schema = factory() as z.ZodType

      it.each(ADVERSARIAL_INPUTS)(
        'completes in < 100ms on adversarial input: %s',
        (input: string, _label: string) => {
          const start = performance.now()
          schema.safeParse(input)
          const elapsed = performance.now() - start

          expect(elapsed).toBeLessThan(REDOS_THRESHOLD_MS)
        },
      )
    })
  }
})
