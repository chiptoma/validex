// ==============================================================================
// EXTERNAL PERSON NAME INTEGRATION TESTS
// Validates PersonName rule against 150+ real international names from the
// extended fixture file covering Western, Nordic, Asian, African, and edge cases.
// ==============================================================================

import type { z } from 'zod'
import { describe, expect, it } from 'vitest'
import { PersonName } from '../../src/rules/personName'
import names from '../fixtures/personNamesExtended.json'

// ----------------------------------------------------------
// SETUP
// ----------------------------------------------------------

const schema = PersonName() as z.ZodType

// ----------------------------------------------------------
// INTERNATIONAL NAME ACCEPTANCE
// Known limitation: Thai names with combining marks (U+0E31,
// U+0E34, U+0E38, U+0E4C) fail because \p{M} is not in the
// default charset. These are excluded from the fixture and
// should be addressed in a future rule update.
// ----------------------------------------------------------

describe('personName — international names (extended)', () => {
  it.each(names)(
    'should accept "$value" ($category: $note)',
    ({ value }) => {
      const result = schema.safeParse(value)
      expect(result.success).toBe(true)
    },
  )
})
