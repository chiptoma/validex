// ==============================================================================
// README EXAMPLES — VERIFICATION TESTS
// Ensures every code example in README.md uses the real validex API.
// ==============================================================================

import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  createRule,
  Email,
  getParams,
  Password,
  setup,
  Text,
  validate,
} from '../../src'
import { resetConfig } from '../../src/config/store'
import { registerCustomError } from '../../src/core/customError'

// ----------------------------------------------------------
// QUICK START EXAMPLES
// ----------------------------------------------------------

describe('rEADME — Quick Start', () => {
  it('single rule: Email().parse() accepts valid email', () => {
    const schema = Email() as z.ZodType
    expect(schema.safeParse('hello@example.com').success).toBe(true)
  })

  it('single rule: Email().parse() rejects invalid email', () => {
    const schema = Email() as z.ZodType
    expect(schema.safeParse('not-an-email').success).toBe(false)
  })

  it('rule with options: Password with length and uppercase', () => {
    const schema = Password({
      length: { min: 10 },
      uppercase: { min: 2 },
    }) as z.ZodType

    // 10 chars, 2 uppercase, 1 digit, 1 special
    expect(schema.safeParse('ABcdefgh1!').success).toBe(true)
    // Too short
    expect(schema.safeParse('ABcd1!').success).toBe(false)
    // Only 1 uppercase
    expect(schema.safeParse('Abcdefgh1!').success).toBe(false)
  })

  it('composed schema with validate()', async () => {
    const schema = z.object({
      email: Email() as z.ZodType,
      password: Password() as z.ZodType,
    })

    const success = await validate(schema, {
      email: 'user@example.com',
      password: 'Str0ng!Pass',
    })

    expect(success.success).toBe(true)
    expect(success.data).toEqual({
      email: 'user@example.com',
      password: 'Str0ng!Pass',
    })
  })

  it('composed schema with validate() returns structured errors', async () => {
    const schema = z.object({
      email: Email() as z.ZodType,
      password: Password() as z.ZodType,
    })

    const failure = await validate(schema, {
      email: 'bad',
      password: 'weak',
    })

    expect(failure.success).toBe(false)
    expect(failure.errors).toBeDefined()
    expect(failure.firstErrors).toBeDefined()
    expect(failure.nestedErrors).toBeDefined()
    expect(failure.issues.length).toBeGreaterThan(0)
  })
})

// ----------------------------------------------------------
// CONFIGURATION EXAMPLES
// ----------------------------------------------------------

describe('rEADME — Configuration', () => {
  it('setup() applies rule defaults via namespace keys', async () => {
    resetConfig()
    setup({
      rules: {
        email: { blockPlusAlias: true },
        password: { length: { min: 10 } },
      },
    })

    const emailSchema = Email() as z.ZodType
    // Plus alias should be blocked by global config
    expect(emailSchema.safeParse('user+tag@example.com').success).toBe(false)

    const passwordSchema = Password() as z.ZodType
    // 8 chars should fail because global sets min: 10
    const shortResult = await passwordSchema.safeParseAsync('Abcdef1!')
    expect(shortResult.success).toBe(false)

    // 10 chars should pass
    const longResult = await passwordSchema.safeParseAsync('Abcdefgh1!')
    expect(longResult.success).toBe(true)

    resetConfig()
  })

  it('per-call options override setup() defaults', async () => {
    resetConfig()
    setup({
      rules: {
        email: { blockPlusAlias: true },
      },
    })

    // Per-call override re-enables plus aliases
    const schema = Email({ blockPlusAlias: false }) as z.ZodType
    const result = await schema.safeParseAsync('user+tag@example.com')
    expect(result.success).toBe(true)

    resetConfig()
  })
})

// ----------------------------------------------------------
// I18N EXAMPLES
// ----------------------------------------------------------

