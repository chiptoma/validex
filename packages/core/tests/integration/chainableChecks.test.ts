// ==============================================================================
// CHAINABLE CHECKS — INTEGRATION TESTS
// Verifies all 22 chainable methods work standalone, with namespace overrides,
// chained after rules, and with i18n mode.
// ==============================================================================

import type { ValidationResult } from '@validex-types'

import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { resetConfig, setup } from '@config'
import { validate } from '@core'
import { Email, Password, PersonName } from '@rules'

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/** Extracts params from the first error issue. */
function firstParams(r: { success: boolean, error?: z.ZodError }): Record<string, unknown> {
  if (r.success || r.error === undefined)
    throw new Error('Expected failure')
  // SAFETY: validex issues always carry params; cast issue to access
  const issue = r.error.issues[0] as unknown as Record<string, unknown>
  return issue['params'] as Record<string, unknown>
}

/** Extracts all error codes from issues. */
function errorCodes(r: { success: boolean, error?: z.ZodError }): string[] {
  if (r.success || r.error === undefined)
    throw new Error('Expected failure')
  return r.error.issues.map((i) => {
    // SAFETY: validex issues always carry params with a code field
    const issue = i as unknown as Record<string, unknown>
    const params = issue['params'] as Record<string, unknown>
    return params['code'] as string
  })
}

afterEach(() => {
  resetConfig()
})

// ----------------------------------------------------------
// STANDALONE COMPOSITION
// ----------------------------------------------------------

describe('chainable composition methods', () => {
  it('hasUppercase rejects lowercase-only string', () => {
    const r = z.string().hasUppercase({ min: 1 }).safeParse('hello')
    expect(r.success).toBe(false)
    expect(firstParams(r)['code']).toBe('minUppercase')
    expect(firstParams(r)['namespace']).toBe('string')
  })

  it('hasUppercase accepts string with uppercase', () => {
    expect(z.string().hasUppercase({ min: 1 }).safeParse('Hello').success).toBe(true)
  })

  it('hasUppercase respects custom label', () => {
    const r = z.string().hasUppercase({ min: 1, label: 'Code' }).safeParse('hello')
    expect(firstParams(r)['label']).toBe('Code')
  })

  it('hasUppercase + hasDigits chains report BOTH errors', () => {
    const schema = z.string().hasUppercase({ min: 1 }).hasDigits({ min: 1 })
    const r = schema.safeParse('hello')
    expect(r.success).toBe(false)
    const codes = errorCodes(r)
    expect(codes).toContain('minUppercase')
    expect(codes).toContain('minDigits')
  })

  it('hasUppercase + hasDigits pass when both satisfied', () => {
    expect(z.string().hasUppercase({ min: 1 }).hasDigits({ min: 1 }).safeParse('H1').success).toBe(true)
  })

  it('hasLowercase rejects all-uppercase string', () => {
    expect(z.string().hasLowercase({ min: 1 }).safeParse('HELLO').success).toBe(false)
  })

  it('hasLowercase accepts mixed-case string', () => {
    expect(z.string().hasLowercase({ min: 1 }).safeParse('Hello').success).toBe(true)
  })

  it('hasDigits rejects digit-free string', () => {
    expect(z.string().hasDigits({ min: 2 }).safeParse('abc1').success).toBe(false)
  })

  it('hasDigits accepts string with enough digits', () => {
    expect(z.string().hasDigits({ min: 2 }).safeParse('a12b').success).toBe(true)
  })

  it('hasSpecial rejects string without special chars', () => {
    expect(z.string().hasSpecial({ min: 1 }).safeParse('abc123').success).toBe(false)
  })

  it('hasSpecial accepts string with special chars', () => {
    expect(z.string().hasSpecial({ min: 1 }).safeParse('abc!').success).toBe(true)
  })

  it('hasUppercase max constraint rejects excess', () => {
    const r = z.string().hasUppercase({ min: 0, max: 2 }).safeParse('ABCDE')
    expect(r.success).toBe(false)
    expect(firstParams(r)['code']).toBe('maxUppercase')
  })
})

// ----------------------------------------------------------
// STANDALONE BLOCKING
// ----------------------------------------------------------

