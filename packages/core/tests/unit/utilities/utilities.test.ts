import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { requiredWhen, sameAs } from '../../../src/utilities'

// ----------------------------------------------------------
// sameAs
// ----------------------------------------------------------

describe('sameAs', () => {
  const schema = z.object({
    password: z.string(),
    confirmPassword: z.string(),
  }).superRefine(sameAs('confirmPassword', 'password'))

  it('should pass when both fields match', () => {
    const result = schema.safeParse({
      password: 'Secret123!',
      confirmPassword: 'Secret123!',
    })
    expect(result.success).toBe(true)
  })

  it('should fail when fields do not match', () => {
    const result = schema.safeParse({
      password: 'Secret123!',
      confirmPassword: 'Different456!',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues[0]
      expect(issue?.path).toEqual(['confirmPassword'])
      expect(issue?.message).toBe(
        'confirmPassword must match password',
      )
    }
  })

  it('should use a custom error message when provided', () => {
    const customSchema = z.object({
      password: z.string(),
      confirmPassword: z.string(),
    }).superRefine(
      sameAs('confirmPassword', 'password', {
        message: 'Passwords do not match',
      }),
    )

    const result = customSchema.safeParse({
      password: 'abc',
      confirmPassword: 'xyz',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Passwords do not match',
      )
    }
  })

  it('should pass when both fields are empty strings', () => {
    const result = schema.safeParse({
      password: '',
      confirmPassword: '',
    })
    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// requiredWhen
// ----------------------------------------------------------

describe('requiredWhen', () => {
  const schema = z.object({
    subscribe: z.boolean(),
    email: z.string().optional(),
  }).superRefine(
    requiredWhen(
      'email',
      data => data['subscribe'] === true,
    ),
  )

  it('should fail when condition is true and field is empty', () => {
    const result = schema.safeParse({
      subscribe: true,
      email: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const issue = result.error.issues[0]
      expect(issue?.path).toEqual(['email'])
      expect(issue?.message).toBe('email is required')
    }
  })

  it('should fail when condition is true and field is undefined', () => {
    const result = schema.safeParse({
      subscribe: true,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['email'])
    }
  })

  it('should pass when condition is true and field is present', () => {
    const result = schema.safeParse({
      subscribe: true,
      email: 'user@example.com',
    })
    expect(result.success).toBe(true)
  })

  it('should pass when condition is false and field is empty', () => {
    const result = schema.safeParse({
      subscribe: false,
      email: '',
    })
    expect(result.success).toBe(true)
  })

  it('should pass when condition is false and field is absent', () => {
    const result = schema.safeParse({
      subscribe: false,
    })
    expect(result.success).toBe(true)
  })

  it('should use a custom error message when provided', () => {
    const customSchema = z.object({
      wantNewsletter: z.boolean(),
      email: z.string().optional(),
    }).superRefine(
      requiredWhen(
        'email',
        data => data['wantNewsletter'] === true,
        { message: 'Please provide an email to subscribe' },
      ),
    )

    const result = customSchema.safeParse({
      wantNewsletter: true,
      email: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe(
        'Please provide an email to subscribe',
      )
    }
  })

  it('should fail when condition is true and field is null', () => {
    const nullableSchema = z.object({
      active: z.boolean(),
      reason: z.string().nullable().optional(),
    }).superRefine(
      requiredWhen(
        'reason',
        data => data['active'] === false,
      ),
    )

    const result = nullableSchema.safeParse({
      active: false,
      reason: null,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['reason'])
    }
  })
})
