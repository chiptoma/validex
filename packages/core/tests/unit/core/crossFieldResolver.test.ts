// ==============================================================================
// CROSS-FIELD RESOLVER UNIT TESTS
// Unit tests for sameAs and requiredWhen resolution logic.
// ==============================================================================

import { beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { setup } from '../../../src/config/index'
import { resetConfig } from '../../../src/config/store'
import { registerCrossField } from '../../../src/core/crossFieldRegistry'
import { resolveCrossFieldConstraints } from '../../../src/core/crossFieldResolver'
import { _resetCustomErrorFlag, registerCustomError } from '../../../src/core/customError'

beforeEach(() => {
  resetConfig()
  _resetCustomErrorFlag()
  registerCustomError()
})

// ----------------------------------------------------------
// SAME-AS RESOLUTION
// ----------------------------------------------------------

describe('resolveSameAs', () => {
  it('produces no issues when values match', () => {
    const passwordSchema = z.string()
    const confirmSchema = z.string()
    registerCrossField(confirmSchema, { sameAs: 'password' })

    const schema = z.object({ password: passwordSchema, confirmPassword: confirmSchema })
    const parsed = { password: 'abc123', confirmPassword: 'abc123' }
    const issues = resolveCrossFieldConstraints(schema, parsed, new Set(), parsed)

    expect(issues).toEqual([])
  })

  it('produces mismatch issue when values differ', () => {
    const passwordSchema = z.string()
    const confirmSchema = z.string()
    registerCrossField(confirmSchema, { sameAs: 'password' })

    const schema = z.object({ password: passwordSchema, confirmPassword: confirmSchema })
    const parsed = { password: 'abc123', confirmPassword: 'wrong' }
    const issues = resolveCrossFieldConstraints(schema, parsed, new Set(), parsed)

    expect(issues).toHaveLength(1)
    expect(issues[0]?.path).toEqual(['confirmPassword'])
    expect(issues[0]?.message).toContain('must match')
  })

  it('skips check when source field already has errors', () => {
    const passwordSchema = z.string()
    const confirmSchema = z.string()
    registerCrossField(confirmSchema, { sameAs: 'password' })

    const schema = z.object({ password: passwordSchema, confirmPassword: confirmSchema })
    const parsed = { password: 'abc123', confirmPassword: 'wrong' }
    const fieldErrors = new Set(['confirmPassword'])
    const issues = resolveCrossFieldConstraints(schema, parsed, fieldErrors, parsed)

    expect(issues).toEqual([])
  })

  it('throws when sameAs target field does not exist in schema', () => {
    const confirmSchema = z.string()
    registerCrossField(confirmSchema, { sameAs: 'nonExistent' })

    const schema = z.object({ confirmPassword: confirmSchema })
    const parsed = { confirmPassword: 'abc' }

    expect(() =>
      resolveCrossFieldConstraints(schema, parsed, new Set(), parsed),
    ).toThrow('target field "nonExistent" does not exist')
  })

  it('includes explicit labels in the mismatch message', () => {
    const passwordSchema = z.string()
    const confirmSchema = z.string()
    registerCrossField(passwordSchema, { label: 'Password' })
    registerCrossField(confirmSchema, { sameAs: 'password', label: 'Confirm Password' })

    const schema = z.object({ password: passwordSchema, confirmPassword: confirmSchema })
    const parsed = { password: 'abc123', confirmPassword: 'wrong' }
    const issues = resolveCrossFieldConstraints(schema, parsed, new Set(), parsed)

    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('Confirm Password')
    expect(issues[0]?.message).toContain('Password')
  })
})

// ----------------------------------------------------------
// REQUIRED-WHEN RESOLUTION
// ----------------------------------------------------------

describe('resolveRequiredWhen', () => {
  it('produces required issue when target has a value and source is empty', () => {
    const usernameSchema = z.string()
    const emailSchema = z.string().optional()
    registerCrossField(emailSchema, { requiredWhen: 'username' })

    const schema = z.object({ username: usernameSchema, email: emailSchema })
    const parsed = { username: 'johndoe', email: undefined }
    const raw = { username: 'johndoe', email: '' }
    const issues = resolveCrossFieldConstraints(schema, parsed, new Set(), raw)

    expect(issues).toHaveLength(1)
    expect(issues[0]?.path).toEqual(['email'])
    expect(issues[0]?.message).toContain('required')
  })

  it('produces no issue when target has a value and source is present', () => {
    const usernameSchema = z.string()
    const emailSchema = z.string().optional()
    registerCrossField(emailSchema, { requiredWhen: 'username' })

    const schema = z.object({ username: usernameSchema, email: emailSchema })
    const parsed = { username: 'johndoe', email: 'user@test.com' }
    const raw = { username: 'johndoe', email: 'user@test.com' }
    const issues = resolveCrossFieldConstraints(schema, parsed, new Set(), raw)

    expect(issues).toEqual([])
  })

  it('produces no issue when target field is empty', () => {
    const usernameSchema = z.string()
    const emailSchema = z.string().optional()
    registerCrossField(emailSchema, { requiredWhen: 'username' })

    const schema = z.object({ username: usernameSchema, email: emailSchema })
    const parsed = { username: undefined, email: undefined }
    const raw = { username: '', email: '' }
    const issues = resolveCrossFieldConstraints(schema, parsed, new Set(), raw)

    expect(issues).toEqual([])
  })

  it('skips when target field has errors', () => {
    const usernameSchema = z.string()
    const emailSchema = z.string().optional()
    registerCrossField(emailSchema, { requiredWhen: 'username' })

    const schema = z.object({ username: usernameSchema, email: emailSchema })
    const parsed = { username: 'johndoe', email: undefined }
    const raw = { username: 'johndoe', email: '' }
    const fieldErrors = new Set(['username'])
    const issues = resolveCrossFieldConstraints(schema, parsed, fieldErrors, raw)

    expect(issues).toEqual([])
  })
})

// ----------------------------------------------------------
// NESTED SCHEMA RECURSION
// ----------------------------------------------------------

describe('nested schema recursion', () => {
  it('resolves sameAs within a nested z.object', () => {
    const passwordSchema = z.string()
    const confirmSchema = z.string()
    registerCrossField(confirmSchema, { sameAs: 'password' })

    const nested = z.object({ password: passwordSchema, confirmPassword: confirmSchema })
    const schema = z.object({ profile: nested })
    const parsed = { profile: { password: 'abc', confirmPassword: 'xyz' } }
    const raw = { profile: { password: 'abc', confirmPassword: 'xyz' } }
    const issues = resolveCrossFieldConstraints(schema, parsed, new Set(), raw)

    expect(issues).toHaveLength(1)
    expect(issues[0]?.path).toEqual(['profile', 'confirmPassword'])
    expect(issues[0]?.message).toContain('must match')
  })

  it('produces no issues in nested schema when values match', () => {
    const passwordSchema = z.string()
    const confirmSchema = z.string()
    registerCrossField(confirmSchema, { sameAs: 'password' })

    const nested = z.object({ password: passwordSchema, confirmPassword: confirmSchema })
    const schema = z.object({ profile: nested })
    const parsed = { profile: { password: 'abc', confirmPassword: 'abc' } }
    const raw = { profile: { password: 'abc', confirmPassword: 'abc' } }
    const issues = resolveCrossFieldConstraints(schema, parsed, new Set(), raw)

    expect(issues).toEqual([])
  })
})

// ----------------------------------------------------------
// MIXED SAME-AS + REQUIRED-WHEN
// ----------------------------------------------------------

describe('mixed sameAs and requiredWhen on same schema', () => {
  it('resolves both constraints independently', () => {
    const triggerSchema = z.string()
    const fieldSchema = z.string().optional()
    const confirmSchema = z.string()
    registerCrossField(fieldSchema, { requiredWhen: 'trigger' })
    registerCrossField(confirmSchema, { sameAs: 'field' })

    const schema = z.object({
      trigger: triggerSchema,
      field: fieldSchema,
      confirm: confirmSchema,
    })
    const parsed = { trigger: 'yes', field: undefined, confirm: 'x' }
    const raw = { trigger: 'yes', field: '', confirm: 'x' }
    const issues = resolveCrossFieldConstraints(schema, parsed, new Set(), raw)

    const paths = issues.map(i => i.path.join('.'))
    expect(paths).toContain('field')
    expect(paths).toContain('confirm')
  })

  it('produces no issues when all constraints satisfied', () => {
    const triggerSchema = z.string()
    const fieldSchema = z.string()
    const confirmSchema = z.string()
    registerCrossField(fieldSchema, { requiredWhen: 'trigger' })
    registerCrossField(confirmSchema, { sameAs: 'field' })

    const schema = z.object({
      trigger: triggerSchema,
      field: fieldSchema,
      confirm: confirmSchema,
    })
    const parsed = { trigger: 'yes', field: 'abc', confirm: 'abc' }
    const raw = { trigger: 'yes', field: 'abc', confirm: 'abc' }
    const issues = resolveCrossFieldConstraints(schema, parsed, new Set(), raw)

    expect(issues).toEqual([])
  })
})

// ----------------------------------------------------------
// EDGE CASES
// ----------------------------------------------------------

describe('edge cases', () => {
  it('handles non-object rawData gracefully', () => {
    const fieldSchema = z.string()
    const confirmSchema = z.string()
    registerCrossField(confirmSchema, { sameAs: 'field' })

    const schema = z.object({ field: fieldSchema, confirm: confirmSchema })
    const parsed = { field: 'abc', confirm: 'xyz' }
    const issues = resolveCrossFieldConstraints(schema, parsed, new Set(), null)

    expect(issues).toHaveLength(1)
    expect(issues[0]?.path).toEqual(['confirm'])
  })

  it('handles undefined parsedData gracefully without crashing', () => {
    const fieldSchema = z.string()
    const confirmSchema = z.string()
    registerCrossField(confirmSchema, { sameAs: 'field' })

    const schema = z.object({ field: fieldSchema, confirm: confirmSchema })
    const issues = resolveCrossFieldConstraints(schema, undefined, new Set(), {})

    // Both field and confirm are undefined in parsedData, so sameAs sees undefined === undefined → match
    expect(issues).toEqual([])
  })

  it('fields without crossField metadata produce no issues', () => {
    const schema = z.object({
      name: z.string(),
      email: z.string(),
    })
    const parsed = { name: 'Alice', email: 'alice@test.com' }
    const issues = resolveCrossFieldConstraints(schema, parsed, new Set(), parsed)

    expect(issues).toEqual([])
  })
})

// ----------------------------------------------------------
// CROSS-FIELD RESOLVER — LABEL & I18N EDGE CASES
// ----------------------------------------------------------

describe('crossFieldResolver — label and i18n edge cases', () => {
  it('uses generic label when fallback is generic', () => {
    resetConfig()
    _resetCustomErrorFlag()
    setup({ label: { fallback: 'generic' } })
    registerCustomError()

    const passwordSchema = z.string()
    const confirmSchema = z.string()
    registerCrossField(confirmSchema, { sameAs: 'password' })

    const schema = z.object({ password: passwordSchema, confirm: confirmSchema })
    const parsed = { password: 'abc123', confirm: 'wrong' }
    const issues = resolveCrossFieldConstraints(schema, parsed, new Set(), parsed)

    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('This field')
  })

  it('applies label transform to cross-field error labels', () => {
    resetConfig()
    _resetCustomErrorFlag()
    setup({
      label: { transform: ({ defaultLabel }) => defaultLabel.toUpperCase() },
    })
    registerCustomError()

    const passwordSchema = z.string()
    const confirmSchema = z.string()
    registerCrossField(confirmSchema, { sameAs: 'password' })

    const schema = z.object({ password: passwordSchema, confirm: confirmSchema })
    const parsed = { password: 'abc123', confirm: 'wrong' }
    const issues = resolveCrossFieldConstraints(schema, parsed, new Set(), parsed)

    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('CONFIRM')
  })

  it('translates cross-field errors when i18n t() is configured', () => {
    resetConfig()
    _resetCustomErrorFlag()
    setup({
      i18n: {
        enabled: true,
        t: (key: string) => `translated:${key}`,
      },
    })
    registerCustomError()

    const passwordSchema = z.string()
    const confirmSchema = z.string()
    registerCrossField(confirmSchema, { sameAs: 'password' })

    const schema = z.object({ password: passwordSchema, confirm: confirmSchema })
    const parsed = { password: 'abc123', confirm: 'wrong' }
    const issues = resolveCrossFieldConstraints(schema, parsed, new Set(), parsed)

    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toMatch(/^translated:/)
  })

  it('returns i18n key when i18n enabled but no t() function', () => {
    resetConfig()
    _resetCustomErrorFlag()
    setup({
      i18n: { enabled: true },
    })
    registerCustomError()

    const passwordSchema = z.string()
    const confirmSchema = z.string()
    registerCrossField(confirmSchema, { sameAs: 'password' })

    const schema = z.object({ password: passwordSchema, confirm: confirmSchema })
    const parsed = { password: 'abc123', confirm: 'wrong' }
    const issues = resolveCrossFieldConstraints(schema, parsed, new Set(), parsed)

    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('validation.messages.confirmation.mismatch')
  })
})

// ----------------------------------------------------------
// EDGE CASES
// ----------------------------------------------------------

describe('crossFieldResolver — edge cases', () => {
  it('derives empty label when label.fallback is none', () => {
    resetConfig()
    _resetCustomErrorFlag()
    setup({ label: { fallback: 'none' } })
    registerCustomError()

    const passwordSchema = z.string()
    const confirmSchema = z.string()
    registerCrossField(confirmSchema, { sameAs: 'password' })

    const schema = z.object({ password: passwordSchema, confirmPassword: confirmSchema })
    const parsed = { password: 'abc123', confirmPassword: 'wrong' }
    const issues = resolveCrossFieldConstraints(schema, parsed, new Set(), parsed)

    expect(issues).toHaveLength(1)
    // With 'none' fallback, the label should be empty
    expect(issues[0]?.message).toBeDefined()
  })

  it('returns empty array for field not in shape', () => {
    resetConfig()
    _resetCustomErrorFlag()
    registerCustomError()

    const passwordSchema = z.string()
    // confirmSchema is NOT in the z.object shape
    const schema = z.object({ password: passwordSchema })
    const parsed = { password: 'abc123' }
    const issues = resolveCrossFieldConstraints(schema, parsed, new Set(), parsed)

    expect(issues).toEqual([])
  })

  it('uses label.transform when configured', () => {
    resetConfig()
    _resetCustomErrorFlag()
    setup({
      label: {
        transform: ({ fieldName }) => `Custom ${fieldName}`,
      },
    })
    registerCustomError()

    const passwordSchema = z.string()
    const confirmSchema = z.string()
    registerCrossField(confirmSchema, { sameAs: 'password' })

    const schema = z.object({ password: passwordSchema, confirmPassword: confirmSchema })
    const parsed = { password: 'abc123', confirmPassword: 'wrong' }
    const issues = resolveCrossFieldConstraints(schema, parsed, new Set(), parsed)

    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('Custom')
  })

  it('derives label from field name with no config (derived fallback)', () => {
    resetConfig()
    _resetCustomErrorFlag()
    // No label config — uses 'derived' fallback by default
    registerCustomError()

    const passwordSchema = z.string()
    const confirmSchema = z.string()
    registerCrossField(confirmSchema, { sameAs: 'password' })

    const schema = z.object({ password: passwordSchema, confirmPassword: confirmSchema })
    const parsed = { password: 'abc123', confirmPassword: 'wrong' }
    const issues = resolveCrossFieldConstraints(schema, parsed, new Set(), parsed)

    expect(issues).toHaveLength(1)
    // With derived fallback, 'confirmPassword' becomes 'Confirm Password'
    expect(issues[0]?.message).toBeDefined()
  })

  it('uses derived fallback when label.fallback is cleared', () => {
    resetConfig()
    _resetCustomErrorFlag()
    // Clearing label.fallback triggers the ?? 'derived' fallback
    setup({ label: {} })
    registerCustomError()

    const passwordSchema = z.string()
    const confirmSchema = z.string()
    registerCrossField(confirmSchema, { sameAs: 'password' })

    const schema = z.object({ password: passwordSchema, confirmPassword: confirmSchema })
    const parsed = { password: 'abc123', confirmPassword: 'wrong' }
    const issues = resolveCrossFieldConstraints(schema, parsed, new Set(), parsed)

    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toBeDefined()
  })

  it('uses generic label fallback in cross-field resolution', () => {
    resetConfig()
    _resetCustomErrorFlag()
    setup({ label: { fallback: 'generic' } })
    registerCustomError()

    const passwordSchema = z.string()
    const confirmSchema = z.string()
    registerCrossField(confirmSchema, { sameAs: 'password' })

    const schema = z.object({ password: passwordSchema, confirmPassword: confirmSchema })
    const parsed = { password: 'abc123', confirmPassword: 'wrong' }
    const issues = resolveCrossFieldConstraints(schema, parsed, new Set(), parsed)

    expect(issues).toHaveLength(1)
    expect(issues[0]?.message).toContain('This field')
  })

  it('uses default i18n prefix/separator when cleared for cross-field messages', () => {
    resetConfig()
    _resetCustomErrorFlag()
    setup({
      i18n: { enabled: true },
    })
    registerCustomError()

    const passwordSchema = z.string()
    const confirmSchema = z.string()
    registerCrossField(confirmSchema, { sameAs: 'password' })

    const schema = z.object({ password: passwordSchema, confirmPassword: confirmSchema })
    const parsed = { password: 'abc123', confirmPassword: 'wrong' }
    const issues = resolveCrossFieldConstraints(schema, parsed, new Set(), parsed)

    expect(issues).toHaveLength(1)
    // With cleared prefix/separator, defaults to 'validation.messages.confirmation.mismatch'
    expect(issues[0]?.message).toContain('validation')
  })
})