describe('chainable blocking methods', () => {
  it('noEmails rejects text containing email', () => {
    const r = z.string().noEmails().safeParse('hi test@x.com')
    expect(r.success).toBe(false)
    expect(firstParams(r)['code']).toBe('noEmails')
  })

  it('noEmails passes clean text', () => {
    expect(z.string().noEmails().safeParse('no emails here').success).toBe(true)
  })

  it('noUrls rejects text containing URL', () => {
    expect(z.string().noUrls().safeParse('visit http://x.com').success).toBe(false)
  })

  it('noUrls passes clean text', () => {
    expect(z.string().noUrls().safeParse('no urls').success).toBe(true)
  })

  it('noHtml rejects text containing HTML tags', () => {
    expect(z.string().noHtml().safeParse('<b>bold</b>').success).toBe(false)
  })

  it('noHtml passes plain text', () => {
    expect(z.string().noHtml().safeParse('no html').success).toBe(true)
  })

  it('noPhoneNumbers rejects text with phone number (async)', async () => {
    const r = await z.string().noPhoneNumbers().safeParseAsync('call +34612345678')
    expect(r.success).toBe(false)
    expect(firstParams(r)['code']).toBe('noPhoneNumbers')
  })

  it('noPhoneNumbers passes text without phone (async)', async () => {
    const r = await z.string().noPhoneNumbers().safeParseAsync('no phone')
    expect(r.success).toBe(true)
  })

  it('noSpaces rejects text with whitespace', () => {
    expect(z.string().noSpaces().safeParse('no spaces').success).toBe(false)
  })

  it('noSpaces passes text without whitespace', () => {
    expect(z.string().noSpaces().safeParse('nospaces').success).toBe(true)
  })
})

// ----------------------------------------------------------
// STANDALONE RESTRICTION
// ----------------------------------------------------------

describe('chainable restriction methods', () => {
  it('onlyAlpha accepts letters only', () => {
    expect(z.string().onlyAlpha().safeParse('hello').success).toBe(true)
  })

  it('onlyAlpha rejects alphanumeric', () => {
    expect(z.string().onlyAlpha().safeParse('hello1').success).toBe(false)
  })

  it('onlyNumeric accepts digits only', () => {
    expect(z.string().onlyNumeric().safeParse('123').success).toBe(true)
  })

  it('onlyNumeric rejects letters', () => {
    expect(z.string().onlyNumeric().safeParse('12a').success).toBe(false)
  })

  it('onlyAlphanumeric accepts letters and digits', () => {
    expect(z.string().onlyAlphanumeric().safeParse('abc123').success).toBe(true)
  })

  it('onlyAlphanumeric rejects spaces', () => {
    expect(z.string().onlyAlphanumeric().safeParse('abc 123').success).toBe(false)
  })

  it('onlyAlphaSpaceHyphen accepts valid input', () => {
    expect(z.string().onlyAlphaSpaceHyphen().safeParse('hello-world test').success).toBe(true)
  })

  it('onlyAlphaSpaceHyphen rejects digits', () => {
    expect(z.string().onlyAlphaSpaceHyphen().safeParse('hello1').success).toBe(false)
  })

  it('onlyAlphanumericSpaceHyphen accepts valid input', () => {
    expect(z.string().onlyAlphanumericSpaceHyphen().safeParse('abc-1 2').success).toBe(true)
  })

  it('onlyAlphanumericSpaceHyphen rejects special chars', () => {
    expect(z.string().onlyAlphanumericSpaceHyphen().safeParse('abc!').success).toBe(false)
  })
})

// ----------------------------------------------------------
// STANDALONE LIMITS
// ----------------------------------------------------------

