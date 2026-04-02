// ==============================================================================
// SHARED TYPES
// Core type definitions used across the validex library.
// ==============================================================================

import type { BusinessNameOptions } from './rules/businessName'
import type { ColorOptions } from './rules/color'
import type { CountryOptions } from './rules/country'
import type { CreditCardOptions } from './rules/creditCard'
import type { CurrencyOptions } from './rules/currency'
import type { DateTimeOptions } from './rules/dateTime'
import type { EmailOptions } from './rules/email'
import type { IbanOptions } from './rules/iban'
import type { IpAddressOptions } from './rules/ipAddress'
import type { JWTOptions } from './rules/jwt'
import type { LicenseKeyOptions } from './rules/licenseKey'
import type { MacAddressOptions } from './rules/macAddress'
import type { PasswordOptions } from './rules/password'
import type { PasswordConfirmationOptions } from './rules/passwordConfirmation'
import type { PersonNameOptions } from './rules/personName'
import type { PhoneOptions } from './rules/phone'
import type { PostalCodeOptions } from './rules/postalCode'
import type { SlugOptions } from './rules/slug'
import type { TextOptions } from './rules/text'
import type { TokenOptions } from './rules/token'
import type { URLOptions } from './rules/url'
import type { UsernameOptions } from './rules/username'
import type { UUIDOptions } from './rules/uuid'
import type { VatNumberOptions } from './rules/vatNumber'
import type { WebsiteOptions } from './rules/website'

/**
 * Range
 * Defines a numeric range constraint. A number means exact value.
 *
 * @returns number | object with min/max
 */
export type Range = number | { readonly min?: number, readonly max?: number }

/**
 * Boundary
 * Controls character restrictions at string start/end.
 * A string shorthand applies to both start and end.
 *
 * @returns string | object with start/end
 */
export type Boundary = 'alpha' | 'alphanumeric' | 'any' | {
  readonly start?: 'alpha' | 'alphanumeric' | 'any'
  readonly end?: 'alpha' | 'alphanumeric' | 'any'
}

// ----------------------------------------------------------
// RULE OPTION INTERFACES
// ----------------------------------------------------------

/**
 * BaseRuleOptions
 * Base options available on every validation rule.
 */
export interface BaseRuleOptions {
  /** Explicit label for error messages. */
  readonly label?: string
  /** Convert empty strings to undefined before validation. */
  readonly emptyToUndefined?: boolean
  /** Apply rule-specific normalization (trim, lowercase, etc.). */
  readonly normalize?: boolean
  /** Custom validation function that runs after all built-in checks. */
  readonly customFn?: (value: string) => true | string | Promise<true | string>
  /** Cross-field equality check. Field name that this field must match. */
  readonly sameAs?: string
  /** Conditional requirement. Field name — when that field has a value, this field becomes required. */
  readonly requiredWhen?: string
}

/**
 * FormatRuleOptions
 * Extended options for rules that support regex override.
 */
export interface FormatRuleOptions extends BaseRuleOptions {
  /** Override the built-in format pattern with a custom regex. */
  readonly regex?: RegExp
}

// ----------------------------------------------------------
// TRANSLATION AND TRANSFORM TYPES
// ----------------------------------------------------------

/**
 * TranslationFunction
 * A function that translates i18n keys to localized strings.
 *
 * @param key   - The i18n key to translate.
 * @param params - Interpolation parameters.
 * @returns The translated string.
 */
export type TranslationFunction = (key: string, params?: Record<string, unknown>) => string

/**
 * PathTransform
 * Transforms a field path array into a custom string format.
 *
 * @param path - The field path segments.
 * @returns The transformed path string.
 */
export type PathTransform = (path: ReadonlyArray<string | number>) => string

/**
 * LabelTransform
 * Transforms field labels for error messages.
 *
 * @param ctx - Context with path, fieldName, defaultLabel, and optional explicitLabel.
 * @returns The transformed label string.
 */
export type LabelTransform = (ctx: {
  readonly path: ReadonlyArray<string | number>
  readonly fieldName: string
  readonly defaultLabel: string
  readonly explicitLabel?: string
}) => string

/**
 * MessageTransform
 * Transforms error messages for custom formatting.
 *
 * @param ctx - Context with key, code, namespace, path, label, message, and params.
 * @returns The transformed message string.
 */
export type MessageTransform = (ctx: {
  readonly key: string
  readonly code: string
  readonly namespace: string
  readonly path: ReadonlyArray<string | number>
  readonly label: string
  readonly message: string
  readonly params: Record<string, unknown>
}) => string

// ----------------------------------------------------------
// CONFIGURATION TYPES
// ----------------------------------------------------------

/**
 * I18nConfig
 * Internationalization configuration.
 */
export interface I18nConfig {
  /** Enable i18n mode. When true, messages become i18n keys. */
  readonly enabled: boolean
  /** Key prefix for all i18n keys. */
  readonly prefix?: string
  /** Separator between key segments. */
  readonly separator?: string
  /** How field paths are encoded into message keys. */
  readonly pathMode?: 'semantic' | 'key' | 'full' | PathTransform
  /** Translation function for automatic message translation. */
  readonly t?: TranslationFunction
}

/**
 * LabelConfig
 * Label derivation configuration.
 */
export interface LabelConfig {
  /** How labels are derived when not explicitly provided. */
  readonly fallback?: 'derived' | 'generic' | 'none'
  /** Custom label transform function. */
  readonly transform?: LabelTransform
}

/**
 * MessageConfig
 * Message formatting configuration.
 */
