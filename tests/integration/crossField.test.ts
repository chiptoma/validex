// ==============================================================================
// CROSS-FIELD VALIDATION INTEGRATION TESTS
// Validates sameAs and requiredWhen utilities in realistic schemas.
// ==============================================================================

import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { validate } from '../../src/core/validate'
import { requiredWhen } from '../../src/utilities/requiredWhen'
import { sameAs } from '../../src/utilities/sameAs'

// ----------------------------------------------------------
// SAME-AS
// ----------------------------------------------------------

describe('sameAs cross-field validation', () => {
  const registrationSchema = z.object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  }).superRefine(sameAs('confirmPassword', 'password'))

  it('passes when passwords match', async () => {
    const result = await validate(registrationSchema, {
      password: 'MyStr0ng!Pass',
      confirmPassword: 'MyStr0ng!Pass',
    })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      password: 'MyStr0ng!Pass',
      confirmPassword: 'MyStr0ng!Pass',
    })
  })

  it('fails when passwords do not match with error on confirmPassword', async () => {
    const result = await validate(registrationSchema, {
      password: 'MyStr0ng!Pass',
      confirmPassword: 'different',
    })

    expect(result.success).toBe(false)
    expect(result.errors['confirmPassword']).toBeDefined()
    expect(result.firstErrors['confirmPassword']).toContain(
      'confirmPassword must match password',
    )
  })

  it('supports custom error messages', async () => {
    const schema = z.object({
      password: z.string().min(8),
      confirmPassword: z.string(),
    }).superRefine(sameAs('confirmPassword', 'password', {
      message: 'Passwords do not match',
    }))

    const result = await validate(schema, {
      password: 'MyStr0ng!Pass',
      confirmPassword: 'wrong',
    })

    expect(result.success).toBe(false)
    expect(result.firstErrors['confirmPassword']).toBe(
      'Passwords do not match',
    )
  })
})

// ----------------------------------------------------------
// REQUIRED-WHEN
// ----------------------------------------------------------

describe('requiredWhen cross-field validation', () => {
  const settingsSchema = z.object({
    changePassword: z.boolean(),
    newPassword: z.string().optional(),
  }).superRefine(requiredWhen(
    'newPassword',
    data => data['changePassword'] === true,
  ))

  it('passes when condition is true and field is present', async () => {
    const result = await validate(settingsSchema, {
      changePassword: true,
      newPassword: 'newSecure123',
    })

    expect(result.success).toBe(true)
    expect(result.data).toEqual({
      changePassword: true,
      newPassword: 'newSecure123',
    })
  })

  it('fails when condition is true and field is missing', async () => {
    const result = await validate(settingsSchema, {
      changePassword: true,
    })

    expect(result.success).toBe(false)
    expect(result.errors['newPassword']).toBeDefined()
    expect(result.firstErrors['newPassword']).toBe('newPassword is required')
  })

  it('fails when condition is true and field is empty string', async () => {
    const result = await validate(settingsSchema, {
      changePassword: true,
      newPassword: '',
    })

    expect(result.success).toBe(false)
    expect(result.errors['newPassword']).toBeDefined()
  })

  it('passes when condition is false and field is missing', async () => {
    const result = await validate(settingsSchema, {
      changePassword: false,
    })

    expect(result.success).toBe(true)
  })

  it('passes when condition is false and field is present', async () => {
    const result = await validate(settingsSchema, {
      changePassword: false,
      newPassword: 'extraValue',
    })

    expect(result.success).toBe(true)
  })

  it('supports custom error messages', async () => {
    const schema = z.object({
      enableNotifications: z.boolean(),
      notificationEmail: z.string().optional(),
    }).superRefine(requiredWhen(
      'notificationEmail',
      data => data['enableNotifications'] === true,
      { message: 'Email is required when notifications are enabled' },
    ))

    const result = await validate(schema, {
      enableNotifications: true,
    })

    expect(result.success).toBe(false)
    expect(result.firstErrors['notificationEmail']).toBe(
      'Email is required when notifications are enabled',
    )
  })
})

// ----------------------------------------------------------
// COMBINED SAME-AS + REQUIRED-WHEN
// ----------------------------------------------------------

describe('combined sameAs and requiredWhen in same schema', () => {
  const profileSchema = z.object({
    changePassword: z.boolean(),
    newPassword: z.string().optional(),
    confirmNewPassword: z.string().optional(),
  })
    .superRefine(requiredWhen(
      'newPassword',
      data => data['changePassword'] === true,
    ))
    .superRefine(requiredWhen(
      'confirmNewPassword',
      data => data['changePassword'] === true,
    ))
    .superRefine(sameAs('confirmNewPassword', 'newPassword'))

  it('passes when changePassword is true and both fields match', async () => {
    const result = await validate(profileSchema, {
      changePassword: true,
      newPassword: 'securePass1',
      confirmNewPassword: 'securePass1',
    })

    expect(result.success).toBe(true)
  })

  it('fails with required error when changePassword is true and fields are missing', async () => {
    const result = await validate(profileSchema, {
      changePassword: true,
    })

    expect(result.success).toBe(false)
    expect(result.errors['newPassword']).toBeDefined()
    expect(result.errors['confirmNewPassword']).toBeDefined()
  })

  it('fails with mismatch error when passwords differ', async () => {
    const result = await validate(profileSchema, {
      changePassword: true,
      newPassword: 'securePass1',
      confirmNewPassword: 'wrongPass',
    })

    expect(result.success).toBe(false)
    expect(result.errors['confirmNewPassword']).toBeDefined()
  })

  it('passes when changePassword is false regardless of missing fields', async () => {
    const result = await validate(profileSchema, {
      changePassword: false,
    })

    expect(result.success).toBe(true)
  })
})