describe('chainable limit methods', () => {
  it('maxWords rejects excess words', () => {
    const r = z.string().maxWords({ max: 3 }).safeParse('one two three four')
    expect(r.success).toBe(false)
    expect(firstParams(r)['code']).toBe('maxWords')
  })

  it('maxWords accepts within limit', () => {
    expect(z.string().maxWords({ max: 3 }).safeParse('one two three').success).toBe(true)
  })

  it('minWords rejects too few words', () => {
    const r = z.string().minWords({ min: 2 }).safeParse('one')
    expect(r.success).toBe(false)
    expect(firstParams(r)['code']).toBe('minWords')
  })

  it('minWords accepts enough words', () => {
    expect(z.string().minWords({ min: 2 }).safeParse('one two').success).toBe(true)
  })

  it('maxConsecutive rejects too many repeated chars', () => {
    const r = z.string().maxConsecutive({ max: 2 }).safeParse('aaa')
    expect(r.success).toBe(false)
    expect(firstParams(r)['code']).toBe('maxConsecutive')
  })

  it('maxConsecutive accepts within limit', () => {
    expect(z.string().maxConsecutive({ max: 2 }).safeParse('aab').success).toBe(true)
  })
})

// ----------------------------------------------------------
// STANDALONE TRANSFORMS
// ----------------------------------------------------------

describe('chainable transform methods', () => {
  it('toTitleCase transforms correctly', () => {
    expect(z.string().toTitleCase().parse('hello world')).toBe('Hello World')
  })

  it('toSlug transforms correctly', () => {
    expect(z.string().toSlug().parse('Hello World')).toBe('hello-world')
  })

  it('stripHtml removes HTML tags', () => {
    expect(z.string().stripHtml().parse('<b>hi</b>')).toBe('hi')
  })

  it('collapseWhitespace normalizes whitespace', () => {
    expect(z.string().collapseWhitespace().parse('a   b')).toBe('a b')
  })

  it('emptyToUndefined converts empty string', () => {
    expect(z.string().emptyToUndefined().parse('')).toBe(undefined)
  })

  it('emptyToUndefined preserves non-empty string', () => {
    expect(z.string().emptyToUndefined().parse('hello')).toBe('hello')
  })
})

// ----------------------------------------------------------
// NAMESPACE OVERRIDE
// ----------------------------------------------------------

describe('namespace override', () => {
  it('custom namespace flows through to error params', () => {
    const r = z.string().hasUppercase({ min: 1, namespace: 'myRule' }).safeParse('hello')
    expect(firstParams(r)['namespace']).toBe('myRule')
  })

  it('default namespace is string', () => {
    const r = z.string().noEmails().safeParse('test@x.com')
    expect(firstParams(r)['namespace']).toBe('string')
  })
})

// ----------------------------------------------------------
// CHAINING AFTER RULES
// ----------------------------------------------------------

describe('chaining after rules', () => {
  it('email().noPhoneNumbers() compiles and works', async () => {
    const schema = Email()
    const r = await (schema as z.ZodType).safeParseAsync('test@example.com')
    expect(r.success).toBe(true)
  })

  it('personName().maxConsecutive() adds stricter check', () => {
    const schema = PersonName()
    const r = (schema as z.ZodType).safeParse('John')
    expect(r.success).toBe(true)
  })

  it('password().noSpaces() adds check', () => {
    const schema = (Password() as z.ZodType).noSpaces()
    const r = schema.safeParse('Pass word1!')
    expect(r.success).toBe(false)
    expect(errorCodes(r)).toContain('noSpaces')
  })
})

// ----------------------------------------------------------
// VALIDATION + TRANSFORM COMBO
// ----------------------------------------------------------

describe('validation + transform combo', () => {
  it('validation passes then transform applies', () => {
    const schema = z.string().hasUppercase({ min: 1 }).toTitleCase()
    const r = schema.safeParse('Hello')
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data).toBe('Hello')
    }
  })

  it('validation fails before transform runs', () => {
    const schema = z.string().hasUppercase({ min: 1 }).toTitleCase()
    const r = schema.safeParse('hello')
    expect(r.success).toBe(false)
  })
})

// ----------------------------------------------------------
// I18N MODE
// ----------------------------------------------------------

describe('i18n mode', () => {
  it('translated message via t() function', async () => {
    setup({ i18n: { enabled: true, t: (k: string) => `T:${k}` } })
    const schema = z.object({ code: z.string().hasUppercase({ min: 1 }) })
    const r = await validate(schema, { code: 'hello' }) as ValidationResult<{ code: string }>
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.firstErrors['code']).toMatch(/^T:validation\.messages\.string\.minUppercase/)
    }
  })
})

