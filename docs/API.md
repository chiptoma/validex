# API Reference

Complete reference for the validex public API. Every option, default value, and error code listed here is sourced directly from the codebase.

---

## Table of Contents

- [Configuration](#configuration)
  - [`setup(config?)`](#setupconfig)
  - [`validate(schema, data)`](#validateschema-data)
  - [`preloadData(options)`](#preloaddataoptions)
  - [`getConfig()`](#getconfig)
  - [`getParams(issue)`](#getparamsissue)
  - [`createRule(config)`](#createruleconfig)
- [Rules](#rules)
  - [BusinessName](#businessnameoptions)
  - [Color](#coloroptions)
  - [Country](#countryoptions)
  - [CreditCard](#creditcardoptions)
  - [Currency](#currencyoptions)
  - [DateTime](#datetimeoptions)
  - [Email](#emailoptions)
  - [Iban](#ibanoptions)
  - [IpAddress](#ipaddressoptions)
  - [Jwt](#jwtoptions)
  - [LicenseKey](#licensekeyoptions)
  - [MacAddress](#macaddressoptions)
  - [Password](#passwordoptions)
  - [PasswordConfirmation](#passwordconfirmationoptions)
  - [PersonName](#personnameoptions)
  - [Phone](#phoneoptions)
  - [PostalCode](#postalcodeoptions)
  - [Slug](#slugoptions)
  - [Text](#textoptions)
  - [Token](#tokenoptions)
  - [Url](#urloptions)
  - [Username](#usernameoptions)
  - [Uuid](#uuidoptions)
  - [VatNumber](#vatnumberoptions)
  - [Website](#websiteoptions)
- [Checks (`@validex/core/checks`)](#checks-validexcorechecks)
- [Chainable Methods](#chainable-methods)
- [Utilities (`@validex/core/utilities`)](#utilities-validexcoreutilities)
  - [`sameAs`](#sameas)
  - [`requiredWhen`](#requiredwhen)
- [Adapters](#adapters)
  - [Nuxt (`@validex/nuxt`)](#nuxt-validexnuxt)
  - [Fastify (`@validex/fastify`)](#fastify-validexfastify)
- [Bundle Sizes](#bundle-sizes)
- [Types](#types)

---

## Configuration

### `configure(config)`

Deep-merges the given configuration into the current global config. Can be called multiple times — each call merges with existing config, never replaces. Unlike `setup()`, this does not register the Zod customError handler.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `config` | `Partial<GlobalConfig>` | Yes | Partial configuration to merge. |

**Returns:** `void`

---

### `setup(config?)`

Configures validex globally. Deep-merges with existing config when called multiple times.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `config` | `Partial<GlobalConfig>` | No | Configuration to apply. |

**`GlobalConfig` interface:**

```ts
interface GlobalConfig {
  readonly i18n: I18nConfig
  readonly label?: LabelConfig
  readonly message?: MessageConfig
  readonly rules?: Partial<Record<string, Record<string, unknown>>>
}
```

**`I18nConfig` interface:**

```ts
interface I18nConfig {
  readonly enabled: boolean
  readonly prefix?: string           // Default: 'validation'
  readonly separator?: string        // Default: '.'
  readonly pathMode?: 'semantic' | 'key' | 'full' | PathTransform
  readonly t?: TranslationFunction
}
```

- `enabled` -- When `true`, activates i18n mode.
- `prefix` -- Key prefix for all i18n keys (default: `'validation'`).
- `separator` -- Separator between key segments (default: `'.'`).
- `pathMode` -- How field paths are encoded into message keys (default: `'semantic'`). See path mode table below.
- `t` -- Translation function. When provided, validex calls `t(key, params)` to produce error messages instead of using English templates. Labels are also translated via `t(labelKey)` unless an explicit label or `label.transform` is set.

**Behavior by mode:**

| `enabled` | `t` provided | Error messages | Labels |
| --- | --- | --- | --- |
| `false` | -- | English from `en.json` | Path-derived or explicit |
| `true` | No | Raw i18n key (e.g. `validation.messages.email.invalid`) | Path-derived or explicit |
| `true` | Yes | `t(key, params)` return value | `t(labelKey)` or explicit |

For the complete translation guide with all error codes and a ready-to-copy template, see [Translation Guide](./I18N.md).

**`LabelConfig` interface:**

```ts
interface LabelConfig {
  readonly fallback?: 'derived' | 'generic' | 'none'
  readonly transform?: LabelTransform
}
```

- `fallback` -- How labels are derived when not explicitly provided (default: `'derived'`).
- `transform` -- Custom label transform function. When configured, called with `{ path, fieldName, defaultLabel }` and its return value is used as the label. Takes priority over `i18n.t()` for label resolution.

**Label priority chain** (highest to lowest):

1. Explicit `label` option on the rule (e.g. `Email({ label: 'Work Email' })`)
2. `label.transform()` return value (if configured)
3. `i18n.t(labelKey)` return value (if i18n enabled with `t()`)
4. Path derivation (camelCase to Title Case)

**`MessageConfig` interface:**

```ts
interface MessageConfig {
  readonly transform?: MessageTransform
}
```

- `transform` -- Post-processing function for error messages. Called with `{ key, code, namespace, path, label, message, params }` after message resolution (whether from `t()`, raw key, or English interpolation). Its return value becomes the final error message.

**Example:**

```ts
import { setup } from '@validex/core'

setup({
  rules: {
    email: { blockDisposable: true },
    password: { length: { min: 10 }, special: { min: 2 } },
  },
  i18n: {
    enabled: true,
    t: (key, params) => i18next.t(key, params),
  },
  label: {
    fallback: 'derived',
    transform: ({ defaultLabel }) => defaultLabel,
  },
  message: {
    transform: ({ code, message }) => `[${code}] ${message}`,
  },
})
```

---

### `resetConfig()`

Resets the global configuration back to the built-in defaults, discarding any changes from `setup()` or `configure()`.

**Returns:** `void`

---

### `validate(schema, data)`

Runs `safeParseAsync` on a Zod schema and returns a structured `ValidationResult`.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `schema` | `z.ZodType` | Yes | The Zod schema to validate against. |
| `data` | `unknown` | Yes | The data to validate. |

**Returns:** `Promise<ValidationResult<T>>`

**`ValidationResult<T>` interface:**

```ts
interface ValidationResult<T> {
  readonly success: boolean
  readonly data?: T
  readonly errors: Record<string, readonly string[]>
  readonly firstErrors: Record<string, string>
  readonly nestedErrors: NestedErrors
  readonly issues: ReadonlyArray<unknown>
}
```

- `success` -- Whether validation passed.
- `data` -- Typed parsed data, only populated when `success` is `true`.
- `errors` -- Flat dot-path to all error messages per field.
- `firstErrors` -- Flat dot-path to first error message per field.
- `nestedErrors` -- Nested error object matching schema shape.
- `issues` -- Raw Zod issues (escape hatch).

**Example:**

```ts
import { z } from 'zod'
import { Email, Password, validate } from '@validex/core'

const schema = z.object({
  email: Email(),
  password: Password(),
})

const result = await validate(schema, {
  email: 'user@example.com',
  password: 'Str0ng!Pass',
})

if (result.success) {
  console.log(result.data)
} else {
  console.log(result.errors)
  console.log(result.firstErrors)
}
```

---

### `preloadData(options)`

Preloads async data files at startup so that sync `.parse()` works everywhere. Safe to call multiple times -- already-loaded data is cached.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `options` | `PreloadOptions` | Yes | Which data files to preload. |

**Returns:** `Promise<void>`

**`PreloadOptions` interface:**

```ts
interface PreloadOptions {
  readonly disposable?: boolean
  readonly passwords?: boolean | 'basic' | 'moderate' | 'strict'
  readonly reserved?: boolean
  readonly phone?: 'min' | 'mobile' | 'max'
  readonly countryCodes?: boolean
  readonly currencyCodes?: boolean
  readonly ibanPatterns?: boolean
  readonly vatPatterns?: boolean
  readonly creditCardPrefixes?: boolean
  readonly postalCodes?: boolean
}
```

| Option | Type | Description |
| --- | --- | --- |
| `disposable` | `boolean` | Preload disposable email domain list. |
| `passwords` | `boolean \| 'basic' \| 'moderate' \| 'strict'` | Preload common password lists. |
| `reserved` | `boolean` | Preload reserved username list. |
| `phone` | `'min' \| 'mobile' \| 'max'` | Preload phone number metadata variant. |
| `countryCodes` | `boolean` | Preload country codes. |
| `currencyCodes` | `boolean` | Preload currency codes. |
| `ibanPatterns` | `boolean` | Preload IBAN patterns. |
| `vatPatterns` | `boolean` | Preload VAT patterns. |
| `creditCardPrefixes` | `boolean` | Preload credit card prefixes. |
| `postalCodes` | `boolean` | Preload postal code validation module. |

**Example:**

```ts
import { preloadData } from '@validex/core'

await preloadData({
  disposable: true,
  passwords: 'strict',
  phone: 'mobile',
})
```

---

### `getConfig()`

Returns the current global configuration as a readonly object.

**Returns:** `Readonly<GlobalConfig>`

**Example:**

```ts
import { getConfig } from '@validex/core'

const config = getConfig()
console.log(config.i18n.enabled)
```

---

### `getParams(issue)`

Extracts structured `ErrorParams` from a Zod issue. Useful for i18n integrations and custom error rendering.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `issue` | Zod issue object | Yes | A Zod issue with optional `params`, `path`, `code`, etc. |

**Returns:** `ErrorParams`

**`ErrorParams` interface:**

```ts
interface ErrorParams {
  readonly code: string
  readonly namespace: string
  readonly label: string
  readonly labelKey?: string        // Only populated in i18n mode
  readonly key: string              // Full i18n key (e.g. 'validation.messages.email.invalid')
  readonly path: ReadonlyArray<string | number>
  readonly [param: string]: unknown // Additional interpolation parameters
}
```

**Example:**

```ts
import { getParams } from '@validex/core'

const params = getParams(zodIssue)
// { code: 'invalid', namespace: 'email', label: 'Email', key: 'validation.messages.email.invalid', path: ['email'] }
```

---

### `createRule(config)`

Factory function for building custom validation rules with three-tier option merge, `emptyToUndefined` preprocessing, and optional `customFn`.

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `config` | `CreateRuleOptions<T>` | Yes | The rule configuration object. |

**Returns:** `RuleFactory<T>` -- A function that accepts per-call `Partial<T>` options and returns a Zod schema.

**`CreateRuleOptions<T>` interface:**

```ts
interface CreateRuleOptions<T extends BaseRuleOptions> {
  readonly name: string
  readonly defaults: Partial<T>
  readonly build: (opts: T) => unknown
  readonly messages: Readonly<Record<string, string>>
}
```

- `name` -- Namespace for error codes (e.g. `'email'`, `'password'`). Cannot use reserved namespaces: `base`, `string`, `confirmation`.
- `defaults` -- Tier 1 defaults for this rule.
- `build` -- Builder function that receives resolved options and returns a Zod schema.
- `messages` -- English message templates keyed by error code. Supports `{{param}}` interpolation.

**Three-tier merge order:**
1. Built-in defaults (from `RULE_DEFAULTS` + `config.defaults`)
2. Global config (from `setup({ rules: { ... } })`)
3. Per-call options

**Example:**

```ts
import { createRule } from '@validex/core'
import { z } from 'zod'

interface HexColorOptions {
  label?: string
  emptyToUndefined?: boolean
  normalize?: boolean
  customFn?: (value: string) => true | string | Promise<true | string>
  allowAlpha?: boolean
}

const HexColor = createRule<HexColorOptions>({
  name: 'hexColor',
  defaults: { allowAlpha: false },
  build: (opts) => {
    const pattern = opts.allowAlpha
      ? /^#[\da-f]{6,8}$/i
      : /^#[\da-f]{6}$/i
    return z.string().regex(pattern)
  },
  messages: {
    invalid: '{{label}} is not a valid hex color',
  },
})

const schema = HexColor({ allowAlpha: true })
schema.parse('#ff00aacc') // OK
```

---

## Rules

All 25 rules are listed alphabetically. Every rule extends either `BaseRuleOptions` or `FormatRuleOptions`.

**`BaseRuleOptions` (available on every rule):**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `label` | `string` | `undefined` | Explicit label for error messages. |
| `emptyToUndefined` | `boolean` | `true` | Convert empty strings to `undefined` before validation. |
| `normalize` | `boolean` | `true` | Apply rule-specific normalization (trim, lowercase, etc.). |
| `customFn` | `(value: string) => true \| string \| Promise<true \| string>` | `undefined` | Custom validation that runs after all built-in checks. |

**`FormatRuleOptions` (extends `BaseRuleOptions`):**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `regex` | `RegExp` | `undefined` | Override the built-in format pattern with a custom regex. |

**Rules supporting `regex`:** PersonName, BusinessName, Username, Slug, PostalCode, LicenseKey, Token, Text

**Shared type definitions:**

- `Range = number | { min?: number, max?: number }` -- A number means exact value; an object means range.
- `Boundary = 'alpha' | 'alphanumeric' | 'any' | { start?: ..., end?: ... }` -- String shorthand applies to both start and end.

---

### `BusinessName(options?)`

**Description:** Validates company/organization names with boundary and consecutive character limits.

**Extends:** `FormatRuleOptions`

**Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `length` | `Range` | `{ min: 2, max: 100 }` | Length constraint. |
| `extraChars` | `string` | `undefined` | Additional allowed characters. |
| `disallowChars` | `string` | `undefined` | Characters to disallow. |
| `boundary` | `Boundary` | `'alphanumeric'` | Character restrictions at string start/end. |
| `consecutive` | `Range` | `{ max: 4 }` | Maximum consecutive identical characters. |
| `titleCase` | `boolean` | `false` | Transform output to title case. |

**Default characters:** Letters, digits, spaces, `&`, `.`, `,`, `-`, `'`, `()`

**Normalization:** trim only

**Error Codes:**

| Code | Message | Params |
| --- | --- | --- |
| `businessName.invalid` | `{{label}} is not a valid business name` | `label` |
| `businessName.boundary` | `{{label}} must start and end with an alphanumeric character` | `label` |
| `businessName.maxConsecutive` | `{{label}} must not repeat the same character more than {{maximum}} times` | `label`, `maximum` |

**Example:**

```ts
import { BusinessName } from '@validex/core'

const schema = BusinessName({ length: { min: 3, max: 50 } })
schema.parse('Acme Corp') // OK
```

---

### `Color(options?)`

**Description:** Validates color values in hex, RGB, HSL, or any format.

**Extends:** `BaseRuleOptions`

**Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `format` | `'hex' \| 'rgb' \| 'hsl' \| 'any'` | `'hex'` | Color format to validate. |
| `alpha` | `boolean` | `true` | Allow alpha channel values. |

**Normalization:** lowercase + trim

**Error Codes:**

| Code | Message | Params |
| --- | --- | --- |
| `color.invalid` | `{{label}} is not a valid color` | `label` |

**Example:**

```ts
import { Color } from '@validex/core'

const schema = Color({ format: 'hex', alpha: false })
schema.parse('#ff00aa') // OK
```

---

### `Country(options?)`

**Description:** Validates ISO 3166 country codes.

**Extends:** `BaseRuleOptions`

**Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `format` | `'alpha2' \| 'alpha3'` | `'alpha2'` | Country code format. |
| `allowCountries` | `string[]` | `[]` | Only allow these country codes (empty = all). |
| `blockCountries` | `string[]` | `[]` | Block these country codes. |

**Normalization:** uppercase + trim

**Error Codes:**

| Code | Message | Params |
| --- | --- | --- |
| `country.invalid` | `{{label}} is not a valid country code` | `label` |
| `country.blocked` | `Country '{{country}}' is not allowed` | `country` |
| `country.notAllowed` | `Country '{{country}}' is not in the allowed list` | `country` |

**Example:**

```ts
import { Country } from '@validex/core'

const schema = Country({ format: 'alpha2', allowCountries: ['US', 'CA', 'GB'] })
schema.parse('US') // OK
```

---

### `CreditCard(options?)`

**Description:** Validates credit card numbers with Luhn check and issuer detection.

**Extends:** `BaseRuleOptions`

**Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `allowIssuers` | `IssuerType[]` | `undefined` (all) | Only allow these card issuers. |
| `blockIssuers` | `IssuerType[]` | `undefined` | Block these card issuers. |

**`IssuerType`:** `'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'unionpay'`

`allowIssuers` takes precedence over `blockIssuers` if both are provided.

**Normalization:** trim + strip spaces/dashes

**Error Codes:**

| Code | Message | Params |
| --- | --- | --- |
| `creditCard.invalid` | `{{label}} is not a valid credit card number` | `label` |
| `creditCard.issuerNotAllowed` | `Card issuer '{{issuer}}' is not in the allowed list` | `issuer` |
| `creditCard.issuerBlocked` | `Card issuer '{{issuer}}' is not allowed` | `issuer` |

**Example:**

```ts
import { CreditCard } from '@validex/core'

const schema = CreditCard({ allowIssuers: ['visa', 'mastercard'] })
schema.parse('4111111111111111') // OK (Visa)
```

---

### `Currency(options?)`

**Description:** Validates ISO 4217 currency codes.

**Extends:** `BaseRuleOptions`

**Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `allowCurrencies` | `string[]` | `[]` | Only allow these currency codes (empty = all). |
| `blockCurrencies` | `string[]` | `[]` | Block these currency codes. |

**Normalization:** uppercase + trim

**Error Codes:**

| Code | Message | Params |
| --- | --- | --- |
| `currency.invalid` | `{{label}} is not a valid currency code` | `label` |
| `currency.blocked` | `Currency '{{currency}}' is not allowed` | `currency` |
| `currency.notAllowed` | `Currency '{{currency}}' is not in the allowed list` | `currency` |

**Example:**

```ts
import { Currency } from '@validex/core'

const schema = Currency({ allowCurrencies: ['USD', 'EUR', 'GBP'] })
schema.parse('USD') // OK
```

---

### `DateTime(options?)`

**Description:** Validates date/time strings with format and range constraints.

**Extends:** `BaseRuleOptions`

**Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `format` | `'iso' \| 'date' \| 'time'` | `'iso'` | Date/time format to validate. |
| `min` | `Date \| string` | `undefined` | Earliest allowed date. |
| `max` | `Date \| string` | `undefined` | Latest allowed date. |
| `allowFuture` | `boolean` | `true` | Allow future dates. |
| `allowPast` | `boolean` | `true` | Allow past dates. |
| `allowOffset` | `boolean` | `true` | Allow timezone offsets. |
| `allowLocal` | `boolean` | `false` | Allow local (non-UTC) dates. |
| `precision` | `number` | `undefined` | Sub-second precision: `0` = seconds, `3` = milliseconds, `6` = microseconds, `undefined` = any. |

**Normalization:** trim

**Error Codes:**

| Code | Message | Params |
| --- | --- | --- |
| `dateTime.invalid` | `{{label}} is not a valid date` | `label` |
| `dateTime.tooEarly` | `{{label}} must be after {{minimum}}` | `label`, `minimum` |
| `dateTime.tooLate` | `{{label}} must be before {{maximum}}` | `label`, `maximum` |
| `dateTime.noFuture` | `{{label}} must not be in the future` | `label` |
| `dateTime.noPast` | `{{label}} must not be in the past` | `label` |

**Example:**

```ts
import { DateTime } from '@validex/core'

const schema = DateTime({ format: 'iso', allowFuture: false })
schema.parse('2024-01-15T10:30:00Z') // OK if not in the future
```

---

### `Email(options?)`

**Description:** Validates email addresses with domain filtering, plus-alias blocking, and disposable detection.

**Extends:** `BaseRuleOptions`

**Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `length` | `Range` | `{ max: 254 }` | Maximum email length. |
| `blockPlusAlias` | `boolean` | `false` | Block plus-alias addresses (e.g. `user+tag@example.com`). |
| `blockDomains` | `string[]` | `[]` | Block specific email domains. |
| `allowDomains` | `string[]` | `[]` | Only allow specific email domains (empty = all). |
| `blockDisposable` | `boolean` | `false` | Block disposable/temporary email providers. Async -- requires `parseAsync`. |
| `allowSubdomains` | `boolean` | `true` | Allow subdomain email addresses. |

**Dependency:** `disposable-email-domains-js` (dynamic import, only when `blockDisposable: true`)

**Normalization:** lowercase + trim

**Error Codes:**

| Code | Message | Params |
| --- | --- | --- |
| `email.invalid` | `{{label}} is not a valid email address` | `label` |
| `email.disposableBlocked` | `Disposable email addresses are not allowed` | -- |
| `email.plusAliasBlocked` | `Plus alias email addresses are not allowed` | -- |
| `email.domainBlocked` | `Email domain '{{domain}}' is not allowed` | `domain` |
| `email.domainNotAllowed` | `Email domain '{{domain}}' is not in the allowed list` | `domain` |
| `email.subdomainNotAllowed` | `Subdomain email addresses are not allowed` | -- |

**Example:**

```ts
import { Email } from '@validex/core'

const schema = Email({
  blockDisposable: true,
  blockPlusAlias: true,
  allowDomains: ['company.com'],
})
schema.parse('user@company.com') // OK
```

---

### `Iban(options?)`

**Description:** Validates International Bank Account Numbers with country-specific patterns.

**Extends:** `BaseRuleOptions`

**Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `allowCountries` | `string[]` | `[]` | Only allow IBANs from these countries (empty = all). |
| `blockCountries` | `string[]` | `[]` | Block IBANs from these countries. |

**Normalization:** uppercase + trim + strip spaces

**Error Codes:**

| Code | Message | Params |
| --- | --- | --- |
| `iban.invalid` | `{{label}} is not a valid IBAN` | `label` |
| `iban.countryBlocked` | `IBANs from '{{country}}' are not allowed` | `country` |
| `iban.countryNotAllowed` | `IBANs from '{{country}}' are not in the allowed list` | `country` |

**Example:**

```ts
import { Iban } from '@validex/core'

const schema = Iban({ allowCountries: ['DE', 'FR', 'GB'] })
schema.parse('DE89370400440532013000') // OK
```

---

### `IpAddress(options?)`

**Description:** Validates IPv4 and IPv6 addresses with optional CIDR notation.

**Extends:** `BaseRuleOptions`

**Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `version` | `'v4' \| 'v6' \| 'any'` | `'any'` | IP version to validate. |
| `allowCidr` | `boolean` | `false` | Allow CIDR notation (e.g. `192.168.1.0/24`). |
| `allowPrivate` | `boolean` | `true` | Allow private/reserved IP addresses. |

**Normalization:** trim

**Error Codes:**

| Code | Message | Params |
| --- | --- | --- |
| `ipAddress.invalid` | `{{label}} is not a valid IP address` | `label` |
| `ipAddress.privateNotAllowed` | `Private IP addresses are not allowed` | -- |

**Example:**

```ts
import { IpAddress } from '@validex/core'

const schema = IpAddress({ version: 'v4', allowPrivate: false })
schema.parse('8.8.8.8') // OK
```

---

### `Jwt(options?)`

**Description:** Validates JSON Web Token structure with optional expiry and claim checks.

**Extends:** `BaseRuleOptions`

**Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `requireExpiry` | `boolean` | `false` | Require `exp` claim in the payload. |
| `checkExpiry` | `boolean` | `false` | Reject expired tokens. |
| `checkNotBefore` | `boolean` | `false` | Reject tokens not yet valid (`nbf` claim). |
| `clockTolerance` | `number` | `0` | Tolerance in seconds for `checkExpiry` / `checkNotBefore`. |
| `requireClaims` | `string[]` | `undefined` | Required claim names in the payload. |
| `allowAlgorithms` | `string[]` | `undefined` | Allowed signing algorithms in the header. |

`clockTolerance` only applies when `checkExpiry` or `checkNotBefore` is `true`.

**Normalization:** trim

**Error Codes:**

| Code | Message | Params |
| --- | --- | --- |
| `jwt.invalid` | `{{label}} is not a valid JWT` | `label` |
| `jwt.expired` | `This token has expired` | -- |
| `jwt.notYetValid` | `This token is not yet valid` | -- |
| `jwt.missingClaim` | `Required claim '{{claim}}' is missing` | `claim` |
| `jwt.algorithmNotAllowed` | `Algorithm '{{algorithm}}' is not allowed` | `algorithm` |

**Example:**

```ts
import { Jwt } from '@validex/core'

const schema = Jwt({ checkExpiry: true, requireClaims: ['sub', 'iat'] })
schema.parse('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...') // OK if valid and not expired
```

---

### `LicenseKey(options?)`

**Description:** Validates software license key formats with configurable segments, separators, and character sets.

**Extends:** `FormatRuleOptions`

**Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | `'windows' \| 'uuid' \| 'custom'` | `'custom'` | Preset key format or custom. |
| `segments` | `number` | `5` | Number of segments. |
| `segmentLength` | `number` | `5` | Characters per segment. |
| `separator` | `string` | `'-'` | Character between segments. |
| `charset` | `'alphanumeric' \| 'alpha' \| 'numeric' \| 'hex'` | `'alphanumeric'` | Allowed characters per segment. |

**Normalization:** uppercase + trim

**Error Codes:**

| Code | Message | Params |
| --- | --- | --- |
| `licenseKey.invalid` | `{{label}} is not a valid license key` | `label` |

**Example:**

```ts
import { LicenseKey } from '@validex/core'

const schema = LicenseKey({ type: 'custom', segments: 4, segmentLength: 4, charset: 'hex' })
schema.parse('A1B2-C3D4-E5F6-7890') // OK
```

---

### `MacAddress(options?)`

**Description:** Validates MAC addresses with configurable delimiter.

**Extends:** `BaseRuleOptions`

**Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `delimiter` | `':' \| '-' \| 'none'` | `':'` | Delimiter between octets. |

**Normalization:** trim

**Error Codes:**

| Code | Message | Params |
| --- | --- | --- |
| `macAddress.invalid` | `{{label}} is not a valid MAC address` | `label` |

**Example:**

```ts
import { MacAddress } from '@validex/core'

const schema = MacAddress({ delimiter: ':' })
schema.parse('00:1A:2B:3C:4D:5E') // OK
```

---

### `Password(options?)`

**Description:** Validates password strength with length, character class, consecutive character, and common password rules.

**Extends:** `BaseRuleOptions` (note: `normalize` default is `false`)

**Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `length` | `Range` | `{ min: 8, max: 128 }` | Password length range. |
| `uppercase` | `Range` | `{ min: 1 }` | Required uppercase letter count. |
| `lowercase` | `Range` | `{ min: 1 }` | Required lowercase letter count. |
| `digits` | `Range` | `{ min: 1 }` | Required digit count. |
| `special` | `Range` | `{ min: 1 }` | Required special character count. |
| `consecutive` | `Range` | `{ max: 3 }` | Maximum consecutive identical characters. |
| `blockCommon` | `boolean \| 'basic' \| 'moderate' \| 'strict'` | `false` | Block common passwords. Async -- requires `parseAsync`. |

**`blockCommon` tiers:**
- `true` or `'basic'` = top 100 passwords
- `'moderate'` = top 1,000
- `'strict'` = top 10,000

Password lists sourced from [SecLists](https://github.com/danielmiessler/SecLists) (MIT license), derived from real breach data (RockYou, LinkedIn, Adobe, etc.).

**Normalization:** trim only

**Error Codes:**

| Code | Message | Params |
| --- | --- | --- |
| `password.minUppercase` | `{{label}} must have at least {{minimum}} uppercase characters` | `label`, `minimum` |
| `password.minLowercase` | `{{label}} must have at least {{minimum}} lowercase characters` | `label`, `minimum` |
| `password.minDigits` | `{{label}} must have at least {{minimum}} digits` | `label`, `minimum` |
| `password.minSpecial` | `{{label}} must have at least {{minimum}} special characters` | `label`, `minimum` |
| `password.maxUppercase` | `{{label}} must have at most {{maximum}} uppercase characters` | `label`, `maximum` |
| `password.maxConsecutive` | `{{label}} must not have more than {{maximum}} consecutive identical characters` | `label`, `maximum` |
| `password.commonBlocked` | `This password is too common` | -- |

**Example:**

```ts
import { Password } from '@validex/core'

const schema = Password({
  length: { min: 10 },
  uppercase: { min: 2 },
  blockCommon: 'strict',
})
schema.parse('ABcdefgh1!') // OK
```

---

### `PasswordConfirmation(options?)`

**Description:** Confirms that a password confirmation field matches the password field via cross-field comparison.

**Extends:** `BaseRuleOptions`

**Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `passwordField` | `string` | `'password'` | Name of the password field to compare against. |

**Normalization:** trim

**Error Codes:**

| Code | Message | Params |
| --- | --- | --- |
| `confirmation.mismatch` | `Passwords must match` | -- |

**Example:**

```ts
import { z } from 'zod'
import { Password, PasswordConfirmation, validate } from '@validex/core'

const schema = z.object({
  password: Password(),
  passwordConfirmation: PasswordConfirmation(),
})

const result = await validate(schema, {
  password: 'Str0ng!Pass',
  passwordConfirmation: 'Str0ng!Pass',
})
```

---

### `PersonName(options?)`

**Description:** Validates human names with unicode support, word count limits, and boundary rules.

**Extends:** `FormatRuleOptions`

**Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `length` | `Range` | `{ min: 2, max: 50 }` | Name length range. |
| `words` | `Range` | `{ max: 5 }` | Maximum word count. |
| `allowUnicode` | `boolean` | `true` | Allow unicode characters (accented letters, etc.). |
| `extraChars` | `string` | `undefined` | Additional allowed characters. |
| `disallowChars` | `string` | `undefined` | Characters to disallow. |
| `boundary` | `Boundary` | `'alpha'` | Character restrictions at string start/end. |
| `consecutive` | `Range` | `{ max: 3 }` | Maximum consecutive identical characters. |
| `titleCase` | `boolean` | `false` | Transform output to title case. |

**Default characters:** Letters (+ unicode), spaces, hyphens, apostrophes

**Normalization:** trim only

**Error Codes:**

| Code | Message | Params |
| --- | --- | --- |
| `personName.invalid` | `{{label}} is not a valid name` | `label` |
| `personName.maxWords` | `{{label}} must have at most {{maximum}} words` | `label`, `maximum` |
| `personName.boundary` | `{{label}} must start and end with a letter` | `label` |
| `personName.maxConsecutive` | `{{label}} must not repeat the same character more than {{maximum}} times` | `label`, `maximum` |

**Example:**

```ts
import { PersonName } from '@validex/core'

const schema = PersonName({ words: { max: 3 }, titleCase: true })
schema.parse('John Doe') // OK
```

---

### `Phone(options?)`

**Description:** Validates international phone numbers via `libphonenumber-js`.

**Extends:** `BaseRuleOptions`

**Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `metadata` | `'min' \| 'mobile' \| 'max' \| 'custom'` | `'min'` | Phone metadata variant to use. |
| `customMetadataPath` | `string` | `undefined` | Path to custom metadata file (when `metadata: 'custom'`). |
| `country` | `string` | `undefined` | Default country code for parsing. |
| `allowCountries` | `string[]` | `[]` | Only allow phone numbers from these countries (empty = all). |
| `blockCountries` | `string[]` | `[]` | Block phone numbers from these countries. |
| `requireMobile` | `boolean` | `false` | Require mobile phone numbers only. |
| `requireCountryCode` | `boolean` | `false` | Require international country code prefix. |
| `format` | `'e164' \| 'international' \| 'national'` | `'e164'` | Output format for normalization. |

**Config constraint:** `requireMobile: true` with `metadata: 'min'` throws a config error (mobile detection requires `'mobile'` or `'max'` metadata).

**Dependency:** `libphonenumber-js/core` + bundled metadata

**Normalization:** trim + strip formatting (libphonenumber handles)

**Error Codes:**

| Code | Message | Params |
| --- | --- | --- |
| `phone.invalid` | `{{label}} is not a valid phone number` | `label` |
| `phone.requireMobile` | `{{label}} must be a mobile phone number` | `label` |
| `phone.countryBlocked` | `Phone numbers from '{{country}}' are not allowed` | `country` |
| `phone.countryNotAllowed` | `Phone numbers from '{{country}}' are not in the allowed list` | `country` |

**Example:**

```ts
import { Phone } from '@validex/core'

const schema = Phone({
  requireMobile: true,
  metadata: 'mobile',
  allowCountries: ['US', 'CA'],
})
schema.parse('+14155552671') // OK
```

---

### `PostalCode(options?)`

**Description:** Validates country-aware postal/ZIP codes.

**Extends:** `FormatRuleOptions`

**Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `country` | `string` | **REQUIRED** | ISO 3166 country code. |

**Dependency:** `postcode-validator` (synchronous, supports 200+ countries)

If the country is unsupported, a config error is thrown at schema creation time. Use `regex` or `customFn` as an escape hatch.

**Normalization:** uppercase + trim

**Error Codes:**

| Code | Message | Params |
| --- | --- | --- |
| `postalCode.invalid` | `{{label}} is not a valid postal code` | `label` |

**Example:**

```ts
import { PostalCode } from '@validex/core'

const schema = PostalCode({ country: 'US' })
schema.parse('90210') // OK
```

---

### `Slug(options?)`

**Description:** Validates URL-safe slugs (lowercase alphanumeric with hyphens).

**Extends:** `FormatRuleOptions`

**Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `length` | `Range` | `{ min: 3, max: 100 }` | Slug length range. |
| `extraChars` | `string` | `undefined` | Additional allowed characters. |

**Pattern:** `[a-z0-9]+(-[a-z0-9]+)*` -- boundaries enforced by pattern

**Normalization:** lowercase + trim

**Error Codes:**

| Code | Message | Params |
| --- | --- | --- |
| `slug.invalid` | `{{label}} is not a valid slug` | `label` |

**Example:**

```ts
import { Slug } from '@validex/core'

const schema = Slug({ length: { min: 5, max: 80 } })
schema.parse('my-awesome-post') // OK
```

---

### `Text(options?)`

**Description:** Validates free text with length, word count, content detection, and regex override.

**Extends:** `FormatRuleOptions`

**Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `length` | `Range` | `undefined` | Text length constraint. |
| `words` | `Range` | `undefined` | Word count constraint. |
| `consecutive` | `Range` | `undefined` | Maximum consecutive identical characters. |
| `noEmails` | `boolean` | `false` | Reject text containing email addresses. |
| `noUrls` | `boolean` | `false` | Reject text containing URLs. |
| `noPhoneNumbers` | `boolean` | `false` | Reject text containing phone numbers. |
| `noHtml` | `boolean` | `false` | Reject text containing HTML tags. |

`noPhoneNumbers` pulls in the `libphonenumber-js` dependency.

**Normalization:** trim

**Error Codes:**

| Code | Message | Params |
| --- | --- | --- |
| `text.noEmails` | `{{label}} must not contain email addresses` | `label` |
| `text.noUrls` | `{{label}} must not contain URLs` | `label` |
| `text.noPhoneNumbers` | `{{label}} must not contain phone numbers` | `label` |
| `text.noHtml` | `{{label}} must not contain HTML` | `label` |
| `text.maxWords` | `{{label}} must have at most {{maximum}} words` | `label`, `maximum` |
| `text.maxConsecutive` | `{{label}} must not repeat the same character more than {{maximum}} times` | `label`, `maximum` |

**Example:**

```ts
import { Text } from '@validex/core'

const schema = Text({
  length: { min: 10, max: 5000 },
  noHtml: true,
  noUrls: true,
})
schema.parse('This is a clean text input without HTML or URLs.') // OK
```

---

### `Token(options?)`

**Description:** Validates generic tokens (nanoid, hex, base64, cuid, cuid2, ulid).

**Extends:** `FormatRuleOptions`

**Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | `'nanoid' \| 'hex' \| 'base64' \| 'cuid' \| 'cuid2' \| 'ulid'` | **REQUIRED** | Token format. |
| `length` | `Range` | Type-specific (see below) | Token length constraint. |

**Type-specific default lengths:**

| Type | Default Length |
| --- | --- |
| `nanoid` | `21` |
| `cuid` | `25` |
| `cuid2` | `24` |
| `ulid` | `26` |
| `hex` | `undefined` |
| `base64` | `undefined` |

**Normalization:** trim

**Error Codes:**

| Code | Message | Params |
| --- | --- | --- |
| `token.invalid` | `{{label}} is not a valid {{type}} token` | `label`, `type` |

**Example:**

```ts
import { Token } from '@validex/core'

const schema = Token({ type: 'nanoid' })
schema.parse('V1StGXR8_Z5jdHi6B-myT') // OK
```

---

### `Url(options?)`

**Description:** Validates general URLs with protocol, TLD, and domain filtering.

**Extends:** `BaseRuleOptions`

**Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `protocols` | `string[]` | `['http', 'https']` | Allowed URL protocols. |
| `requireTLD` | `boolean` | `true` | Require a top-level domain. |
| `length` | `Range` | `{ max: 2048 }` | URL length constraint. |
| `allowDomains` | `string[]` | `[]` | Only allow these domains (empty = all). |
| `blockDomains` | `string[]` | `[]` | Block these domains. |
| `allowQuery` | `boolean` | `true` | Allow query strings. |
| `allowAuth` | `boolean` | `false` | Allow authentication info in the URL (e.g. `user:pass@`). |

**Normalization:** trim (preserve case in path/query)

**Error Codes:**

| Code | Message | Params |
| --- | --- | --- |
| `url.invalid` | `{{label}} is not a valid URL` | `label` |
| `url.protocolNotAllowed` | `Protocol '{{protocol}}' is not allowed` | `protocol` |
| `url.domainBlocked` | `Domain '{{domain}}' is not allowed` | `domain` |
| `url.domainNotAllowed` | `Domain '{{domain}}' is not in the allowed list` | `domain` |

**Example:**

```ts
import { Url } from '@validex/core'

const schema = Url({ protocols: ['https'], allowAuth: false })
schema.parse('https://example.com/path?q=1') // OK
```

---

### `Username(options?)`

**Description:** Validates usernames with configurable character patterns, reserved word blocking, and boundary rules.

**Extends:** `FormatRuleOptions`

**Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `length` | `Range` | `{ min: 3, max: 20 }` | Username length range. |
| `pattern` | `'alphanumeric' \| 'alphanumeric-dash' \| 'alphanumeric-underscore'` | `'alphanumeric-underscore'` | Allowed character pattern. |
| `extraChars` | `string` | `undefined` | Additional allowed characters. |
| `disallowChars` | `string` | `undefined` | Characters to disallow. |
| `boundary` | `Boundary` | `'alphanumeric'` | Character restrictions at string start/end. |
| `consecutive` | `Range` | `undefined` | Maximum consecutive identical characters. |
| `reservedWords` | `string[]` | `[]` | Custom reserved words to block. |
| `blockReserved` | `boolean` | `false` | Block built-in reserved usernames. Async -- requires `parseAsync`. |
| `ignoreCase` | `boolean` | `true` | Case-insensitive reserved word matching. |

**Normalization:** lowercase + trim

**Error Codes:**

| Code | Message | Params |
| --- | --- | --- |
| `username.invalid` | `{{label}} is not a valid username` | `label` |
| `username.reservedBlocked` | `The username '{{value}}' is reserved` | `value` |
| `username.boundary` | `{{label}} must start and end with an alphanumeric character` | `label` |
| `username.maxConsecutive` | `{{label}} must not repeat the same character more than {{maximum}} times` | `label`, `maximum` |

**Example:**

```ts
import { Username } from '@validex/core'

const schema = Username({
  length: { min: 3, max: 30 },
  pattern: 'alphanumeric-underscore',
  blockReserved: true,
})
schema.parse('john_doe') // OK
```

---

### `Uuid(options?)`

**Description:** Validates UUIDs (v1 through v8, or any version).

**Extends:** `BaseRuleOptions`

**Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `version` | `1 \| 2 \| 3 \| 4 \| 5 \| 6 \| 7 \| 8 \| 'any'` | `'any'` | UUID version to accept. |

**Normalization:** lowercase + trim

**Error Codes:**

| Code | Message | Params |
| --- | --- | --- |
| `uuid.invalid` | `{{label}} is not a valid UUID` | `label` |

**Example:**

```ts
import { Uuid } from '@validex/core'

const schema = Uuid({ version: 4 })
schema.parse('550e8400-e29b-41d4-a716-446655440000') // OK
```

---

### `VatNumber(options?)`

**Description:** Validates EU VAT identification numbers with country-specific formats.

**Extends:** `BaseRuleOptions`

**Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `country` | `string` | `undefined` | ISO country code. When omitted, auto-detects from the VAT prefix. |
| `requirePrefix` | `boolean` | `false` | Require country prefix (e.g. `DE` in `DE123456789`). |

**Behavior:** When `country` is set and no prefix is present, the value is validated against that country's format. When `country` is `undefined`, the prefix is used for auto-detection; fails if no recognizable prefix is found.

**Normalization:** uppercase + trim + strip spaces

**Error Codes:**

| Code | Message | Params |
| --- | --- | --- |
| `vatNumber.invalid` | `{{label}} is not a valid VAT number` | `label` |

**Example:**

```ts
import { VatNumber } from '@validex/core'

const schema = VatNumber({ country: 'DE', requirePrefix: true })
schema.parse('DE123456789') // OK
```

---

### `Website(options?)`

**Description:** Validates website URLs restricted to HTTP/HTTPS with optional www requirement and domain filtering.

**Extends:** `BaseRuleOptions`

**Options:**

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `length` | `Range` | `{ max: 255 }` | Maximum URL length. |
| `requireWww` | `boolean` | `false` | Require `www.` prefix. |
| `requireHttps` | `boolean` | `false` | Require HTTPS protocol. |
| `allowDomains` | `string[]` | `[]` | Only allow these domains (empty = all). |
| `blockDomains` | `string[]` | `[]` | Block these domains. |
| `allowSubdomains` | `boolean` | `true` | Allow subdomain URLs. |
| `allowPath` | `boolean` | `true` | Allow URL paths. |
| `allowQuery` | `boolean` | `false` | Allow query strings. |

When `normalize: true`, bare domains (e.g. `google.com`) are auto-prepended with `https://`.

**Normalization:** lowercase + trim + auto-prepend `https://` to bare domains

**Error Codes:**

| Code | Message | Params |
| --- | --- | --- |
| `website.invalid` | `{{label}} is not a valid website URL` | `label` |
| `website.domainBlocked` | `Domain '{{domain}}' is not allowed` | `domain` |
| `website.domainNotAllowed` | `Domain '{{domain}}' is not in the allowed list` | `domain` |
| `website.subdomainNotAllowed` | `Subdomain URLs are not allowed` | -- |

**Example:**

```ts
import { Website } from '@validex/core'

const schema = Website({
  requireHttps: true,
  allowSubdomains: false,
  blockDomains: ['example.com'],
})
schema.parse('https://mysite.com') // OK
```

---

## Checks (`@validex/core/checks`)

Pure utility functions for character composition, content detection, string limits, character restrictions, and transforms. All functions are stateless and have zero side effects.

```ts
import { hasUppercase, containsEmail, maxWords } from '@validex/core/checks'
```

### Composition Checks

| Function | Signature | Description |
| --- | --- | --- |
| `hasUppercase` | `(value: string, min: number, max?: number) => boolean` | Checks uppercase letter count is within `[min, max]`. |
| `hasLowercase` | `(value: string, min: number, max?: number) => boolean` | Checks lowercase letter count is within `[min, max]`. |
| `hasDigits` | `(value: string, min: number, max?: number) => boolean` | Checks digit count is within `[min, max]`. |
| `hasSpecial` | `(value: string, min: number, max?: number) => boolean` | Checks special character count is within `[min, max]`. |

### Detection Checks

| Function | Signature | Description |
| --- | --- | --- |
| `containsEmail` | `(value: string) => boolean` | Returns `true` if the string contains an email-like pattern. |
| `containsUrl` | `(value: string) => boolean` | Returns `true` if the string contains a URL-like pattern. |
| `containsHtml` | `(value: string) => boolean` | Returns `true` if the string contains HTML tags. |
| `containsPhoneNumber` | `(value: string) => Promise<boolean>` | Returns `true` if the string contains a phone number. Uses `libphonenumber-js` via dynamic import. |

### Limit Checks

| Function | Signature | Description |
| --- | --- | --- |
| `maxWords` | `(value: string, max: number) => boolean` | Returns `true` if the string has at most `max` words. |
| `minWords` | `(value: string, min: number) => boolean` | Returns `true` if the string has at least `min` words. |
| `maxConsecutive` | `(value: string, max: number) => boolean` | Returns `true` if no character repeats more than `max` times consecutively. |
| `noSpaces` | `(value: string) => boolean` | Returns `true` if the string contains no whitespace. |

### Restriction Checks

| Function | Signature | Description |
| --- | --- | --- |
| `onlyAlpha` | `(value: string) => boolean` | Returns `true` if every character is a unicode letter. |
| `onlyNumeric` | `(value: string) => boolean` | Returns `true` if every character is a digit (0-9). |
| `onlyAlphanumeric` | `(value: string) => boolean` | Returns `true` if every character is a unicode letter or digit. |
| `onlyAlphanumericSpaceHyphen` | `(value: string) => boolean` | Returns `true` if every character is a letter, digit, space, or hyphen. |
| `onlyAlphaSpaceHyphen` | `(value: string) => boolean` | Returns `true` if every character is a letter, space, or hyphen. |

### Transforms

| Function | Signature | Description |
| --- | --- | --- |
| `emptyToUndefined` | `(value: unknown) => unknown` | Converts `""` and `null` to `undefined`; passes everything else through. |
| `toTitleCase` | `(value: string) => string` | Converts to Title Case, handling hyphens and apostrophes. |
| `toSlug` | `(value: string) => string` | Converts to a URL-safe slug (lowercase, hyphens, trimmed). |
| `stripHtml` | `(value: string) => string` | Removes all HTML tags from a string. |
| `collapseWhitespace` | `(value: string) => string` | Collapses multiple whitespace into a single space and trims. |

---

## Chainable Methods

All Zod types gain these methods via module augmentation when `validex` is imported. They bridge Layer 0 pure functions to Zod's schema API.

```ts
import { z } from 'zod'
import '@validex/core' // activates chainable methods

const schema = z.string()
  .hasUppercase({ min: 1 })
  .hasDigits({ min: 2 })
  .noEmails()
  .maxWords({ max: 10 })
```

### Default Namespace

Standalone usage defaults to `namespace: 'string'`. Rules override with their own namespace (e.g., `'password'`).

### Composition (4)

| Method | Options | Error Codes |
|--------|---------|-------------|
| `.hasUppercase(opts?)` | `{ min?, max?, label?, namespace? }` | `minUppercase` / `maxUppercase` |
| `.hasLowercase(opts?)` | `{ min?, max?, label?, namespace? }` | `minLowercase` / `maxLowercase` |
| `.hasDigits(opts?)` | `{ min?, max?, label?, namespace? }` | `minDigits` / `maxDigits` |
| `.hasSpecial(opts?)` | `{ min?, max?, label?, namespace? }` | `minSpecial` / `maxSpecial` |

Default `min: 1`. Both min and max checked in a single refinement.

### Blocking (5)

| Method | Options | Error Code |
|--------|---------|------------|
| `.noEmails(opts?)` | `{ label?, namespace? }` | `noEmails` |
| `.noUrls(opts?)` | `{ label?, namespace? }` | `noUrls` |
| `.noHtml(opts?)` | `{ label?, namespace? }` | `noHtml` |
| `.noPhoneNumbers(opts?)` | `{ label?, namespace? }` | `noPhoneNumbers` |
| `.noSpaces(opts?)` | `{ label?, namespace? }` | `noSpaces` |

`.noPhoneNumbers()` is async — use `safeParseAsync()`.

### Restriction (5)

| Method | Options | Error Code |
|--------|---------|------------|
| `.onlyAlpha(opts?)` | `{ label?, namespace? }` | `onlyAlpha` |
| `.onlyNumeric(opts?)` | `{ label?, namespace? }` | `onlyNumeric` |
| `.onlyAlphanumeric(opts?)` | `{ label?, namespace? }` | `onlyAlphanumeric` |
| `.onlyAlphaSpaceHyphen(opts?)` | `{ label?, namespace? }` | `onlyAlphaSpaceHyphen` |
| `.onlyAlphanumericSpaceHyphen(opts?)` | `{ label?, namespace? }` | `onlyAlphanumericSpaceHyphen` |

### Limits (3)

| Method | Options | Error Code |
|--------|---------|------------|
| `.maxWords(opts)` | `{ max, label?, namespace? }` | `maxWords` |
| `.minWords(opts)` | `{ min, label?, namespace? }` | `minWords` |
| `.maxConsecutive(opts)` | `{ max, label?, namespace? }` | `maxConsecutive` |

### Transforms (5)

| Method | Returns |
|--------|---------|
| `.toTitleCase()` | `ZodPipe<this, ZodTransform<string, string>>` |
| `.toSlug()` | `ZodPipe<this, ZodTransform<string, string>>` |
| `.stripHtml()` | `ZodPipe<this, ZodTransform<string, string>>` |
| `.collapseWhitespace()` | `ZodPipe<this, ZodTransform<string, string>>` |
| `.emptyToUndefined()` | `ZodPipe<this, ZodTransform<string \| undefined, unknown>>` |

### Chaining After Rules

Chaining adds checks — it cannot override internal rule checks. Rule options are the configuration mechanism.

```ts
import { Email, Password } from '@validex/core'

// Adds a noSpaces check after Password's built-in checks
const schema = Password().noSpaces()

// Adds noPhoneNumbers after Email's built-in checks
const emailSchema = Email().noPhoneNumbers()
```

### Bundler Configuration

The main entry has side effects (prototype patching). `package.json` declares:

```json
"sideEffects": ["./src/augmentation.ts", "./dist/index.js", "./dist/index.mjs", "./dist/index.cjs"]
```

Subpath exports (`@validex/core/checks`, `@validex/core/rules`) remain side-effect-free.

---

## Utilities (`@validex/core/utilities`)

Cross-field refinement helpers for Zod object schemas.

```ts
import { sameAs, requiredWhen } from '@validex/core/utilities'
```

### `sameAs`

Creates a `superRefine` callback that verifies two fields hold the same value. The error is attached to the `sourceField` path.

**Signature:**

```ts
function sameAs(
  sourceField: string,
  targetField: string,
  options?: { message?: string },
): (data: Record<string, unknown>, ctx: z.RefinementCtx) => void
```

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `sourceField` | `string` | Yes | Field that must match the target. |
| `targetField` | `string` | Yes | Field whose value is the reference. |
| `options.message` | `string` | No | Custom error message. Default: `"${sourceField} must match ${targetField}"` |

**Example:**

```ts
import { z } from 'zod'
import { Password } from '@validex/core'
import { sameAs } from '@validex/core/utilities'

const schema = z.object({
  password: Password(),
  confirmPassword: z.string(),
}).superRefine(sameAs('confirmPassword', 'password', {
  message: 'Passwords do not match',
}))
```

### `requiredWhen`

Creates a `superRefine` callback that marks a field as required when a condition is met. The condition receives the full parent object for cross-field logic.

**Signature:**

```ts
function requiredWhen(
  field: string,
  condition: (data: Record<string, unknown>) => boolean,
  options?: { message?: string },
): (data: Record<string, unknown>, ctx: z.RefinementCtx) => void
```

**Parameters:**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| `field` | `string` | Yes | Field name that becomes required. |
| `condition` | `(data: Record<string, unknown>) => boolean` | Yes | Predicate receiving the parent data object. |
| `options.message` | `string` | No | Custom error message. Default: `"${field} is required"` |

A field is considered empty when its value is `undefined`, `null`, or `""`.

**Example:**

```ts
import { z } from 'zod'
import { requiredWhen } from '@validex/core/utilities'

const schema = z.object({
  accountType: z.string(),
  companyName: z.string().optional(),
}).superRefine(requiredWhen(
  'companyName',
  (data) => data['accountType'] === 'business',
  { message: 'Company name is required for business accounts' },
))
```

---

## Adapters

### Nuxt (`@validex/nuxt`)

Nuxt integration with module setup and a validation state composable.

#### `setupValidex(options?)`

Applies validex configuration from Nuxt module options and optionally preloads async data. Can be used standalone outside of Nuxt.

**Signature:**

```ts
async function setupValidex(options?: ValidexNuxtOptions): Promise<void>
```

**`ValidexNuxtOptions` interface:**

```ts
interface ValidexNuxtOptions {
  readonly rules?: GlobalConfig['rules']
  readonly i18n?: {
    readonly enabled?: boolean
    readonly prefix?: string
    readonly separator?: string
    readonly pathMode?: 'semantic' | 'key' | 'full' | PathTransform
  }
  readonly preload?: PreloadOptions
}
```

**Example:**

```ts
// plugins/validex.ts
import { setupValidex } from '@validex/nuxt'

await setupValidex({
  rules: {
    email: { blockDisposable: true },
  },
  i18n: { enabled: true, prefix: 'validation' },
  preload: { disposable: true },
})
```

#### `useValidation(schema)`

Creates a validation state container bound to a Zod schema. Framework-agnostic -- manages errors, validity, and parsed data via closures.

**Signature:**

```ts
function useValidation<S extends z.ZodType>(schema: S): ValidationState<z.output<S>>
```

**`ValidationState<T>` interface:**

```ts
interface ValidationState<T> {
  readonly validate: (data: unknown) => Promise<ValidationResult<T>>
  readonly clearErrors: () => void
  readonly getErrors: () => Readonly<Record<string, readonly string[]>>
  readonly getFirstErrors: () => Readonly<Record<string, string>>
  readonly getIsValid: () => boolean
  readonly getData: () => T | undefined
}
```

**Example:**

```ts
import { useValidation } from '@validex/nuxt'
import { Email, Password } from '@validex/core'
import { z } from 'zod'

const schema = z.object({
  email: Email(),
  password: Password(),
})

const { validate, clearErrors, getErrors, getFirstErrors, getIsValid } = useValidation(schema)

const result = await validate({ email: 'user@example.com', password: 'Str0ng!Pass' })

if (!getIsValid()) {
  console.log(getFirstErrors())
}
```

#### `createNuxtModule()`

Returns a plain module definition object compatible with Nuxt's `defineNuxtModule()`.

**Signature:**

```ts
function createNuxtModule(): NuxtModuleDefinition
```

**`NuxtModuleDefinition` interface:**

```ts
interface NuxtModuleDefinition {
  readonly meta: {
    readonly name: 'validex'
    readonly configKey: 'validex'
    readonly compatibility: { readonly nuxt: '>=3.0.0' }
  }
  readonly defaults: ValidexNuxtOptions
  readonly setup: (options: ValidexNuxtOptions) => Promise<void>
}
```

#### `detectNuxtI18n(installedModules)`

Checks whether `@nuxtjs/i18n` is present in the installed modules list.

**Signature:**

```ts
function detectNuxtI18n(installedModules: readonly string[]): boolean
```

---

### Fastify (`@validex/fastify`)

Fastify plugin that registers instance and request decorators for validation, with optional route-level `preValidation`.

#### `validexPlugin`

Fastify 5 plugin wrapped with `fastify-plugin`. Register via `app.register()` -- decorators are exposed at the parent scope.

**Usage:**

```ts
await app.register(validexPlugin, options)
```

**`ValidexFastifyOptions` interface:**

```ts
interface ValidexFastifyOptions {
  readonly rules?: GlobalConfig['rules']
  readonly preload?: PreloadOptions
  readonly errorHandler?: (
    result: ValidationResult<unknown>,
    request: FastifyRequest,
    reply: FastifyReply,
  ) => void | Promise<void>
}
```

**Decorators registered:**

| Decorator | Level | Signature | Description |
| --- | --- | --- | --- |
| `app.validate` | Instance | `(schema: ZodType, data: unknown) => Promise<ValidationResult>` | Validate arbitrary data. |
| `request.validate` | Request | `(schema: ZodType, opts?: { source?: 'body' \| 'params' \| 'query' }) => Promise<ValidationResult>` | Validate request data from a specific source. |

**Route-level validation:**

Define a `validex.body` schema in route config for automatic `preValidation`:

```ts
app.post('/users', {
  config: {
    validex: {
      body: schema,
    },
  },
  handler: async (request, reply) => {
    // request.body is already validated
  },
})
```

When validation fails and no custom `errorHandler` is provided, the plugin replies with:

```json
{
  "statusCode": 400,
  "error": "Validation Error",
  "errors": { "email": "Email is not a valid email address" },
  "allErrors": { "email": ["Email is not a valid email address"] }
}
```

**Example:**

```ts
import Fastify from 'fastify'
import { validexPlugin } from '@validex/fastify'
import { z } from 'zod'
import { Email, Password } from '@validex/core'

const app = Fastify()

await app.register(validexPlugin, {
  rules: {
    email: { blockDisposable: true },
  },
  preload: { disposable: true },
})

// Instance-level validation
const result = await app.validate(Email(), 'user@example.com')

// Request-level validation (inside a route handler)
app.post('/login', async (request, reply) => {
  const schema = z.object({ email: Email(), password: Password() })
  const result = await request.validate(schema, { source: 'body' })
  if (!result.success) {
    return reply.status(400).send(result.firstErrors)
  }
  return { ok: true }
})
```

---

## Types

All types are exported from the main `validex` entry point and can be used as type-only imports.

```ts
import type { ValidationResult, GlobalConfig, ErrorParams } from '@validex/core'
```

### Core Types

| Type | Description |
| --- | --- |
| `Range` | `number \| { min?: number, max?: number }` -- Numeric range constraint. |
| `Boundary` | `'alpha' \| 'alphanumeric' \| 'any' \| { start?, end? }` -- String boundary restriction. |
| `BaseRuleOptions` | Base options available on every rule. |
| `FormatRuleOptions` | Extended options for rules supporting `regex` override. |
| `GlobalConfig` | Top-level configuration for `setup()`. |
| `I18nConfig` | Internationalization settings. |
| `LabelConfig` | Label derivation settings. |
| `MessageConfig` | Message formatting settings. |
| `PreloadOptions` | Options for `preloadData()`. |
| `ValidationResult<T>` | Structured result from `validate()`. |
| `NestedErrors` | Recursive nested error object type. |
| `ErrorParams` | Structured error parameters from `getParams()`. |
| `CreateRuleOptions<T>` | Configuration object for `createRule()`. |
| `RuleDefaults` | Default option values for all built-in rules. |
| `RuleFactory<T>` | Function returned by `createRule()`. |
| `TranslationFunction` | `(key: string, params?: Record<string, unknown>) => string` |
| `PathTransform` | `(path: ReadonlyArray<string \| number>) => string` |
| `LabelTransform` | Transform function for field labels. |
| `MessageTransform` | Transform function for error messages. |

### Rule Option Types

| Type | Rule |
| --- | --- |
| `EmailOptions` | Email |
| `PersonNameOptions` | PersonName |
| `BusinessNameOptions` | BusinessName |
| `PasswordOptions` | Password |
| `PasswordConfirmationOptions` | PasswordConfirmation |
| `PhoneOptions` | Phone |
| `WebsiteOptions` | Website |
| `URLOptions` | Url |
| `UsernameOptions` | Username |
| `SlugOptions` | Slug |
| `PostalCodeOptions` | PostalCode |
| `LicenseKeyOptions` | LicenseKey |
| `UUIDOptions` | Uuid |
| `JWTOptions` | Jwt |
| `DateTimeOptions` | DateTime |
| `TokenOptions` | Token |
| `TextOptions` | Text |
| `CountryOptions` | Country |
| `CurrencyOptions` | Currency |
| `ColorOptions` | Color |
| `CreditCardOptions` | CreditCard |
| `IbanOptions` | Iban |
| `VatNumberOptions` | VatNumber |
| `MacAddressOptions` | MacAddress |
| `IpAddressOptions` | IpAddress |

### Data Types

| Type | Description |
| --- | --- |
| `IssuerType` | Credit card issuer union: `'visa' \| 'mastercard' \| 'amex' \| 'discover' \| 'diners' \| 'jcb' \| 'unionpay'` |
| `TokenType` | Token format union: `'nanoid' \| 'hex' \| 'base64' \| 'cuid' \| 'cuid2' \| 'ulid'` |
| `ResolvedRange` | Resolved numeric range (from internal utilities). |
| `ResolvedBoundary` | Resolved boundary (from internal utilities). |
| `CardIssuer` | Card issuer data shape (from loaders). |
| `CountryData` | Country data shape (from loaders). |
| `IbanPattern` | IBAN pattern shape (from loaders). |

### Adapter Types

| Type | Source | Description |
| --- | --- | --- |
| `ValidexNuxtOptions` | `@validex/nuxt` | Nuxt module options. |
| `ValidexNuxtI18nOptions` | `@validex/nuxt` | Nuxt i18n options. |
| `NuxtModuleDefinition` | `@validex/nuxt` | Nuxt module definition shape. |
| `ValidationState<T>` | `@validex/nuxt` | Validation state container. |
| `ValidexFastifyOptions` | `@validex/fastify` | Fastify plugin options. |
| `ValidateSource` | `@validex/fastify` | `'body' \| 'params' \| 'query'` |

---

## Bundle Sizes

Measured with esbuild + Brotli compression, excluding `zod` peer dependency and on-demand data files (common passwords, disposable domains, country codes, IBAN patterns, etc.).

| Import | Raw (minified) | Brotli | Gzip |
| --- | --- | --- | --- |
| Core only (setup + validate) | 6.6 kB | 1.6 kB | 1.9 kB |
| BusinessName | 11.2 kB | 2.9 kB | 3.3 kB |
| Color | 10.1 kB | 2.5 kB | 2.9 kB |
| Country | 10.3 kB | 2.6 kB | 3.0 kB |
| CreditCard | 10.8 kB | 2.8 kB | 3.2 kB |
| Currency | 10.1 kB | 2.5 kB | 2.9 kB |
| DateTime | 10.6 kB | 2.6 kB | 2.9 kB |
| Email | 10.8 kB | 2.6 kB | 3.0 kB |
| Iban | 10.6 kB | 2.8 kB | 3.1 kB |
| IpAddress | 10.3 kB | 2.6 kB | 3.0 kB |
| Jwt | 10.9 kB | 2.7 kB | 3.1 kB |
| LicenseKey | 9.9 kB | 2.5 kB | 2.9 kB |
| MacAddress | 9.6 kB | 2.4 kB | 2.7 kB |
| Password | 12.3 kB | 3.1 kB | 3.5 kB |
| PasswordConfirmation | 12.6 kB | 3.2 kB | 3.6 kB |
| PersonName | 11.5 kB | 3.0 kB | 3.4 kB |
| Phone | 10.3 kB | 2.6 kB | 3.0 kB |
| PostalCode | 9.5 kB | 2.4 kB | 2.7 kB |
| Slug | 9.8 kB | 2.5 kB | 2.9 kB |
| Text | 11.3 kB | 2.8 kB | 3.2 kB |
| Token | 10.0 kB | 2.6 kB | 2.9 kB |
| Url | 10.8 kB | 2.7 kB | 3.0 kB |
| Username | 11.6 kB | 3.1 kB | 3.5 kB |
| Uuid | 9.5 kB | 2.4 kB | 2.7 kB |
| VatNumber | 10.1 kB | 2.6 kB | 3.0 kB |
| Website | 11.0 kB | 2.7 kB | 3.1 kB |
| Email + Password | 13.7 kB | 3.4 kB | 3.9 kB |
| Form (Email+Password+PersonName+Phone) | 16.9 kB | 4.3 kB | 4.8 kB |
| All 25 rules | 43.7 kB | 10.5 kB | 11.7 kB |

Run `pnpm size:detail` to regenerate these measurements.

---

## Error Code Registry

Complete list of all error namespaces and codes. Every rule also supports a `{namespace}.custom` code for `customFn` errors.

| Namespace | Codes |
| --- | --- |
| `base` | `required`, `min`, `max`, `type`, `format` |
| `email` | `invalid`, `plusAliasBlocked`, `disposableBlocked`, `domainBlocked`, `domainNotAllowed`, `subdomainNotAllowed` |
| `personName` | `invalid`, `maxWords`, `boundary`, `maxConsecutive` |
| `businessName` | `invalid`, `boundary`, `maxConsecutive` |
| `password` | `minUppercase`, `minLowercase`, `minDigits`, `minSpecial`, `maxUppercase`, `maxLowercase`, `maxDigits`, `maxSpecial`, `maxConsecutive`, `commonBlocked` |
| `confirmation` | `mismatch` |
| `phone` | `invalid`, `requireMobile`, `countryCodeRequired`, `countryBlocked`, `countryNotAllowed` |
| `website` | `invalid`, `httpsRequired`, `wwwRequired`, `pathNotAllowed`, `queryNotAllowed`, `domainBlocked`, `domainNotAllowed`, `subdomainNotAllowed` |
| `url` | `invalid`, `protocolNotAllowed`, `tldRequired`, `queryNotAllowed`, `authNotAllowed`, `domainBlocked`, `domainNotAllowed` |
| `username` | `invalid`, `reservedBlocked`, `boundary`, `maxConsecutive` |
| `slug` | `invalid` |
| `postalCode` | `invalid` |
| `licenseKey` | `invalid` |
| `uuid` | `invalid` |
| `jwt` | `invalid`, `expiryRequired`, `expired`, `notYetValid`, `missingClaim`, `algorithmNotAllowed` |
| `dateTime` | `invalid`, `tooEarly`, `tooLate`, `noFuture`, `noPast` |
| `token` | `invalid` |
| `text` | `noEmails`, `noUrls`, `noPhoneNumbers`, `noHtml`, `minWords`, `maxWords`, `maxConsecutive` |
| `country` | `invalid`, `blocked`, `notAllowed` |
| `currency` | `invalid`, `blocked`, `notAllowed` |
| `color` | `invalid` |
| `creditCard` | `invalid`, `issuerNotAllowed`, `issuerBlocked` |
| `iban` | `invalid`, `countryBlocked`, `countryNotAllowed` |
| `vatNumber` | `invalid` |
| `macAddress` | `invalid` |
| `ipAddress` | `invalid`, `privateNotAllowed` |

### Message Interpolation

Error messages support `{{param}}` interpolation. Common parameters:

| Parameter | Description |
| --- | --- |
| `{{label}}` | Field label (derived or explicit). |
| `{{minimum}}` | Minimum value from the constraint. |
| `{{maximum}}` | Maximum value from the constraint. |
| `{{expected}}` | Expected type (for type errors). |
| `{{domain}}` | Domain name (for domain filtering errors). |
| `{{country}}` | Country code (for country filtering errors). |
| `{{protocol}}` | Protocol name (for URL protocol errors). |
| `{{currency}}` | Currency code (for currency filtering errors). |
| `{{issuer}}` | Card issuer name (for credit card errors). |
| `{{claim}}` | JWT claim name. |
| `{{algorithm}}` | JWT algorithm name. |
| `{{value}}` | The input value (for reserved word errors). |
| `{{type}}` | Token type (for token errors). |