describe('rEADME — i18n', () => {
  it('key format is validation.messages.{namespace}.{code}', () => {
    const params = getParams({
      code: 'custom',
      path: ['email'],
      params: { code: 'invalid', namespace: 'email' },
    })

    expect(params.key).toBe('validation.messages.email.invalid')
    expect(params.namespace).toBe('email')
    expect(params.code).toBe('invalid')
  })

  it('getParams extracts structured metadata from issues', () => {
    const params = getParams({
      code: 'custom',
      path: ['username'],
      params: { code: 'reserved', namespace: 'username', label: 'Username' },
    })

    expect(params.key).toBe('validation.messages.username.reserved')
    expect(params.label).toBe('Username')
    expect(params.path).toEqual(['username'])
  })

  // I18N.md — Custom t() function example (exact code from docs)
  it('i18n.md custom t() example produces translated output', async () => {
    resetConfig()

    // Simulate a translated locale (same structure as CLI scaffold output)
    const fr = {
      validation: {
        labels: {
          email: 'Courriel',
        },
        messages: {
          email: {
            invalid: '{{label}} n\'est pas un courriel valide',
          },
          base: {
            required: '{{label}} est requis',
          },
        },
      },
    }

    // --- Exact code from I18N.md "Custom t() function" ---
    const translations: Record<string, string> = {}

    const labels = fr.validation.labels
    for (const [field, label] of Object.entries(labels)) {
      translations[`validation.labels.${field}`] = label
    }

    const messages = fr.validation.messages
    for (const [ns, codes] of Object.entries(messages)) {
      for (const [code, msg] of Object.entries(codes)) {
        translations[`validation.messages.${ns}.${code}`] = msg
      }
    }

    setup({
      i18n: {
        enabled: true,
        t: (key, params) => {
          let msg = translations[key] ?? key
          for (const [k, v] of Object.entries(params ?? {})) {
            msg = msg.replaceAll(`{{${k}}}`, String(v))
          }
          return msg
        },
      },
    })
    // --- End exact code from I18N.md ---

    registerCustomError()

    const schema = z.object({ email: Email() as z.ZodType })
    const result = await validate(schema, { email: 'bad' })

    expect(result.success).toBe(false)
    const emailErrors = result.errors['email'] ?? []
    expect(emailErrors.length).toBeGreaterThan(0)
    // The translated label + translated message should appear
    expect(emailErrors).toContainEqual('Courriel n\'est pas un courriel valide')

    resetConfig()
  })

  // API.md — setup() example with i18n, label.transform, message.transform
  it('api.md setup example with t(), label.transform, and message.transform works', async () => {
    resetConfig()

    // Mock i18next.t — same contract as the doc example
    const mockTranslations: Record<string, string> = {
      'validation.labels.email': 'Email',
      'validation.messages.email.invalid': '{{label}} is not a valid email address',
    }
    const i18next = {
      t: (key: string, params?: Record<string, unknown>): string => {
        let msg = mockTranslations[key] ?? key
        if (params !== undefined) {
          for (const [k, v] of Object.entries(params)) {
            msg = msg.replaceAll(`{{${k}}}`, String(v))
          }
        }
        return msg
      },
    }

    // --- Exact code from API.md setup() example ---
    setup({
      rules: {
        email: { blockDisposable: true },
        password: { length: { min: 10 }, special: { min: 2 } },
      },
      i18n: {
        enabled: true,
        t: (key, params) => i18next.t(key, params),
      },
      label: {
        fallback: 'derived',
        transform: ({ defaultLabel }) => defaultLabel,
      },
      message: {
        transform: ({ code, message }) => `[${code}] ${message}`,
      },
    })
    // --- End exact code from API.md ---

    registerCustomError()

    const schema = z.object({ email: Email() as z.ZodType })
    const result = await validate(schema, { email: 'bad' })

    expect(result.success).toBe(false)
    const emailErrors = result.errors['email'] ?? []
    expect(emailErrors.length).toBeGreaterThan(0)
    // message.transform wraps with [code], t() translates, label.transform runs
    const hasWrapped = emailErrors.some(
      (e: string) => e.startsWith('[') && e.includes(']'),
    )
    expect(hasWrapped).toBe(true)

    resetConfig()
  })
})

// ----------------------------------------------------------
// CUSTOM RULE EXAMPLES
// ----------------------------------------------------------

