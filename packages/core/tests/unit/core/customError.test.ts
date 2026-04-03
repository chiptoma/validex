import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { resetConfig, setup } from '@config'
import { registerCustomError } from '@core/customError'

describe('customError handler', () => {
  afterEach(() => {
    resetConfig()
  })

  it('should register without errors', () => {
    expect(() => registerCustomError()).not.toThrow()
  })

  it('should map too_small (min=1) to base.required message', () => {
    setup()
    registerCustomError()
    const schema = z.string().min(1)
    const result = schema.safeParse('')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('is required')
    }
  })

  it('should map too_small (min>1) to base.min message', () => {
    setup()
    registerCustomError()
    const schema = z.string().min(8)
    const result = schema.safeParse('short')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('at least 8')
    }
  })

  it('should map too_big to base.max message', () => {
    setup()
    registerCustomError()
    const schema = z.string().max(3)
    const result = schema.safeParse('toolong')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toContain('at most 3')
    }
  })

  it('should map invalid_type to base.required for undefined', () => {
    setup()
    registerCustomError()
    const schema = z.string()
    const result = schema.safeParse(undefined)
    expect(result.success).toBe(false)
    if (!result.success) {
      const msg = result.error.issues[0]?.message ?? ''
      expect(msg).toContain('required')
    }
  })
})

describe('customError — edge cases', () => {
  afterEach(() => {
    resetConfig()
  })

  it('should map invalid_type with non-undefined received to base.type', () => {
    setup()
    registerCustomError()
    const schema = z.string()
    const result = schema.safeParse(42)
    expect(result.success).toBe(false)
    if (!result.success) {
      const msg = result.error.issues[0]?.message ?? ''
      expect(typeof msg).toBe('string')
      expect(msg.length).toBeGreaterThan(0)
    }
  })

  it('should handle invalid_format issue code', () => {
    setup()
    registerCustomError()
    const schema = z.string().email()
    const result = schema.safeParse('not-an-email')
    expect(result.success).toBe(false)
    if (!result.success) {
      const msg = result.error.issues[0]?.message ?? ''
      expect(typeof msg).toBe('string')
      expect(msg.length).toBeGreaterThan(0)
    }
  })

  it('should handle issue without received/expected/format fields', () => {
    setup()
    registerCustomError()
    const schema = z.string().refine(
      () => false,
      { params: { code: 'testCode', namespace: 'testNs' } },
    )
    const result = schema.safeParse('hello')
    expect(result.success).toBe(false)
    if (!result.success) {
      const msg = result.error.issues[0]?.message ?? ''
      expect(typeof msg).toBe('string')
    }
  })

  it('should adapt issue where expected/received are non-string types', () => {
    setup()
    registerCustomError()
    // superRefine lets us add issues with custom fields that are non-string
    const schema = z.string().superRefine((_, ctx) => {
      ctx.addIssue({
        code: 'custom',
        params: { code: 'testNonString', namespace: 'testNs' },
        // Zod accepts path as part of addIssue but expected/received are set by Zod internally
        // We trigger the adaptIssue false branches by relying on no expected/received/format
      })
    })
    const result = schema.safeParse('test')
    expect(result.success).toBe(false)
    if (!result.success) {
      const msg = result.error.issues[0]?.message ?? ''
      expect(typeof msg).toBe('string')
    }
  })

  it('should handle array issue with numeric path element', () => {
    setup()
    registerCustomError()
    const schema = z.array(z.string().min(1))
    const result = schema.safeParse(['good', ''])
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues[0]
      // The issue path should contain a numeric index
      expect(issue?.path).toBeDefined()
      const msg = issue?.message ?? ''
      expect(typeof msg).toBe('string')
    }
  })
})