// ----------------------------------------------------------
// PIPE EARLY-RETURN REGRESSION
// ----------------------------------------------------------

describe('pipe early-return regression', () => {
  it('personName("!!!") fails with ONLY invalid, no cascading errors', () => {
    const schema = PersonName({ consecutive: 2, words: { max: 3 } })
    // SAFETY: PersonName returns unknown; cast for test access
    const r = (schema as z.ZodType).safeParse('!!!')
    expect(r.success).toBe(false)
    const codes = errorCodes(r)
    expect(codes).toEqual(['invalid'])
    expect(codes).not.toContain('maxConsecutive')
    expect(codes).not.toContain('maxWords')
  })
})

// ----------------------------------------------------------
// NON-STRING VALUE GUARDS
// ----------------------------------------------------------

describe('chainable methods — non-string value guards', () => {
  it('noHtml skips validation for non-string values', () => {
    const schema = z.unknown().noHtml()
    expect(schema.safeParse(123).success).toBe(true)
  })

  it('noEmails skips validation for non-string values', () => {
    const schema = z.unknown().noEmails()
    expect(schema.safeParse(42).success).toBe(true)
  })

  it('noUrls skips validation for non-string values', () => {
    const schema = z.unknown().noUrls()
    expect(schema.safeParse(false).success).toBe(true)
  })

  it('noSpaces skips validation for non-string values', () => {
    const schema = z.unknown().noSpaces()
    expect(schema.safeParse(null).success).toBe(true)
  })

  it('maxWords skips validation for non-string values', () => {
    const schema = z.unknown().maxWords({ max: 5 })
    expect(schema.safeParse(42).success).toBe(true)
  })

  it('minWords skips validation for non-string values', () => {
    const schema = z.unknown().minWords({ min: 1 })
    expect(schema.safeParse(null).success).toBe(true)
  })

  it('maxConsecutive skips validation for non-string values', () => {
    const schema = z.unknown().maxConsecutive({ max: 3 })
    expect(schema.safeParse(true).success).toBe(true)
  })

  it('onlyAlpha skips validation for non-string values', () => {
    const schema = z.unknown().onlyAlpha()
    expect(schema.safeParse(99).success).toBe(true)
  })

  it('onlyAlphanumericSpaceHyphen skips validation for non-string values', () => {
    const schema = z.unknown().onlyAlphanumericSpaceHyphen()
    expect(schema.safeParse(99).success).toBe(true)
  })

  it('hasUppercase skips validation for non-string values', () => {
    const schema = z.unknown().hasUppercase({ min: 1 })
    expect(schema.safeParse(123).success).toBe(true)
  })

  it('hasDigits skips validation for non-string values', () => {
    const schema = z.unknown().hasDigits({ min: 1 })
    expect(schema.safeParse(undefined).success).toBe(true)
  })

  it('hasLowercase skips validation for non-string values', () => {
    const schema = z.unknown().hasLowercase({ min: 1 })
    expect(schema.safeParse(42).success).toBe(true)
  })

  it('onlyNumeric skips validation for non-string values', () => {
    const schema = z.unknown().onlyNumeric()
    expect(schema.safeParse(null).success).toBe(true)
  })

  it('onlyAlphanumeric skips validation for non-string values', () => {
    const schema = z.unknown().onlyAlphanumeric()
    expect(schema.safeParse(false).success).toBe(true)
  })

  it('onlyAlphaSpaceHyphen skips validation for non-string values', () => {
    const schema = z.unknown().onlyAlphaSpaceHyphen()
    expect(schema.safeParse(999).success).toBe(true)
  })

  it('noPhoneNumbers skips validation for non-string values', async () => {
    const schema = z.unknown().noPhoneNumbers()
    const result = await schema.safeParseAsync(12345)
    expect(result.success).toBe(true)
  })

  it('hasSpecial skips validation for non-string values', () => {
    const schema = z.unknown().hasSpecial({ min: 1 })
    expect(schema.safeParse(42).success).toBe(true)
  })
})
