# validex

[![npm version](https://img.shields.io/npm/v/@validex/core)](https://www.npmjs.com/package/@validex/core)
[![npm downloads](https://img.shields.io/npm/dm/@validex/core)](https://www.npmjs.com/package/@validex/core)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@validex/core)](https://bundlephobia.com/package/@validex/core)
[![build](https://img.shields.io/github/actions/workflow/status/chiptoma/validex/ci.yml)](https://github.com/chiptoma/validex/actions)
[![TypeScript 5.0+](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![license MIT](https://img.shields.io/npm/l/@validex/core)](./LICENSE)

**Type-safe validation rules built on Zod** — tree-shakeable, so you only ship what you use. The main package is `@validex/core` with optional adapters `@validex/nuxt` and `@validex/fastify`.

---

- [Install](#install)
- [Quick Start](#quick-start)
- [Why validex?](#why-validex)
- [Rules](#rules) — all 25 rules at a glance
- [Bundle Size](#bundle-size)
- [Configuration](#configuration) — global defaults, three-tier merge, preloading
- [Cross-Field Validation](#cross-field-validation) — sameAs, requiredWhen
- [Chainable Methods](#chainable-methods) — checks and transforms on any Zod string
- [Check Functions](#check-functions) — standalone pure functions
- [Error Handling](#error-handling) — structured errors, getParams, validate()
- [i18n](#i18n) — translations, CLI, 141 error codes
- [Custom Rules](#custom-rules) — createRule, customFn, custom regex
- [Framework Adapters](#framework-adapters) — Nuxt, Fastify
- [Documentation](#documentation)

---

## Install

```bash
pnpm add @validex/core zod   # core is required
pnpm add @validex/nuxt       # optional — Nuxt adapter
pnpm add @validex/fastify    # optional — Fastify adapter
```

## Quick Start

### Single rule

```ts
import { Email } from '@validex/core'

const schema = Email()
schema.parse('hello@example.com') // OK
schema.parse('not-an-email')      // throws ZodError
```

### Rule with options

```ts
import { Password } from '@validex/core'

const schema = Password({
  length: { min: 10 },
  uppercase: { min: 2 },
  blockCommon: 'basic',
})

schema.parse('ABcdefgh1!') // OK — 10+ chars, 2 uppercase, 1 digit, 1 special
```

### Composed schema with `validate()`

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
  console.log(result.data) // typed as { email: string; password: string }
} else {
  console.log(result.errors)      // { email: ['...'], password: ['...'] }
  console.log(result.firstErrors) // { email: '...', password: '...' }
}
```

## Why validex?

I built validex because I was **fed up** writing the same validation rules over and over again in every project.

Different teams, different defaults, forgetting what I had configured last time, and ending up with inconsistent behavior across the codebase. Sound familiar?

Validex was created to solve that pain once and for all:

- **One config system** — `setup()` lets you define your defaults globally, per-rule, or per-call. Three-tier merge (built-in defaults → global config → per-call options) so you never repeat yourself again.
- **One consistent error surface** — `validate()` always returns the same clean shape — flat errors, nested errors, first-per-field, raw issues. One function, one result, every time.
- **Every error is validex-owned** — no raw Zod messages leak to your users. Every error carries a namespace, code, and label for precise routing.
- **25 production-ready rules** covering the fields you actually use: identity, auth, networking, finance, and text.
- **Tree-shakeable & lightweight** — 5–6 kB Brotli per rule (shared core included). All 25 rules together = 13 kB. Heavy data loads on demand.
- **i18n-ready out of the box** — key mode, `t()` function support, label/message transforms, and a CLI that generates ready-to-translate locale files.
- **First-class framework adapters** — Nuxt and Fastify integrations that feel native.

Stop copy-pasting rules. Get consistent, maintainable validation with sensible defaults — and only ship what you actually use.

## Rules

| Rule | Description |
|------|-------------|
| Email | Email address with domain filtering, plus-alias blocking, and disposable detection |
| Password | Strength rules: length, casing, digits, specials, consecutive limits, common-password ban |
| PasswordConfirmation | Confirms two password fields match |
| PersonName | Human name with unicode support, word count, and boundary rules |
| BusinessName | Company/organization name with boundary and consecutive limits |
| Phone | International phone via libphonenumber-js |
| Website | URL restricted to http/https with optional www and domain filtering |
| Url | General URL with protocol, TLD, and domain validation |
| Username | Alphanumeric with configurable separators and reserved-word ban |
| Slug | URL-safe slug (lowercase, hyphens, length limits) |
| PostalCode | Country-aware postal/ZIP code |
| LicenseKey | Software license key format (segments, separators, charset) |
| Uuid | UUID v1-v7 validation |
| Jwt | JSON Web Token structure with optional expiry checks |
| DateTime | Date/time string with format and range constraints |
| Token | Generic token validation (hex, base64, nanoid, etc.) |
| Text | Free text with length, word count, content detection, and regex override |
| Country | ISO 3166 country code (alpha-2, alpha-3) |
| Currency | ISO 4217 currency code |
| Color | Hex, RGB, HSL, and named CSS color formats |
| CreditCard | Card number with Luhn check and issuer detection |
| Iban | International Bank Account Number with country patterns |
| VatNumber | EU VAT identification number |
| MacAddress | MAC address (colon, hyphen, and dot notations) |
| IpAddress | IPv4 and IPv6 with optional CIDR notation |

## Bundle Size

Every rule shares a ~5 kB core (Brotli). Each additional rule adds 0.1-0.8 kB. Measured with esbuild `--splitting` + Brotli, excluding `zod` peer dependency.

| Rule | Initial (Brotli) | On-demand data | Trigger |
|------|-----------------|----------------|---------|
| Email | 5.7 kB | — | — |
| Password | 5.6 kB | +0.5 kB / +3.8 kB / +35.5 kB | `blockCommon: 'basic'` / `'moderate'` / `'strict'` |
| PasswordConfirmation | 5.7 kB | — | — |
| PersonName | 5.7 kB | — | — |
| BusinessName | 5.7 kB | — | — |
| Phone | 5.7 kB | libphonenumber-js | bundled dependency |
| Website | 5.7 kB | — | — |
| Url | 5.6 kB | — | — |
| Username | 5.9 kB | +0.8 kB | `blockReserved: true` |
| Slug | 5.5 kB | — | — |
| PostalCode | 5.4 kB | postcode-validator | bundled dependency |
| LicenseKey | 5.5 kB | — | — |
| Uuid | 5.3 kB | — | — |
| Jwt | 5.6 kB | — | — |
| DateTime | 5.6 kB | — | — |
| Token | 5.5 kB | — | — |
| Text | 5.5 kB | — | — |
| Country | 5.4 kB | +2.4 kB | First use |
| Currency | 5.4 kB | +0.3 kB | First use |
| Color | 5.5 kB | — | — |
| CreditCard | 5.6 kB | +0.3 kB | First use |
| Iban | 5.5 kB | +0.7 kB | First use |
| VatNumber | 5.5 kB | +0.3 kB | First use |
| MacAddress | 5.3 kB | — | — |
| IpAddress | 5.6 kB | — | — |

| Combination | Initial (Brotli) |
|-------------|-----------------|
| Email + Password | 6.0 kB |
| Form (Email + Password + PersonName + Phone) | 6.9 kB |
| All 25 rules | 13.0 kB |

"On-demand data" loads asynchronously on first use or when the listed option is enabled. Not included in the initial bundle.

## Configuration

### Global defaults with `setup()`

```ts
import { setup, Email, Password } from '@validex/core'

setup({
  rules: {
    email: { blockDisposable: true },
    password: { length: { min: 10 }, special: { min: 2 } },
  },
  i18n: {
    enabled: true,
    t: (key, params) => translate(key, params),
  },
})

// Rules now use your defaults — no need to pass options every time
const emailSchema = Email()
const passwordSchema = Password()
```

### Three-tier merge

```
built-in defaults  <  setup() config  <  per-call options
```

Per-call options override `setup()` config, which overrides built-in defaults. Passing `undefined` for a per-call option removes the global setting for that field.

```ts
import { setup, Email } from '@validex/core'

setup({ rules: { email: { blockDisposable: true } } })

Email()                              // blockDisposable: true (from setup)
Email({ blockPlusAlias: true })      // blockDisposable: true + blockPlusAlias: true
Email({ blockDisposable: undefined }) // blockDisposable removed for this call
```

### `resetConfig()`

```ts
import { resetConfig } from '@validex/core'

resetConfig() // resets to built-in defaults
```

### `preloadData()`

Preload async data files at startup so first validation has no delay:

```ts
import { preloadData } from '@validex/core'

await preloadData({
  disposable: true,
  passwords: 'moderate',
  reserved: true,
  phone: 'mobile',
  countryCodes: true,
  currencyCodes: true,
  ibanPatterns: true,
  vatPatterns: true,
  creditCardPrefixes: true,
  postalCodes: true,
})
```

## Cross-Field Validation

### `sameAs`

Creates a `superRefine` callback that verifies two fields hold the same value:

```ts
import { z } from 'zod'
import { Password, sameAs } from '@validex/core'

const schema = z.object({
  password: Password(),
  confirmPassword: z.string(),
}).superRefine(sameAs('confirmPassword', 'password', {
  message: 'Passwords do not match',
}))
```

`PasswordConfirmation` auto-wires this — it registers a `sameAs: 'password'` constraint automatically:

```ts
import { z } from 'zod'
import { Password, PasswordConfirmation, validate } from '@validex/core'

const schema = z.object({
  password: Password(),
  confirmPassword: PasswordConfirmation(),
})

const result = await validate(schema, {
  password: 'Str0ng!Pass',
  confirmPassword: 'different',
})
// result.firstErrors.confirmPassword → "Password Confirmation must match Password"
```

### `requiredWhen`

Creates a `superRefine` callback that marks a field as required when a condition is met:

```ts
import { z } from 'zod'
import { requiredWhen } from '@validex/core'

const schema = z.object({
  accountType: z.string(),
  companyName: z.string().optional(),
}).superRefine(requiredWhen(
  'companyName',
  (data) => data['accountType'] === 'business',
  { message: 'Company name is required for business accounts' },
))
```

### `validate()` resolves cross-field

`schema.safeParse()` only runs field-level validation. `validate()` adds cross-field checks (`sameAs`, `requiredWhen`) after Zod parsing:

```ts
// safeParse — field-level only, no cross-field
const zodResult = schema.safeParse(data)

// validate — runs field-level + cross-field
const result = await validate(schema, data)
```

## Chainable Methods

Import `@validex/core` and all Zod schemas get these methods (intended for use on string schemas):

### Checks (return same type, add refinement)

| Method | Options | Description |
|--------|---------|-------------|
| `.hasUppercase(opts?)` | `min?, max?` | Requires uppercase letters |
| `.hasLowercase(opts?)` | `min?, max?` | Requires lowercase letters |
| `.hasDigits(opts?)` | `min?, max?` | Requires digits |
| `.hasSpecial(opts?)` | `min?, max?` | Requires special characters |
| `.noEmails(opts?)` | — | Blocks email addresses |
| `.noUrls(opts?)` | — | Blocks URLs |
| `.noHtml(opts?)` | — | Blocks HTML tags |
| `.noPhoneNumbers(opts?)` | — | Blocks phone numbers |
| `.noSpaces(opts?)` | — | Blocks whitespace |
| `.onlyAlpha(opts?)` | — | Letters only |
| `.onlyNumeric(opts?)` | — | Digits only |
| `.onlyAlphanumeric(opts?)` | — | Letters + digits |
| `.onlyAlphaSpaceHyphen(opts?)` | — | Letters, spaces, hyphens |
| `.onlyAlphanumericSpaceHyphen(opts?)` | — | Letters, digits, spaces, hyphens |
| `.maxWords(opts)` | `max` | Maximum word count |
| `.minWords(opts)` | `min` | Minimum word count |
| `.maxConsecutive(opts)` | `max` | Max consecutive identical chars |

### Transforms (return ZodPipe)

| Method | Description |
|--------|-------------|
| `.toTitleCase()` | Converts to Title Case |
| `.toSlug()` | Converts to URL-safe slug |
| `.stripHtml()` | Removes HTML tags |
| `.collapseWhitespace()` | Collapses multiple spaces to single |
| `.emptyToUndefined()` | Converts `""` to `undefined` |

```ts
import { z } from 'zod'
import '@validex/core'

const schema = z.string().hasUppercase({ min: 2 }).noSpaces().toSlug()
```

## Check Functions

Pure functions, no Zod dependency. Import from `@validex/core/checks`.

### Composition

| Function | Signature | Description |
|----------|-----------|-------------|
| `hasUppercase` | `(value: string, min: number, max?: number) => boolean` | Uppercase letter count within `[min, max]` |
| `hasLowercase` | `(value: string, min: number, max?: number) => boolean` | Lowercase letter count within `[min, max]` |
| `hasDigits` | `(value: string, min: number, max?: number) => boolean` | Digit count within `[min, max]` |
| `hasSpecial` | `(value: string, min: number, max?: number) => boolean` | Special character count within `[min, max]` |

### Detection

| Function | Signature | Description |
|----------|-----------|-------------|
| `containsEmail` | `(value: string) => boolean` | Detects email-like patterns |
| `containsUrl` | `(value: string) => boolean` | Detects URL-like patterns |
| `containsHtml` | `(value: string) => boolean` | Detects HTML tags |
| `containsPhoneNumber` | `(value: string) => Promise<boolean>` | Detects phone numbers (async, uses libphonenumber-js) |

### Restriction

| Function | Signature | Description |
|----------|-----------|-------------|
| `onlyAlpha` | `(value: string) => boolean` | Every character is a unicode letter |
| `onlyNumeric` | `(value: string) => boolean` | Every character is a digit |
| `onlyAlphanumeric` | `(value: string) => boolean` | Every character is a letter or digit |
| `onlyAlphaSpaceHyphen` | `(value: string) => boolean` | Letters, spaces, hyphens only |
| `onlyAlphanumericSpaceHyphen` | `(value: string) => boolean` | Letters, digits, spaces, hyphens only |

### Limits

| Function | Signature | Description |
|----------|-----------|-------------|
| `maxWords` | `(value: string, max: number) => boolean` | At most `max` words |
| `minWords` | `(value: string, min: number) => boolean` | At least `min` words |
| `maxConsecutive` | `(value: string, max: number) => boolean` | No character repeats more than `max` times |
| `noSpaces` | `(value: string) => boolean` | No whitespace characters |

### Transforms

| Function | Signature | Description |
|----------|-----------|-------------|
| `emptyToUndefined` | `(value: unknown) => unknown` | `""` and `null` to `undefined` |
| `toTitleCase` | `(value: string) => string` | Title Case with hyphen/apostrophe handling |
| `toSlug` | `(value: string) => string` | URL-safe slug |
| `stripHtml` | `(value: string) => string` | Removes HTML tags |
| `collapseWhitespace` | `(value: string) => string` | Collapses whitespace, trims |

```ts
import { hasUppercase, containsEmail, toSlug } from '@validex/core/checks'

hasUppercase('Hello', 1)    // true
containsEmail('hi@test.com') // true
toSlug('Hello World!')       // 'hello-world'
```

## Error Handling

### Error structure

Every validex error carries structured metadata via Zod's custom error params:

```ts
ctx.addIssue({
  code: 'custom',
  params: {
    code: 'disposableBlocked',
    namespace: 'email',
    label: 'Email',
    domain: 'tempmail.com',
  },
})
```

### `getParams(issue)`

Extract structured metadata from any Zod issue:

```ts
import { Email, getParams } from '@validex/core'

const schema = Email()
const result = schema.safeParse('user@tempmail.com')

if (!result.success) {
  const params = getParams(result.error.issues[0])
  // { code: 'disposableBlocked', namespace: 'email', label: 'Email',
  //   key: 'validation.messages.email.disposableBlocked', path: [], ... }
}
```

### Error code pattern

Keys follow: `validation.messages.{namespace}.{code}`

- `validation.messages.email.disposableBlocked`
- `validation.messages.password.commonBlocked`
- `validation.messages.username.reservedBlocked`

### `validate()` result

```ts
interface ValidationResult<T> {
  readonly success: boolean
  readonly data?: T                                    // typed parsed data (when success)
  readonly errors: Record<string, readonly string[]>   // dot-path to all messages
  readonly firstErrors: Record<string, string>         // dot-path to first message
  readonly nestedErrors: NestedErrors                  // nested object matching schema shape
  readonly issues: ReadonlyArray<unknown>              // raw Zod issues (escape hatch)
}
```

## i18n

### Setup

```ts
import { setup } from '@validex/core'

setup({
  i18n: {
    enabled: true,
    prefix: 'validation',    // default
    separator: '.',          // default
    t: (key, params) => i18next.t(key, params),
  },
})
```

### Key pattern

`validation.messages.{namespace}.{code}`

When `i18n.enabled` is `true` and `t()` is provided, validex calls `t()` automatically for every error message and field label.

### Label transforms

```ts
setup({
  label: {
    fallback: 'derived',  // 'derived' | 'generic' | 'none'
    transform: ({ path, fieldName, defaultLabel }) => {
      return myLabelLookup(fieldName) ?? defaultLabel
    },
  },
})
```

### CLI

```bash
npx validex fr de --output ./locales
npx validex ja --empty --output ./locales
```

Full guide with all 141 error codes: [Translation Guide](https://github.com/chiptoma/validex/blob/main/docs/I18N.md)

## Custom Rules

### `createRule()`

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

### `customFn`

Every rule accepts a `customFn` that runs after built-in checks. Return `true` to pass or a string to fail:

```ts
import { Email } from '@validex/core'

const schema = Email({
  customFn: (value) => value.endsWith('.org') || 'Must be a .org domain',
})

schema.parse('info@example.org')  // OK
schema.parse('info@example.com')  // throws — "Must be a .org domain"
```

### Custom regex

Rules that extend `FormatRuleOptions` (like `Text`) accept a `regex` property:

```ts
import { Text } from '@validex/core'

const schema = Text({
  regex: /^[^<>]+$/,
})
```

Full reference: [API Reference](https://github.com/chiptoma/validex/blob/main/docs/API.md)

## Framework Adapters

### Nuxt

```bash
pnpm add @validex/nuxt
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@validex/nuxt'],
  validex: {
    rules: { email: { blockDisposable: true } },
  },
})
```

```ts
// In a component — useValidation is auto-imported
const { validate, errors, firstErrors, isValid } = useValidation(schema)
```

Full guide: [@validex/nuxt README](https://github.com/chiptoma/validex/tree/main/packages/nuxt#readme)

### Fastify

```bash
pnpm add @validex/fastify
```

```ts
import Fastify from 'fastify'
import { validexPlugin } from '@validex/fastify'

const app = Fastify()
await app.register(validexPlugin, {
  rules: { email: { blockDisposable: true } },
})
```

Full guide: [@validex/fastify README](https://github.com/chiptoma/validex/tree/main/packages/fastify#readme)

## Documentation

| Resource | Description |
|----------|-------------|
| [API Reference](https://github.com/chiptoma/validex/blob/main/docs/API.md) | Every rule, option, default, error code |
| [Translation Guide](https://github.com/chiptoma/validex/blob/main/docs/I18N.md) | i18n setup, CLI, all 141 error codes |
| [Contributing](https://github.com/chiptoma/validex/blob/main/CONTRIBUTING.md) | Dev setup, conventions, PR workflow |

## License

[MIT](./LICENSE)
