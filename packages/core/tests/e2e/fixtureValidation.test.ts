import type { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { BusinessName } from '../../src/rules/businessName'
import { PostalCode } from '../../src/rules/postalCode'
import businessInvalid from '../_support/fixtures/businessNames.invalid.json'
import postalInvalid from '../_support/fixtures/postalCodes.invalid.json'

// ----------------------------------------------------------
// POSTAL CODE INVALID FIXTURES
// ----------------------------------------------------------

describe('postalCode — invalid fixture data', () => {
  it.each(postalInvalid)(
    'should reject "$value" for $country ($note)',
    async ({ value, country }) => {
      const schema = PostalCode({ country }) as z.ZodType
      const result = await schema.safeParseAsync(value)
      expect(result.success).toBe(false)
    },
  )
})

// ----------------------------------------------------------
// BUSINESS NAME INVALID FIXTURES
// ----------------------------------------------------------

describe('businessName — invalid fixture data', () => {
  const schema = BusinessName() as z.ZodType

  it.each(businessInvalid)(
    'should reject "$value" ($note)',
    ({ value }) => {
      const result = schema.safeParse(value)
      expect(result.success).toBe(false)
    },
  )
})
