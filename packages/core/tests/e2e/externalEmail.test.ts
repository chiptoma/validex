// ==============================================================================
// EXTERNAL EMAIL VALIDATION TESTS
// Regression tests using well-known RFC 5322 edge cases and the cjaoude
// email validity corpus (https://gist.github.com/cjaoude/fd9910626629b53c4d25).
// ------------------------------------------------------------------------------
// NOTE: These are permanent regression tests. If a case fails, investigate
//   whether the rule or the expectation needs updating, not both.
// ==============================================================================

import type { z } from 'zod'

import { describe, expect, it } from 'vitest'

import { Email } from '@rules/email'

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Parse
 * Runs sync safeParse with default options (no blockDisposable).
 *
 * @param schema - The Zod schema from the email rule factory.
 * @param value  - The value to parse.
 * @returns The safe parse result.
 */
function parse(
  schema: unknown,
  value: unknown,
): { success: boolean, data?: unknown, error?: unknown } {
  return (schema as z.ZodType).safeParse(value)
}

// ----------------------------------------------------------
// VALID EMAILS (RFC 5322 / cjaoude corpus)
// ----------------------------------------------------------

describe('external email corpus - valid addresses', () => {
  const schema = Email()

  const validCases: ReadonlyArray<readonly [string, string]> = [
    // Standard format - local@domain.tld
    ['email@example.com', 'standard email format'],
    // Dots in local part are allowed per RFC 5321 section 4.5.3.1.1
    ['firstname.lastname@example.com', 'dots in local part'],
    // Subdomains are valid (subdomain.example.com)
    ['email@subdomain.example.com', 'subdomain in domain part'],
    // Plus aliases are valid in local part per RFC 5321
    ['firstname+lastname@example.com', 'plus alias in local part'],
    // Country-code TLD
    ['email@example.co.jp', 'country-code second-level domain'],
    // All-numeric local part is valid
    ['1234567890@example.com', 'numeric local part'],
    // Hyphens in domain are allowed per RFC 952 / 1123
    ['email@example-one.com', 'hyphen in domain label'],
    // Underscores in local part are allowed
    ['_______@example.com', 'underscores in local part'],
    // .name TLD
    ['email@example.name', '.name TLD'],
    // .museum TLD (long TLD)
    ['email@example.museum', 'long TLD (.museum)'],
    // .web TLD (new gTLD)
    ['email@example.web', 'new gTLD (.web)'],
    // Hyphens in local part are allowed
    ['firstname-lastname@example.com', 'hyphen in local part'],
  ]

  it.each(validCases)(
    'accepts valid email: %s (%s)',
    (value: string, _reason: string) => {
      const result = parse(schema, value)
      expect(result.success).toBe(true)
    },
  )
})

// ----------------------------------------------------------
// INVALID EMAILS (RFC 5322 / cjaoude corpus)
// ----------------------------------------------------------

describe('external email corpus - invalid addresses', () => {
  const schema = Email()

  const invalidCases: ReadonlyArray<readonly [string, string]> = [
    // No @ sign at all
    ['plainaddress', 'missing @ sign and domain'],
    // Garbage characters are not valid in domain
    ['#@%^%#$@#$@#.com', 'multiple @ signs and garbage characters'],
    // Missing local part (nothing before @)
    ['@example.com', 'missing local part'],
    // Angle-bracket format is not a bare email address
    ['Joe Smith <email@example.com>', 'angle-bracket display name format'],
    // Missing @ sign (dot instead)
    ['email.example.com', 'missing @ sign, looks like domain'],
    // Two @ signs
    ['email@example@example.com', 'multiple @ signs'],
    // Leading dot in local part violates RFC 5321 section 4.5.3.1.1
    ['.email@example.com', 'leading dot in local part'],
    // Trailing dot in local part violates RFC 5321
    ['email.@example.com', 'trailing dot in local part'],
    // Consecutive dots in local part violate RFC 5321
    ['email..email@example.com', 'consecutive dots in local part'],
    // Parenthetical comments after a valid address (not valid bare email)
    ['email@example.com (Joe Smith)', 'trailing parenthetical comment'],
    // Missing TLD (single-label domain)
    // NOTE: Zod's z.string().email() rejects single-label domains even
    // though RFC 5321 technically allows them. This is a conscious
    // practical decision since single-label domains are non-routable.
    ['email@example', 'single-label domain, no TLD'],
    // Leading hyphen in domain violates RFC 952
    ['email@-example.com', 'leading hyphen in domain label'],
    // Numeric domain with invalid octet length (not a valid domain label)
    ['email@111.222.333.44444', 'invalid numeric domain labels'],
    // Consecutive dots in domain violate RFC 1035
    ['email@example..com', 'consecutive dots in domain'],
    // Consecutive dots in local part violate RFC 5321
    ['Abc..123@example.com', 'consecutive dots in local part (variant)'],
  ]

  it.each(invalidCases)(
    'rejects invalid email: %s (%s)',
    (value: string, _reason: string) => {
      const result = parse(schema, value)
      expect(result.success).toBe(false)
    },
  )
})

