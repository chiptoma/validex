import type { BaseRuleOptions } from '../../../src/types'
import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { resetConfig, setup } from '../../../src/config'
import { createRule } from '../../../src/core/createRule'
import { registerCustomError } from '../../../src/core/customError'

interface CustomOpts extends BaseRuleOptions {
  maxLength?: number | undefined
  extra?: string | undefined
}

describe('createRule', () => {
  afterEach(() => {
    resetConfig()
  })

  it('should reject reserved namespace "base"', () => {
    expect(() => createRule({
      name: 'base',
      defaults: {},
      build: () => z.string(),
      messages: {},
    })).toThrow('validex')
  })

  it('should reject reserved namespace "string"', () => {
    expect(() => createRule({
      name: 'string',
      defaults: {},
      build: () => z.string(),
      messages: {},
    })).toThrow('validex')
  })

  it('should reject reserved namespace "confirmation"', () => {
    expect(() => createRule({
      name: 'confirmation',
      defaults: {},
      build: () => z.string(),
      messages: {},
    })).toThrow('validex')
  })

  it('should create a working rule factory', () => {
    const TestRule = createRule({
      name: 'testRule',
      defaults: {},
      build: () => z.string().min(2),
      messages: { invalid: '{{label}} is not valid' },
    })
    const schema = TestRule()
    expect(schema).toBeDefined()
  })

  it('should pass built-in validation', () => {
    const TestRule = createRule({
      name: 'testRule2',
      defaults: {},
      build: () => z.string().min(2),
      messages: { invalid: '{{label}} is not valid' },
    })
    const result = (TestRule() as z.ZodType).safeParse('hello')
    expect(result.success).toBe(true)
  })

  it('should convert empty string to undefined via emptyToUndefined', () => {
    const TestRule = createRule({
      name: 'testRule3',
      defaults: { emptyToUndefined: true },
      build: () => z.string().min(1),
      messages: {},
    })
    const result = (TestRule() as z.ZodType).safeParse('')
    expect(result.success).toBe(false)
  })

  it('should preserve empty string when emptyToUndefined is false', () => {
    const TestRule = createRule({
      name: 'testRule4',
      defaults: { emptyToUndefined: false },
      build: () => z.string(),
      messages: {},
    })
    const result = (TestRule() as z.ZodType).safeParse('')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('')
    }
  })

  it('should not run customFn when built-in checks fail', async () => {
    let customFnCalled = false
    const TestRule = createRule({
      name: 'testRule5',
      defaults: {},
      build: () => z.string().min(2),
      messages: {},
    })
    const schema = TestRule({
      customFn: () => {
        customFnCalled = true
        return true
      },
    })
    // Invalid input — customFn should NOT be called
    await (schema as z.ZodType).safeParseAsync('x')
    expect(customFnCalled).toBe(false)
  })

  it('should call customFn for valid input', async () => {
    let customFnCalled = false
    const TestRule = createRule({
      name: 'testRule6',
      defaults: {},
      build: () => z.string().min(2),
      messages: {},
    })
    const schema = TestRule({
      customFn: () => {
        customFnCalled = true
        return true
      },
    })
    await (schema as z.ZodType).safeParseAsync('hello')
    expect(customFnCalled).toBe(true)
  })

  it('should apply three-tier merge: defaults → globals → per-call', () => {
    setup({ rules: { myRule: { maxLength: 50 } } })
    const TestRule = createRule<CustomOpts>({
      name: 'myRule',
      defaults: { maxLength: 100 },
      build: (opts) => {
        const max = opts.maxLength ?? 100
        return z.string().max(max)
      },
      messages: {},
    })
    const schema = TestRule({ maxLength: 10 })
    const result = (schema as z.ZodType).safeParse('a'.repeat(11))
    expect(result.success).toBe(false)
  })

  it('should allow undefined in per-call to remove global setting', () => {
    setup({ rules: { myRule2: { extra: 'global' } } })
    const TestRule = createRule<CustomOpts>({
      name: 'myRule2',
      defaults: { emptyToUndefined: false },
      build: (opts) => {
        if (opts.extra !== undefined) {
          return z.string().min(1)
        }
        return z.string()
      },
      messages: {},
    })
    // Pass undefined to remove the global 'extra' key
    const schema = TestRule({ extra: undefined })
    // Empty string should pass since we removed the min(1) constraint
    const result = (schema as z.ZodType).safeParse('')
    expect(result.success).toBe(true)
  })

  it('should register error messages', () => {
    setup()
    registerCustomError()
    const TestRule = createRule({
      name: 'testMsg',
      defaults: {},
      build: () => z.string().min(1),
      messages: { invalid: '{{label}} is not valid for test' },
    })
    expect(TestRule).toBeDefined()
  })
})

describe('createRule — edge cases', () => {
  afterEach(() => {
    resetConfig()
  })

  it('customFn error omits label when not provided', async () => {
    const TestRule = createRule<BaseRuleOptions & { customFn?: (v: string) => true | string | Promise<true | string> }>({
      name: 'testNoLabel',
      defaults: { emptyToUndefined: false },
      build: () => z.string().min(1),
      messages: {},
    })
    const schema = TestRule({ customFn: () => 'custom error' })
    const result = await (schema as z.ZodType).safeParseAsync('hello')
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues[0]
      // SAFETY: validex issues always carry params
      const params = (issue as unknown as Record<string, unknown>)['params'] as Record<string, unknown> | undefined
      expect(params).toBeDefined()
      expect(params?.['label']).toBeUndefined()
      expect(params?.['namespace']).toBe('testNoLabel')
    }
  })

  it('customFn error includes label when provided', async () => {
    const TestRule = createRule<BaseRuleOptions & { customFn?: (v: string) => true | string | Promise<true | string> }>({
      name: 'testWithLabel',
      defaults: { emptyToUndefined: false },
      build: () => z.string().min(1),
      messages: {},
    })
    const schema = TestRule({ customFn: () => 'custom error', label: 'My Field' })
    const result = await (schema as z.ZodType).safeParseAsync('hello')
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues[0]
      // SAFETY: validex issues always carry params
      const params = (issue as unknown as Record<string, unknown>)['params'] as Record<string, unknown> | undefined
      expect(params?.['label']).toBe('My Field')
    }
  })
})
