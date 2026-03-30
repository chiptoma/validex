// ==============================================================================
// VALIDEX — MAIN ENTRY POINT
// Re-exports all public APIs.
// ==============================================================================

// Configuration
export { getConfig, preloadData, setup } from './config'

// Core utilities
export { createRule } from './core/createRule'
export { registerCustomError } from './core/customError'
export { getErrorMessage, MESSAGE_MAP, registerMessages } from './core/errorMap'
export { getParams } from './core/getParams'
export { validate } from './core/validate'

// Data types (for consumers using data loaders)
export type { CountryData } from './data/countryCodes'

export type { CardIssuer } from './data/creditCardPrefixes'

export type { IbanPattern } from './data/ibanPatterns'
// Internal types (for consumers building custom rules)
export type { ResolvedBoundary } from './internal/resolveBoundary'
export type { ResolvedRange } from './internal/resolveRange'

// Rules (re-export from rules barrel)
export {
  BusinessName,
  Color,
  Country,
  creditCard,
  Currency,
  dateTime,
  email,
  iban,
  ipAddress,
  jwt,
  LicenseKey,
  macAddress,
  password,
  passwordConfirmation,
  PersonName,
  phone,
  postalCode,
  Slug,
  text,
  Token,
  url,
  Username,
  uuid,
  vatNumber,
  website,
} from './rules'
// Rule option types
export type {
  BusinessNameOptions,
  ColorOptions,
  CountryOptions,
  CreditCardOptions,
  CurrencyOptions,
  DateTimeOptions,
  EmailOptions,
  IbanOptions,
  IpAddressOptions,
  IssuerType,
  JWTOptions,
  LicenseKeyOptions,
  MacAddressOptions,
  PasswordConfirmationOptions,
  PasswordOptions,
  PersonNameOptions,
  PhoneOptions,
  PostalCodeOptions,
  SlugOptions,
  TextOptions,
  TokenOptions,
  TokenType,
  URLOptions,
  UsernameOptions,
  UUIDOptions,
  VatNumberOptions,
  WebsiteOptions,
} from './rules'

// Types
export type {
  BaseRuleOptions,
  Boundary,
  CreateRuleConfig,
  ErrorParams,
  FormatRuleOptions,
  GlobalConfig,
  I18nConfig,
  LabelConfig,
  LabelTransform,
  MessageConfig,
  MessageTransform,
  NestedErrors,
  PathTransform,
  PreloadOptions,
  Range,
  RuleFactory,
  TranslationFunction,
  ValidationResult,
} from './types'
