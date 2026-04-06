// ==============================================================================
// VALIDEX — MAIN ENTRY POINT
// Re-exports all public APIs.
// ==============================================================================

// Zod type augmentation — must execute before any schema creation
import { initAugmentation } from './augmentation'

initAugmentation()

// Augmentation option types (for consumers typing chainable method options)
export type {
  CheckMethodOptions,
  CompositionMethodOptions,
  MaxConsecutiveOptions,
  MaxWordsOptions,
  MinWordsOptions,
} from './augmentation/types'

// Checks — Character Composition
export { hasDigits, hasLowercase, hasSpecial, hasUppercase } from './checks'

// Checks — Content Detection
export { containsEmail, containsHtml, containsPhoneNumber, containsUrl } from './checks'

// Checks — Character Restriction
export {
  onlyAlpha,
  onlyAlphanumeric,
  onlyAlphanumericSpaceHyphen,
  onlyAlphaSpaceHyphen,
  onlyNumeric,
} from './checks'

// Checks — Limits
export { maxConsecutive, maxWords, minWords, noSpaces } from './checks'

// Checks — Transforms
export { collapseWhitespace, emptyToUndefined, stripHtml, toSlug, toTitleCase } from './checks'

// Configuration
export { getConfig, preloadData, resetConfig, setup } from './config'

// Core utilities
export {
  createRule,
  getParams,
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
  CreateRuleOptions,
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
  RuleDefaults,
  RuleFactory,
  TranslationFunction,
  ValidationResult,
} from './types'

// Schema utilities
export { requiredWhen, sameAs } from './utilities'
