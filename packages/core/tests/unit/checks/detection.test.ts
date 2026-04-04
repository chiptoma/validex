// ==============================================================================
// DETECTION CHECK TESTS
// Tests containsEmail, containsUrl, containsHtml, containsPhoneNumber functions.
// ==============================================================================

import { describe, expect, it } from 'vitest'

import {
  containsEmail,
  containsHtml,
  containsUrl,
} from '@checks/detection'
import { containsPhoneNumber } from '@checks/phoneDetection'

describe('containsEmail', () => {
  it('should detect a standard email in surrounding text', () => {
    expect(containsEmail('contact test@example.com please')).toBe(true)
  })

  it('should detect an email with subdomains', () => {
    expect(containsEmail('user@sub.domain.co.uk is my email')).toBe(true)
  })

  it('should reject text without an email', () => {
    expect(containsEmail('no email here')).toBe(false)
  })

  it('should reject an incomplete email missing the domain', () => {
    expect(containsEmail('user@')).toBe(false)
  })

  it('should reject a bare at-sign prefix', () => {
    expect(containsEmail('just@')).toBe(false)
  })
})

describe('containsUrl', () => {
  it('should detect an https URL', () => {
    expect(containsUrl('visit https://example.com now')).toBe(true)
  })

  it('should detect an http URL with path and query', () => {
    expect(containsUrl('go to http://test.org/path?q=1')).toBe(true)
  })

  it('should detect a www-prefixed URL without protocol', () => {
    expect(containsUrl('check www.example.com')).toBe(true)
  })

  it('should reject text without a URL', () => {
    expect(containsUrl('no url here')).toBe(false)
  })

  it('should reject a non-standard protocol prefix', () => {
    expect(containsUrl('not://a-url')).toBe(false)
  })
})

describe('containsHtml', () => {
  it('should detect script tags', () => {
    expect(containsHtml('<script>alert(1)</script>')).toBe(true)
  })

  it('should detect inline formatting tags', () => {
    expect(containsHtml('<b>bold</b>')).toBe(true)
  })

  it('should detect self-closing tags with attributes', () => {
    expect(containsHtml('<img src="x" />')).toBe(true)
  })

  it('should detect self-closing tags without spaces', () => {
    expect(containsHtml('<br/>')).toBe(true)
  })

  it('should not flag comparison operators', () => {
    expect(containsHtml('a < b and c > d')).toBe(false)
  })

  it('should not flag emoticons', () => {
    expect(containsHtml('I <3 you')).toBe(false)
  })

  it('should reject plain text', () => {
    expect(containsHtml('no html here')).toBe(false)
  })
})

describe('containsPhoneNumber', () => {
  it('should detect a Spanish phone number', async () => {
    expect(await containsPhoneNumber('call +34 612 345 678 now')).toBe(true)
  })

  it('should detect a US phone number in international format', async () => {
    expect(await containsPhoneNumber('call +1 212 555 1234 now')).toBe(true)
  })

  it('should detect a French phone number in international format', async () => {
    expect(await containsPhoneNumber('call +33 6 12 34 56 78 now')).toBe(true)
  })

  it('should reject text without a phone number', async () => {
    expect(await containsPhoneNumber('no phone here')).toBe(false)
  })

  it('should reject a number that is too short', async () => {
    expect(await containsPhoneNumber('call 12345')).toBe(false)
  })
})