describe('rEADME — Custom rules', () => {
  it('createRule() builds a working validation rule', () => {
    interface HexColorOptions {
      label?: string
      emptyToUndefined?: boolean
      normalize?: boolean
      customFn?: (value: string) => true | string | Promise<true | string>
      allowAlpha?: boolean
    }

    const HexColor = createRule<HexColorOptions>({
      name: 'hexColor',
      defaults: { allowAlpha: false },
      build: (opts) => {
        const pattern = opts.allowAlpha
          ? /^#[\da-f]{6,8}$/i
          : /^#[\da-f]{6}$/i
        return z.string().regex(pattern)
      },
      messages: {
        invalid: '{{label}} is not a valid hex color',
      },
    })

    const schema = HexColor({ allowAlpha: true }) as z.ZodType
    expect(schema.safeParse('#ff00aacc').success).toBe(true)
    expect(schema.safeParse('#ff00aa').success).toBe(true)
    expect(schema.safeParse('not-a-color').success).toBe(false)

    const strictSchema = HexColor() as z.ZodType
    expect(strictSchema.safeParse('#ff00aa').success).toBe(true)
    expect(strictSchema.safeParse('#ff00aacc').success).toBe(false)
  })
})

// ----------------------------------------------------------
// CUSTOM VALIDATION EXAMPLES
// ----------------------------------------------------------

describe('rEADME — Custom validation', () => {
  it('customFn returns true to pass, string to fail', async () => {
    const schema = Email({
      customFn: value => value.endsWith('.org') || 'Must be a .org domain',
    }) as z.ZodType

    const pass = await schema.safeParseAsync('info@example.org')
    expect(pass.success).toBe(true)

    const fail = await schema.safeParseAsync('info@example.com')
    expect(fail.success).toBe(false)
  })

  it('regex override on Text rule accepts RegExp', () => {
    const schema = Text({
      regex: /^[^<>]+$/,
    }) as z.ZodType

    expect(schema.safeParse('Hello world').success).toBe(true)
    expect(schema.safeParse('<script>alert(1)</script>').success).toBe(false)
  })
})

// ----------------------------------------------------------
// VALIDATE() RESULT SHAPE
// ----------------------------------------------------------

describe('rEADME — ValidationResult shape', () => {
  it('success result has data and empty error collections', async () => {
    const schema = z.object({
      email: Email() as z.ZodType,
    })

    const result = await validate(schema, { email: 'test@example.com' })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({ email: 'test@example.com' })
    expect(result.errors).toEqual({})
    expect(result.firstErrors).toEqual({})
    expect(result.nestedErrors).toEqual({})
    expect(result.issues).toEqual([])
  })

  it('failure result has errors, firstErrors, nestedErrors, and issues', async () => {
    const schema = z.object({
      email: Email() as z.ZodType,
      password: Password() as z.ZodType,
    })

    const result = await validate(schema, {
      email: 'invalid',
      password: 'x',
    })

    expect(result.success).toBe(false)
    expect(result.data).toBeUndefined()
    expect(Object.keys(result.errors).length).toBeGreaterThan(0)
    expect(Object.keys(result.firstErrors).length).toBeGreaterThan(0)
    expect(Object.keys(result.nestedErrors).length).toBeGreaterThan(0)
    expect(result.issues.length).toBeGreaterThan(0)
  })
})

// ----------------------------------------------------------
// SUBPATH EXPORTS
// ----------------------------------------------------------

describe('rEADME — Subpath exports', () => {
  it('validex/checks exports work', async () => {
    const {
      hasUppercase,
      hasLowercase,
      hasDigits,
      containsEmail,
      maxConsecutive,
    } = await import('../../src/checks')
    expect(hasUppercase('Hello', 1)).toBe(true)
    expect(hasLowercase('Hello', 1)).toBe(true)
    expect(hasDigits('abc123', 2)).toBe(true)
    expect(containsEmail('email test@example.com here')).toBe(true)
    expect(maxConsecutive('aab', 2)).toBe(true)
    expect(maxConsecutive('aaab', 2)).toBe(false)
  })

  it('validex/utilities exports work', async () => {
    const { sameAs, requiredWhen } = await import('../../src/utilities')
    expect(typeof sameAs).toBe('function')
    expect(typeof requiredWhen).toBe('function')
  })
})
