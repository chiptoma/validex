// ==============================================================================
// RULE DEFAULTS
// Centralized Tier 1 defaults for all built-in validex rules.
// ------------------------------------------------------------------------------
// Source of truth: docs/DEFAULTS.md
// NOTE: Keys must match the rule `name` (namespace) used in createRule.
// ==============================================================================

// ----------------------------------------------------------
// RULE DEFAULTS MAP
// ----------------------------------------------------------

/**
 * RULE_DEFAULTS
 * Canonical Tier 1 defaults for every built-in rule. createRule reads
 * this map first, then merges global config (Tier 2), then per-call
 * options (Tier 3).
 */
export const RULE_DEFAULTS: Readonly<Record<string, Record<string, unknown>>> = {
  email: {
    length: { max: 254 },
    blockPlusAlias: false,
    blockDomains: [],
    allowDomains: [],
    blockDisposable: false,
    allowSubdomains: true,
    emptyToUndefined: true,
    normalize: true,
  },
  personName: {
    length: { min: 2, max: 50 },
    words: { max: 5 },
    allowUnicode: true,
    boundary: 'alpha',
    consecutive: { max: 3 },
    titleCase: false,
    emptyToUndefined: true,
    normalize: true,
  },
  businessName: {
    length: { min: 2, max: 100 },
    boundary: 'alphanumeric',
    consecutive: { max: 4 },
    titleCase: false,
    emptyToUndefined: true,
    normalize: true,
  },
  password: {
    length: { min: 8, max: 128 },
    uppercase: { min: 1 },
    lowercase: { min: 1 },
    digits: { min: 1 },
    special: { min: 1 },
    consecutive: { max: 3 },
    blockCommon: false,
    emptyToUndefined: true,
    normalize: false,
  },
  passwordConfirmation: {
    passwordField: 'password',
    emptyToUndefined: true,
    normalize: true,
  },
  phone: {
    allowCountries: [],
    blockCountries: [],
    requireMobile: false,
    requireCountryCode: false,
    format: 'e164',
    emptyToUndefined: true,
    normalize: true,
  },
  website: {
    length: { max: 255 },
    requireWww: false,
    requireHttps: false,
    allowDomains: [],
    blockDomains: [],
    allowSubdomains: true,
    allowPath: true,
    allowQuery: false,
    emptyToUndefined: true,
    normalize: true,
  },
  url: {
    protocols: ['http', 'https'],
    requireTLD: true,
    length: { max: 2048 },
    allowDomains: [],
    blockDomains: [],
    allowQuery: true,
    allowAuth: false,
    emptyToUndefined: true,
    normalize: true,
  },
  username: {
    length: { min: 3, max: 20 },
    pattern: 'alphanumeric-underscore',
    boundary: 'alphanumeric',
    ignoreCase: true,
    blockReserved: false,
    reservedWords: [],
    emptyToUndefined: true,
    normalize: true,
  },
  slug: {
    length: { min: 3, max: 100 },
    emptyToUndefined: true,
    normalize: true,
  },
  postalCode: {
    emptyToUndefined: true,
    normalize: true,
  },
  licenseKey: {
    type: 'custom',
    segments: 5,
    segmentLength: 5,
    separator: '-',
    charset: 'alphanumeric',
    emptyToUndefined: true,
    normalize: true,
  },
  uuid: {
    version: 'any',
    emptyToUndefined: true,
    normalize: true,
  },
  jwt: {
    requireExpiry: false,
    checkExpiry: false,
    checkNotBefore: false,
    clockTolerance: 0,
    emptyToUndefined: true,
    normalize: true,
  },
  dateTime: {
    format: 'iso',
    allowFuture: true,
    allowPast: true,
    allowOffset: true,
    allowLocal: false,
    emptyToUndefined: true,
    normalize: true,
  },
  token: {
    emptyToUndefined: true,
    normalize: true,
  },
  text: {
    noEmails: false,
    noUrls: false,
    noPhoneNumbers: false,
    noHtml: false,
    emptyToUndefined: true,
    normalize: true,
  },
  country: {
    format: 'alpha2',
    allowCountries: [],
    blockCountries: [],
    emptyToUndefined: true,
    normalize: true,
  },
  currency: {
    allowCurrencies: [],
    blockCurrencies: [],
    emptyToUndefined: true,
    normalize: true,
  },
  color: {
    format: 'hex',
    alpha: true,
    emptyToUndefined: true,
    normalize: true,
  },
  creditCard: {
    emptyToUndefined: true,
    normalize: true,
  },
  iban: {
    allowCountries: [],
    blockCountries: [],
    emptyToUndefined: true,
    normalize: true,
  },
  vatNumber: {
    requirePrefix: false,
    emptyToUndefined: true,
    normalize: true,
  },
  macAddress: {
    delimiter: ':',
    emptyToUndefined: true,
    normalize: true,
  },
  ipAddress: {
    version: 'any',
    allowCidr: false,
    allowPrivate: true,
    emptyToUndefined: true,
    normalize: true,
  },
}