export interface MessageConfig {
  /** Custom message transform function. */
  readonly transform?: MessageTransform
}

/**
 * RuleDefaults
 * Typed per-rule defaults for all 25 built-in rules. Keys are namespace
 * names (camelCase) matching each rule's `name` in createRule.
 */
export interface RuleDefaults {
  readonly email?: Partial<EmailOptions>
  readonly personName?: Partial<PersonNameOptions>
  readonly businessName?: Partial<BusinessNameOptions>
  readonly password?: Partial<PasswordOptions>
  readonly passwordConfirmation?: Partial<PasswordConfirmationOptions>
  readonly phone?: Partial<PhoneOptions>
  readonly website?: Partial<WebsiteOptions>
  readonly url?: Partial<URLOptions>
  readonly username?: Partial<UsernameOptions>
  readonly slug?: Partial<SlugOptions>
  readonly postalCode?: Partial<PostalCodeOptions>
  readonly licenseKey?: Partial<LicenseKeyOptions>
  readonly uuid?: Partial<UUIDOptions>
  readonly jwt?: Partial<JWTOptions>
  readonly dateTime?: Partial<DateTimeOptions>
  readonly token?: Partial<TokenOptions>
  readonly text?: Partial<TextOptions>
  readonly country?: Partial<CountryOptions>
  readonly currency?: Partial<CurrencyOptions>
  readonly color?: Partial<ColorOptions>
  readonly creditCard?: Partial<CreditCardOptions>
  readonly iban?: Partial<IbanOptions>
  readonly vatNumber?: Partial<VatNumberOptions>
  readonly macAddress?: Partial<MacAddressOptions>
  readonly ipAddress?: Partial<IpAddressOptions>
  /** Index signature for custom rules created with createRule. */
  readonly [key: string]: Partial<Record<string, unknown>> | undefined
}

/**
 * GlobalConfig
 * Top-level configuration for the validex library.
 */
export interface GlobalConfig {
  /** Internationalization settings. */
  readonly i18n: I18nConfig
  /** Label derivation settings. */
  readonly label?: LabelConfig
  /** Message formatting settings. */
  readonly message?: MessageConfig
  /** Global rule defaults (overrides built-in defaults). */
  readonly rules?: Partial<RuleDefaults>
}

/**
 * PreloadOptions
 * Options for preloading async data at startup.
 */
export interface PreloadOptions {
  /** Preload disposable email domain list. */
  readonly disposable?: boolean
  /** Preload common password lists. */
  readonly passwords?: boolean | 'basic' | 'moderate' | 'strict'
  /** Preload reserved username list. */
  readonly reserved?: boolean
  /** Preload phone number metadata variant. */
  readonly phone?: 'min' | 'mobile' | 'max'
  /** Preload country codes. */
  readonly countryCodes?: boolean
  /** Preload currency codes. */
  readonly currencyCodes?: boolean
  /** Preload IBAN patterns. */
  readonly ibanPatterns?: boolean
  /** Preload VAT patterns. */
  readonly vatPatterns?: boolean
  /** Preload credit card prefixes. */
  readonly creditCardPrefixes?: boolean
  /** Preload postal code validation module. */
  readonly postalCodes?: boolean
}

// ----------------------------------------------------------
// VALIDATION RESULT
// ----------------------------------------------------------

/**
 * NestedErrors
 * Recursive type for nested error objects matching schema shape.
 */
export interface NestedErrors {
  readonly [field: string]: readonly string[] | NestedErrors
}

/**
 * ValidationResult
 * Result of running validate() on a schema and data.
 */
export interface ValidationResult<T> {
  /** Whether validation passed. */
  readonly success: boolean
  /** Typed parsed data, only populated when success is true. */
  readonly data?: T
  /** Flat dot-path to all error messages per field. */
  readonly errors: Record<string, readonly string[]>
  /** Flat dot-path to first error message per field. */
  readonly firstErrors: Record<string, string>
  /** Nested error object matching schema shape. */
  readonly nestedErrors: NestedErrors
  /** Raw Zod issues (escape hatch). */
  readonly issues: ReadonlyArray<unknown>
}

// ----------------------------------------------------------
// RULE FACTORY TYPES
// ----------------------------------------------------------

/**
 * CreateRuleOptions
 * Configuration object passed to the createRule factory.
 */
export interface CreateRuleOptions<T extends BaseRuleOptions> {
  /** Namespace for error codes (e.g., 'email', 'password'). */
  readonly name: string
  /** Tier 1 defaults for this rule. */
  readonly defaults: Partial<T>
  /** Builder function that constructs the Zod schema from resolved options. */
  readonly build: (opts: T) => unknown
  /** English message templates keyed by error code. */
  readonly messages: Readonly<Record<string, string>>
}

/**
 * RuleFactory
 * The function returned by createRule. Accepts per-call options and returns a Zod schema.
 */
export type RuleFactory<T extends BaseRuleOptions> = (options?: Partial<T>) => unknown

/**
 * ErrorParams
 * Normalized error parameters extracted from a Zod issue by getParams().
 */
export interface ErrorParams {
  /** The validex error code. */
  readonly code: string
  /** The error namespace. */
  readonly namespace: string
  /** The resolved field label. */
  readonly label: string
  /** i18n key for the label (only in i18n mode). */
  readonly labelKey?: string
  /** Full i18n key for the message. */
  readonly key: string
  /** Field path as array. */
  readonly path: ReadonlyArray<string | number>
  /** Additional interpolation parameters. */
  readonly [param: string]: unknown
}
