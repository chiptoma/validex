import { afterEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { resetConfig, setup } from '../../src/config'
import { registerCustomError } from '../../src/core/customError'

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
