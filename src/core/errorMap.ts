// ==============================================================================
// ERROR MAP
// English default messages for all validex error codes.
// ==============================================================================

import type { ErrorParams } from '../types'

// ----------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------

const LABEL = '{{label}}'
const MIN = '{{minimum}}'
const MAX = '{{maximum}}'
const TEMPLATE_PARAM_RE = /\{\{(\w+)\}\}/g

// ----------------------------------------------------------
// MESSAGE CATALOG
// ----------------------------------------------------------

/**
 * MESSAGE_MAP
 * Maps namespace to code to English template with {{param}} interpolation.
 *
 * @type {Record<string, Record<string, string>>}
 */
export const MESSAGE_MAP: Record<string, Record<string, string>> = {
  base: {
    required: `${LABEL} is required`,
    min: `${LABEL} must be at least ${MIN} characters`,
    max: `${LABEL} must be at most ${MAX} characters`,
    type: `${LABEL} must be a {{expected}}`,
    format: `${LABEL} is not valid`,
  },
  string: {
    minUppercase: `${LABEL} must have at least ${MIN} uppercase characters`,
    minLowercase: `${LABEL} must have at least ${MIN} lowercase characters`,
    minDigits: `${LABEL} must have at least ${MIN} digits`,
    minSpecial: `${LABEL} must have at least ${MIN} special characters`,
    maxUppercase: `${LABEL} must have at most ${MAX} uppercase characters`,
    maxConsecutive: `${LABEL} must not have more than ${MAX} consecutive identical characters`,
    maxWords: `${LABEL} must have at most ${MAX} words`,
    noSpaces: `${LABEL} must not contain spaces`,
  },
  email: {
    invalid: `${LABEL} is not a valid email address`,
    disposableBlocked: 'Disposable email addresses are not allowed',
    plusAliasBlocked: 'Plus alias email addresses are not allowed',
    domainBlocked: 'Email domain \'{{domain}}\' is not allowed',
    domainNotAllowed: 'Email domain \'{{domain}}\' is not in the allowed list',
    subdomainNotAllowed: 'Subdomain email addresses are not allowed',
  },
  personName: {
    invalid: `${LABEL} is not a valid name`,
    maxWords: `${LABEL} must have at most ${MAX} words`,
    boundary: `${LABEL} must start and end with a letter`,
    maxConsecutive: `${LABEL} must not repeat the same character more than ${MAX} times`,
  },
  businessName: {
    invalid: `${LABEL} is not a valid business name`,
    boundary: `${LABEL} must start and end with an alphanumeric character`,
    maxConsecutive: `${LABEL} must not repeat the same character more than ${MAX} times`,
  },
  password: {
    minUppercase: `${LABEL} must have at least ${MIN} uppercase characters`,
    minLowercase: `${LABEL} must have at least ${MIN} lowercase characters`,
    minDigits: `${LABEL} must have at least ${MIN} digits`,
    minSpecial: `${LABEL} must have at least ${MIN} special characters`,
    maxUppercase: `${LABEL} must have at most ${MAX} uppercase characters`,
    maxConsecutive: `${LABEL} must not have more than ${MAX} consecutive identical characters`,
    commonBlocked: 'This password is too common',
  },
  confirmation: { mismatch: 'Passwords must match' },
  phone: {
    invalid: `${LABEL} is not a valid phone number`,
    requireMobile: `${LABEL} must be a mobile phone number`,
    countryBlocked: 'Phone numbers from \'{{country}}\' are not allowed',
    countryNotAllowed: 'Phone numbers from \'{{country}}\' are not in the allowed list',
  },
  website: {
    invalid: `${LABEL} is not a valid website URL`,
    domainBlocked: 'Domain \'{{domain}}\' is not allowed',
    domainNotAllowed: 'Domain \'{{domain}}\' is not in the allowed list',
    subdomainNotAllowed: 'Subdomain URLs are not allowed',
  },
  url: {
    invalid: `${LABEL} is not a valid URL`,
    protocolNotAllowed: 'Protocol \'{{protocol}}\' is not allowed',
    domainBlocked: 'Domain \'{{domain}}\' is not allowed',
    domainNotAllowed: 'Domain \'{{domain}}\' is not in the allowed list',
  },
  username: {
    invalid: `${LABEL} is not a valid username`,
    reservedBlocked: 'The username \'{{value}}\' is reserved',
    boundary: `${LABEL} must start and end with an alphanumeric character`,
    maxConsecutive: `${LABEL} must not repeat the same character more than ${MAX} times`,
  },
  slug: { invalid: `${LABEL} is not a valid slug` },
  postalCode: { invalid: `${LABEL} is not a valid postal code` },
  licenseKey: { invalid: `${LABEL} is not a valid license key` },
  uuid: { invalid: `${LABEL} is not a valid UUID` },
  jwt: {
    invalid: `${LABEL} is not a valid JWT`,
    expired: 'This token has expired',
    notYetValid: 'This token is not yet valid',
    missingClaim: 'Required claim \'{{claim}}\' is missing',
    algorithmNotAllowed: 'Algorithm \'{{algorithm}}\' is not allowed',
  },
  dateTime: {
    invalid: `${LABEL} is not a valid date`,
    tooEarly: `${LABEL} must be after ${MIN}`,
    tooLate: `${LABEL} must be before ${MAX}`,
    noFuture: `${LABEL} must not be in the future`,
    noPast: `${LABEL} must not be in the past`,
  },
  token: { invalid: `${LABEL} is not a valid {{type}} token` },
  text: {
    noEmails: `${LABEL} must not contain email addresses`,
    noUrls: `${LABEL} must not contain URLs`,
    noPhoneNumbers: `${LABEL} must not contain phone numbers`,
    noHtml: `${LABEL} must not contain HTML`,
    maxWords: `${LABEL} must have at most ${MAX} words`,
    maxConsecutive: `${LABEL} must not repeat the same character more than ${MAX} times`,
  },
  country: {
    invalid: `${LABEL} is not a valid country code`,
    blocked: 'Country \'{{country}}\' is not allowed',
    notAllowed: 'Country \'{{country}}\' is not in the allowed list',
  },
  currency: {
    invalid: `${LABEL} is not a valid currency code`,
    blocked: 'Currency \'{{currency}}\' is not allowed',
    notAllowed: 'Currency \'{{currency}}\' is not in the allowed list',
  },
  color: { invalid: `${LABEL} is not a valid color` },
  creditCard: {
    invalid: `${LABEL} is not a valid credit card number`,
    issuerNotAllowed: 'Card issuer \'{{issuer}}\' is not in the allowed list',
    issuerBlocked: 'Card issuer \'{{issuer}}\' is not allowed',
  },
  iban: {
    invalid: `${LABEL} is not a valid IBAN`,
    countryBlocked: 'IBANs from \'{{country}}\' are not allowed',
    countryNotAllowed: 'IBANs from \'{{country}}\' are not in the allowed list',
  },
  vatNumber: { invalid: `${LABEL} is not a valid VAT number` },
  macAddress: { invalid: `${LABEL} is not a valid MAC address` },
  ipAddress: {
    invalid: `${LABEL} is not a valid IP address`,
    privateNotAllowed: 'Private IP addresses are not allowed',
  },
}

