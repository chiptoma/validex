// ==============================================================================
// CROSS-FIELD VALIDATION INTEGRATION TESTS
// Validates sameAs and requiredWhen utilities in realistic schemas.
// ==============================================================================

import { beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { setup } from '../../src/config/index'
import { resetConfig } from '../../src/config/store'
import { _resetCustomErrorFlag, registerCustomError } from '../../src/core/customError'
import { validate } from '../../src/core/validate'
import { Email } from '../../src/rules/email'
import { Password } from '../../src/rules/password'
import { PasswordConfirmation } from '../../src/rules/passwordConfirmation'
import { Username } from '../../src/rules/username'
import { requiredWhen } from '../../src/utilities/requiredWhen'
import { sameAs } from '../../src/utilities/sameAs'

beforeEach(() => {
  resetConfig()
  _resetCustomErrorFlag()
  registerCustomError()
})

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

// ----------------------------------------------------------
// RULE-BASED SAME-AS VIA VALIDATE()
// ----------------------------------------------------------

describe('rule-based sameAs via validate()', () => {
  it('detects mismatch between email and confirmEmail fields', async () => {
    const schema = z.object({
      email: Email(),
      confirmEmail: Email({ sameAs: 'email' }),
    })

    const result = await validate(schema, {
      email: 'user@example.com',
      confirmEmail: 'other@example.com',
    })

    expect(result.success).toBe(false)
    expect(result.firstErrors['confirmEmail']).toContain('must match')
  })

  it('compares PARSED values (post-normalisation) not raw input', async () => {
    const schema = z.object({
      email: Email(),
      confirmEmail: Email({ sameAs: 'email' }),
    })

    const result = await validate(schema, {
      email: '  USER@example.com  ',
      confirmEmail: 'user@example.com',
    })

    expect(result.success).toBe(true)
  })

  it('throws config error when sameAs target field does not exist in schema', async () => {
    const schema = z.object({
      email: Email(),
      confirmEmail: Email({ sameAs: 'nonExistentField' }),
    })

    await expect(validate(schema, {
      email: 'user@example.com',
      confirmEmail: 'user@example.com',
    })).rejects.toThrow('target field "nonExistentField" does not exist')
  })

  it('skips cross-field check when the field has its own validation errors', async () => {
    const schema = z.object({
      email: Email(),
      confirmEmail: Email({ sameAs: 'email' }),
    })

    const result = await validate(schema, {
      email: 'user@example.com',
      confirmEmail: 'not-an-email',
    })

    expect(result.success).toBe(false)
    expect(result.firstErrors['confirmEmail']).toContain('not a valid email')
    // Should only have the format error, not the mismatch error
    expect(result.errors['confirmEmail']?.some(e => e.includes('must match'))).toBeFalsy()
  })

  it('includes both label and targetLabel in the mismatch message', async () => {
    const schema = z.object({
      email: Email({ label: 'Primary Email' }),
      confirmEmail: Email({ sameAs: 'email', label: 'Confirm Email' }),
    })

    const result = await validate(schema, {
      email: 'user@example.com',
      confirmEmail: 'other@example.com',
    })

    expect(result.success).toBe(false)
    const msg = result.firstErrors['confirmEmail']
    expect(msg).toContain('Confirm Email')
    expect(msg).toContain('Primary Email')
  })

  it('produces no error when values match', async () => {
    const schema = z.object({
      email: Email(),
      confirmEmail: Email({ sameAs: 'email' }),
    })

    const result = await validate(schema, {
      email: 'user@example.com',
      confirmEmail: 'user@example.com',
    })

    expect(result.success).toBe(true)
  })

  it('passwordConfirmation auto-wires sameAs to password field', async () => {
    const schema = z.object({
      password: Password(),
      passwordConfirmation: PasswordConfirmation(),
    })

    const result = await validate(schema, {
      password: 'MyStr0ng!Pass',
      passwordConfirmation: 'DifferentP@ss1',
    })

    expect(result.success).toBe(false)
    expect(result.firstErrors['passwordConfirmation']).toContain('must match')
  })

  it('passwordConfirmation respects custom passwordField option', async () => {
    const schema = z.object({
      newPassword: Password(),
      confirmNewPassword: PasswordConfirmation({ passwordField: 'newPassword' }),
    })

    const result = await validate(schema, {
      newPassword: 'MyStr0ng!Pass',
      confirmNewPassword: 'DifferentP@ss1',
    })

    expect(result.success).toBe(false)
    expect(result.firstErrors['confirmNewPassword']).toContain('must match')
  })
})

// ----------------------------------------------------------
// RULE-BASED REQUIRED-WHEN VIA VALIDATE()
// ----------------------------------------------------------

describe('rule-based requiredWhen via validate()', () => {
  it('requires field when target field passes and has a value', async () => {
    const schema = z.object({
      username: Username(),
      email: Email({ requiredWhen: 'username' }),
    })

    const result = await validate(schema, {
      username: 'johndoe',
      email: '',
    })

    expect(result.success).toBe(false)
    expect(result.firstErrors['email']).toContain('required')
  })

  it('does not require field when target field fails validation', async () => {
    const schema = z.object({
      username: Username(),
      email: Email({ requiredWhen: 'username' }),
    })

    const result = await validate(schema, {
      username: 'a',
      email: '',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors['username']).toBeDefined()
    }
  })

  it('does not require field when target field is absent', async () => {
    const schema = z.object({
      username: Username(),
      email: Email({ requiredWhen: 'username' }),
    })

    const result = await validate(schema, {
      username: '',
      email: '',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors['username']).toBeDefined()
    }
  })

  it('produces no error when target passes and field has a value', async () => {
    const schema = z.object({
      username: Username(),
      email: Email({ requiredWhen: 'username' }),
    })

    const result = await validate(schema, {
      username: 'johndoe',
      email: 'user@example.com',
    })

    expect(result.success).toBe(true)
  })
})

// ----------------------------------------------------------
// CROSS-FIELD EDGE CASES
// ----------------------------------------------------------

describe('cross-field edge cases', () => {
  it('direct safeParse skips cross-field checks silently', async () => {
    const schema = z.object({
      email: Email(),
      confirmEmail: Email({ sameAs: 'email' }),
    })

    const result = await schema.safeParseAsync({
      email: 'user@example.com',
      confirmEmail: 'other@example.com',
    })

    expect(result.success).toBe(true)
  })

  it('nested z.object resolves sameAs within same nesting level', async () => {
    const schema = z.object({
      profile: z.object({
        email: Email(),
        confirmEmail: Email({ sameAs: 'email' }),
      }),
    })

    const result = await validate(schema, {
      profile: {
        email: 'user@example.com',
        confirmEmail: 'other@example.com',
      },
    })

    expect(result.success).toBe(false)
    expect(result.firstErrors['profile.confirmEmail']).toContain('must match')
  })

  it('i18n mode produces i18n keys for cross-field errors', async () => {
    setup({ i18n: { enabled: true } })
    registerCustomError()

    const schema = z.object({
      email: Email(),
      confirmEmail: Email({ sameAs: 'email' }),
    })

    const result = await validate(schema, {
      email: 'user@example.com',
      confirmEmail: 'other@example.com',
    })

    expect(result.success).toBe(false)
    expect(result.firstErrors['confirmEmail']).toBe('validation.messages.confirmation.mismatch')
  })
})
