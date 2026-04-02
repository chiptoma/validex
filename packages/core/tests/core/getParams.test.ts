import { afterEach, describe, expect, it } from 'vitest'
import { resetConfig } from '../../src/config'
import { getParams } from '../../src/core/getParams'

describe('getParams', () => {
  afterEach(() => {
    resetConfig()
  })

  it('should extract validex custom params from a refine issue', () => {
    const issue = {
      code: 'custom',
      path: ['email'],
      params: { code: 'disposableBlocked', namespace: 'email' },
    }
    const params = getParams(issue)
    expect(params.code).toBe('disposableBlocked')
    expect(params.namespace).toBe('email')
    expect(params.label).toBe('Email')
    expect(params.path).toEqual(['email'])
  })

  it('should map too_small with minimum=1 to base.required', () => {
    const issue = {
      code: 'too_small',
      minimum: 1,
      path: ['password'],
    }
    const params = getParams(issue)
    expect(params.code).toBe('required')
    expect(params.namespace).toBe('base')
  })

  it('should map too_small with minimum>1 to base.min', () => {
    const issue = {
      code: 'too_small',
      minimum: 8,
      path: ['password'],
    }
    const params = getParams(issue)
    expect(params.code).toBe('min')
    expect(params.namespace).toBe('base')
  })

  it('should map too_big to base.max', () => {
    const issue = {
      code: 'too_big',
      maximum: 128,
      path: ['name'],
    }
    const params = getParams(issue)
    expect(params.code).toBe('max')
    expect(params.namespace).toBe('base')
  })

  it('should map invalid_type with received=undefined to base.required', () => {
    const issue = {
      code: 'invalid_type',
      received: 'undefined',
      path: ['email'],
    }
    const params = getParams(issue)
    expect(params.code).toBe('required')
    expect(params.namespace).toBe('base')
  })

  it('should map invalid_type with non-undefined input to base.type', () => {
    const issue = {
      code: 'invalid_type',
      received: 'number',
      expected: 'string',
      input: 42,
      path: ['name'],
    }
    const params = getParams(issue)
    expect(params.code).toBe('type')
    expect(params.namespace).toBe('base')
  })

  it('should map invalid_format to base.format', () => {
    const issue = {
      code: 'invalid_format',
      path: ['email'],
    }
    const params = getParams(issue)
    expect(params.code).toBe('format')
    expect(params.namespace).toBe('base')
  })

  it('should map invalid_string to base.format', () => {
    const issue = {
      code: 'invalid_string',
      path: ['slug'],
    }
    const params = getParams(issue)
    expect(params.code).toBe('format')
    expect(params.namespace).toBe('base')
  })

  it('should derive label from camelCase path segment', () => {
    const issue = {
      code: 'too_small',
      minimum: 1,
      path: ['billing', 'postalCode'],
    }
    const params = getParams(issue)
    expect(params.label).toBe('Postal Code')
  })

  it('should use explicit label from params', () => {
    const issue = {
      code: 'custom',
      path: ['email'],
      params: { code: 'invalid', namespace: 'email', label: 'Work Email' },
    }
    const params = getParams(issue)
    expect(params.label).toBe('Work Email')
  })

  it('should compute i18n message key', () => {
    const issue = {
      code: 'custom',
      path: ['email'],
      params: { code: 'disposableBlocked', namespace: 'email' },
    }
    const params = getParams(issue)
    expect(params.key).toBe('validation.messages.email.disposableBlocked')
  })

  it('should handle empty path with generic label', () => {
    const issue = {
      code: 'too_small',
      minimum: 1,
      path: [],
    }
    const params = getParams(issue)
    expect(params.label).toBe('This field')
  })
})

describe('getParams — edge cases', () => {
  afterEach(() => {
    resetConfig()
  })

  it('handles issue with undefined code field', () => {
    const params = getParams({ path: ['field'] })
    expect(params.code).toBeDefined()
    expect(params.namespace).toBe('base')
    expect(params.code).toBe('format')
  })

  it('handles issue with no path and no code', () => {
    const params = getParams({})
    expect(params.code).toBe('format')
    expect(params.namespace).toBe('base')
    expect(params.label).toBe('This field')
    expect(params.path).toEqual([])
  })

  it('handles numeric path segment', () => {
    const issue = {
      code: 'too_small',
      minimum: 1,
      path: ['items', 0],
    }
    const params = getParams(issue)
    expect(params.label).toBe('Item 0')
  })
})