// ----------------------------------------------------------
// CONSCIOUS DEVIATIONS FROM RFC
// ----------------------------------------------------------

describe('external email corpus - conscious deviations', () => {
  const schema = Email()

  // Bare numeric domains like 123.123.123.123 (without brackets) are
  // rejected by Zod's z.string().email(). While the cjaoude corpus lists
  // this as valid, Zod does not treat all-numeric labels as a routable
  // domain. This is a practical decision aligned with real-world usage.
  it('rejects bare numeric domain (conscious deviation)', () => {
    const result = parse(schema, 'email@123.123.123.123')
    expect(result.success).toBe(false)
  })

  // RFC 5321 section 4.1.3 allows IP address literals in brackets
  // e.g. user@[192.168.1.1]. Our rule delegates to Zod's z.string().email()
  // which rejects IP literals. This is intentional: IP-literal emails are
  // extremely rare in production and often indicate spam or misconfiguration.
  it('rejects IP address literals in brackets (conscious deviation from RFC 5321)', () => {
    const result = parse(schema, 'user@[192.168.1.1]')
    expect(result.success).toBe(false)
  })

  // RFC 5321 allows quoted local parts like "user name"@example.com.
  // Zod rejects these. This is intentional: quoted local parts are almost
  // never used in real-world email and are a common source of injection attacks.
  it('rejects quoted local parts (conscious deviation from RFC 5321)', () => {
    const result = parse(schema, '"user name"@example.com')
    expect(result.success).toBe(false)
  })

  // RFC allows very long local parts (up to 64 octets). Our default max
  // length is 254 (full address), which is the SMTP path limit. This is
  // the practical standard used by most validators.
  it('enforces max 254 character total length (SMTP path limit)', () => {
    const longLocal = 'a'.repeat(64)
    const longDomain = `${'b'.repeat(63)}.com`
    const withinLimit = `${longLocal}@${longDomain}`
    const result = parse(schema, withinLimit)

    // 64 + 1 + 63 + 4 = 132 chars, well within 254
    expect(result.success).toBe(true)

    const overLimit = `${'a'.repeat(245)}@b.com`
    const result2 = parse(schema, overLimit)

    // 245 + 1 + 5 = 251, still within 254
    expect(result2.success).toBe(true)

    const wayOver = `${'a'.repeat(250)}@b.com`
    const result3 = parse(schema, wayOver)

    // 250 + 1 + 5 = 256, exceeds 254
    expect(result3.success).toBe(false)
  })
})

// ----------------------------------------------------------
// NORMALIZATION BEHAVIOR
// ----------------------------------------------------------

describe('external email corpus - normalization', () => {
  const schema = Email()

  it('lowercases and trims by default', () => {
    const result = parse(schema, '  User@Example.COM  ')
    expect(result.success).toBe(true)
    expect(result.data).toBe('user@example.com')
  })

  it('preserves original case when normalize is false', () => {
    const rawSchema = Email({ normalize: false })
    const result = parse(rawSchema, 'User@Example.COM')
    expect(result.success).toBe(true)
    expect(result.data).toBe('User@Example.COM')
  })
})
