// ==============================================================================
// VALIDEX — MAIN ENTRY POINT
// Re-exports all public APIs.
// ==============================================================================

// Configuration
export { getConfig, preloadData, setup } from './config'

// Core utilities
export {
  createRule,
  getErrorMessage,
  getParams,
  MESSAGE_MAP,
  registerCustomError,
  registerMessages,
  validate,
} from './core'

// Internal utilities (for consumers building custom rules)
export type { ResolvedBoundary, ResolvedRange } from './internal'

// Data loader types (for consumers using data loaders)
export type { CardIssuer, CountryData, IbanPattern } from './loaders'

// Rules (re-export from rules barrel)
export {
  BusinessName,
  Color,
  Country,
  CreditCard,
  Currency,
  DateTime,
  Email,
  Iban,
  IpAddress,
  Jwt,
  LicenseKey,
  MacAddress,
  Password,
  PasswordConfirmation,
  PersonName,
  Phone,
  PostalCode,
  Slug,
  Text,
  Token,
  Url,
  Username,
  Uuid,
  VatNumber,
  Website,
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