// ----------------------------------------------------------
// FUNCTIONS
// ----------------------------------------------------------

/**
 * Get Error Message
 * Looks up the message template and interpolates parameters.
 *
 * @param namespace - Error namespace (e.g. 'email').
 * @param code     - Error code (e.g. 'invalid').
 * @param params   - Interpolation parameters.
 * @returns The interpolated English message string.
 */
export function getErrorMessage(
  namespace: string,
  code: string,
  params: Partial<ErrorParams> & Record<string, unknown> = {},
): string {
  const nsMap = MESSAGE_MAP[namespace]
  const template = nsMap?.[code] ?? MESSAGE_MAP['base']?.['format'] ?? ''
  return template.replace(TEMPLATE_PARAM_RE, (_match, key: string) => {
    const value = params[key]
    return value !== undefined && value !== null ? String(value) : `{{${key}}}`
  })
}

/**
 * Build Message Key
 * Constructs the full i18n key for a given error.
 *
 * @param prefix    - Key prefix (e.g. 'validation').
 * @param separator - Separator between segments (e.g. '.').
 * @param namespace - Error namespace (e.g. 'email').
 * @param code      - Error code (e.g. 'disposableBlocked').
 * @returns The full i18n key string.
 */
export function buildMessageKey(
  prefix: string,
  separator: string,
  namespace: string,
  code: string,
): string {
  return [prefix, 'messages', namespace, code].join(separator)
}

/**
 * Register Messages
 * Adds or overrides messages for a namespace in the runtime catalog.
 *
 * @param namespace - The namespace to register messages under.
 * @param messages  - A record of code to message template strings.
 */
export function registerMessages(
  namespace: string,
  messages: Readonly<Record<string, string>>,
): void {
  const existing = MESSAGE_MAP[namespace]
  MESSAGE_MAP[namespace] = { ...existing, ...messages }
}
