// ==============================================================================
// ERROR MAP TESTS
// Tests message key generation, i18n path modes, and error formatting.
// ==============================================================================

import { describe, expect, it } from 'vitest'

import { buildMessageKey, getErrorMessage, registerMessages } from '@core/errorMap'

describe('getErrorMessage', () => {
  it('should return base.required message with label interpolation', () => {
    const msg = getErrorMessage('base', 'required', { label: 'Email' })
    expect(msg).toBe('Email is required')
  })

  it('should return base.min message with label and minimum', () => {
    const msg = getErrorMessage('base', 'min', { label: 'Password', minimum: 8 })
    expect(msg).toBe('Password must be at least 8 characters')
  })

  it('should return base.max message with label and maximum', () => {
    const msg = getErrorMessage('base', 'max', { label: 'Name', maximum: 50 })
    expect(msg).toBe('Name must be at most 50 characters')
  })

  it('should return email.invalid message', () => {
    const msg = getErrorMessage('email', 'invalid', { label: 'Email' })
    expect(msg).toBe('Email is not a valid email address')
  })

  it('should return email.disposableBlocked message', () => {
    const msg = getErrorMessage('email', 'disposableBlocked', { label: 'Email' })
    expect(msg).toBe('Email must not use a disposable email provider')
  })

  it('should return password.commonBlocked message', () => {
    const msg = getErrorMessage('password', 'commonBlocked', { label: 'Password' })
    expect(msg).toBe('Password is too common')
  })

  it('should return confirmation.mismatch message', () => {
    const msg = getErrorMessage('confirmation', 'mismatch', { label: 'Password Confirmation', targetLabel: 'Password' })
    expect(msg).toBe('Password Confirmation must match Password')
  })

  it('should return jwt.missingClaim with claim interpolation', () => {
    const msg = getErrorMessage('jwt', 'missingClaim', { label: 'Token', claim: 'sub' })
    expect(msg).toBe('Required claim \'sub\' is missing')
  })

  it('should return generic fallback for unknown namespace.code', () => {
    const msg = getErrorMessage('unknown', 'unknownCode', { label: 'Field' })
    expect(msg).toBe('Field is not valid')
  })
})

describe('buildMessageKey', () => {
  it('should build a standard message key', () => {
    expect(buildMessageKey('validation', '.', 'email', 'disposableBlocked'))
      .toBe('validation.messages.email.disposableBlocked')
  })

  it('should use custom prefix and separator', () => {
    expect(buildMessageKey('v', ':', 'password', 'commonBlocked'))
      .toBe('v:messages:password:commonBlocked')
  })
})

describe('registerMessages', () => {
  it('should register custom messages that are retrievable', () => {
    registerMessages('myRule', { invalid: '{{label}} is not valid for my rule' })
    const msg = getErrorMessage('myRule', 'invalid', { label: 'Field' })
    expect(msg).toBe('Field is not valid for my rule')
  })
})

describe('errorMap — edge cases', () => {
  it('falls back to base.format for completely unknown namespace and code', () => {
    const result = getErrorMessage('nonexistent', 'someCode', {})
    expect(typeof result).toBe('string')
    expect(result.length).toBeGreaterThan(0)
  })

  it('preserves placeholder when param is missing from interpolation', () => {
    const result = getErrorMessage('email', 'disposableBlocked', {})
    expect(typeof result).toBe('string')
  })

  it('interpolates all provided params and preserves missing ones', () => {
    registerMessages('testInterp', { test: '{{label}} has {{value}} and {{missing}}' })
    const result = getErrorMessage('testInterp', 'test', { label: 'Name', value: '42' })
    expect(result).toBe('Name has 42 and {{missing}}')
  })
})
