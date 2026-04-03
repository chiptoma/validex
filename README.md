# validex

[![npm version](https://img.shields.io/npm/v/@validex/core)](https://www.npmjs.com/package/@validex/core)
[![build](https://img.shields.io/github/actions/workflow/status/chiptoma/validex/ci.yml)](https://github.com/chiptoma/validex/actions)
[![TypeScript 5.0+](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![license MIT](https://img.shields.io/npm/l/@validex/core)](./LICENSE)

**Type-safe validation rules built on Zod** — tree-shakeable, so you only ship what you use.

## Install

```bash
pnpm add @validex/core zod

# Optional framework adapters
pnpm add @validex/nuxt    # for Nuxt projects
pnpm add @validex/fastify # for Fastify projects
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
  console.log(result.errors)      // Record<string, string[]>
  console.log(result.firstErrors) // Record<string, string>
}
```

## Tree-Shaking

Import only what you use. Bundlers (Vite, Rollup, esbuild, webpack 5) eliminate unused rules at build time. Every rule factory is annotated with `/*#__PURE__*/` so dead-code elimination works out of the box.

```ts
// Only Email lands in your bundle
import { Email } from '@validex/core'
```

## Why validex?

- **One config system** — `setup()` applies defaults globally, per-rule, or per-call. Options merge in three tiers: built-in defaults < `setup()` config < per-call options.
- **One error surface** — every rule returns standard Zod errors; `validate()` wraps them into a structured `ValidationResult` with `errors`, `firstErrors`, `nestedErrors`, and `issues`.
- **25 rules** — covering identity, auth, networking, finance, and general text.
- **i18n-ready** — swap error messages via key mode, `t()` function, or label transforms. Keys follow `validation.messages.{namespace}.{code}`.
- **Tree-shakeable** — import 2 rules and ship ~6 kB Brotli. Import all 25 and ship ~13 kB Brotli (excluding zod). Data files load on demand.
- **Framework adapters** — first-class Nuxt and Fastify integrations.

## Rules

| Rule | Import | Description |
| --- | --- | --- |
| Email | `Email` | Email address with domain filtering, plus-alias blocking, and disposable detection |
| Password | `Password` | Strength rules: length, casing, digits, specials, consecutive limits, common-password ban |
| PasswordConfirmation | `PasswordConfirmation` | Confirms two password fields match |
| PersonName | `PersonName` | Human name with unicode support, word count, and boundary rules |
| BusinessName | `BusinessName` | Company/organization name with boundary and consecutive limits |
| Phone | `Phone` | International phone via libphonenumber-js |
| Website | `Website` | URL restricted to http/https with optional www and domain filtering |
| URL | `Url` | General URL with protocol, TLD, and domain validation |
| Username | `Username` | Alphanumeric with configurable separators and reserved-word ban |
| Slug | `Slug` | URL-safe slug (lowercase, hyphens, length limits) |
| PostalCode | `PostalCode` | Country-aware postal/ZIP code |
| LicenseKey | `LicenseKey` | Software license key format (segments, separators, charset) |
| UUID | `Uuid` | UUID v1-v7 validation |
| JWT | `Jwt` | JSON Web Token structure with optional expiry checks |
| DateTime | `DateTime` | Date/time string with format and range constraints |
| Token | `Token` | Generic token validation (hex, base64, nanoid, etc.) |
| Text | `Text` | Free text with length, word count, content detection, and regex override |
| Country | `Country` | ISO 3166 country code (alpha-2, alpha-3, numeric) |
| Currency | `Currency` | ISO 4217 currency code |
| Color | `Color` | Hex, RGB, HSL, and named CSS color formats |
| CreditCard | `CreditCard` | Card number with Luhn check and issuer detection |
| IBAN | `Iban` | International Bank Account Number with country patterns |
| VatNumber | `VatNumber` | EU VAT identification number |
| MacAddress | `MacAddress` | MAC address (colon, hyphen, and dot notations) |
| IpAddress | `IpAddress` | IPv4 and IPv6 with optional CIDR notation |

For complete API documentation with all options, defaults, and error codes, see [API Reference](./docs/API.md).

## Configuration

Use `setup()` to apply defaults globally or per-rule. Rule keys are the camelCase namespace names (not PascalCase factory names):

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

Options merge in three tiers: **built-in defaults** < **setup() config** < **per-call options**.

## i18n

Pass a `t()` function to `setup()` and all error messages become translation keys:

```ts
import { setup } from '@validex/core'

setup({
  i18n: {
    enabled: true,
    prefix: 'validation',    // default
    separator: '.',           // default
    t: (key, params) => i18next.t(key, params),
  },
})
```

Keys follow the pattern `validation.messages.{namespace}.{code}`:

- `validation.messages.email.invalid`
- `validation.messages.password.tooShort`
- `validation.messages.username.reserved`

Generate translation templates with the CLI:

```bash
npx validex fr de es --output ./locales
npx validex ja --empty --output ./locales
```

Use `getParams()` to extract structured error metadata from Zod issues:

```ts
import { getParams } from '@validex/core'

// Returns { code, namespace, label, key, path, ... }
const params = getParams(zodIssue)
```

For the complete translation guide with all 88 error codes and a ready-to-copy template, see [Translation Guide](./docs/I18N.md).

## Framework Adapters

### Nuxt

```bash
pnpm add @validex/nuxt
```

```ts
import { useValidation } from '@validex/nuxt'
```

See [@validex/nuxt README](./packages/nuxt/README.md) for full setup guide.

### Fastify

```bash
pnpm add @validex/fastify
```

```ts
import { validexPlugin } from '@validex/fastify'
```

See [@validex/fastify README](./packages/fastify/README.md) for full setup guide.

## Custom Rules

Build your own rule with `createRule()`:

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

## Custom Validation

### Custom function (`customFn`)

Every rule accepts a `customFn` that runs after built-in checks. Return `true` to pass or a string to fail:

```ts
import { Email } from '@validex/core'

const schema = Email({
  customFn: (value) => value.endsWith('.org') || 'Must be a .org domain',
})

schema.parse('info@example.org')  // OK
schema.parse('info@example.com')  // throws — "Must be a .org domain"
```

### Custom regex override

Rules that extend `FormatRuleOptions` (like `Text`) accept a `regex` property as a `RegExp`:

```ts
import { Text } from '@validex/core'

const schema = Text({
  regex: /^[^<>]+$/,
})
```

## Bundle Sizes

Every rule shares a ~5 kB core (Brotli compressed). Each additional rule adds 0.1–0.8 kB. Measured with esbuild (`--splitting`, Brotli), excluding `zod` peer dependency.

| Import | Initial bundle (Brotli) |
| --- | --- |
| Core only (setup + validate) | 5.1 kB |
| Single rule (e.g. Email) | 5.7 kB |
| Email + Password | 6.0 kB |
| Form (Email + Password + PersonName + Phone) | 6.9 kB |
| All 25 rules | 13.0 kB |

Data files are lazy-loaded on demand and are **not** included in the initial bundle:

| Data | Size (Brotli) | Loaded when |
| --- | --- | --- |
| Password list — basic (top 100) | 0.5 kB | `Password({ blockCommon: 'basic' })` |
| Password list — moderate (top 1,000) | 3.8 kB | `Password({ blockCommon: 'moderate' })` |
| Password list — strict (top 10,000) | 35.5 kB | `Password({ blockCommon: 'strict' })` |
| Country codes | 2.4 kB | `Country()` first use |
| IBAN patterns | 0.7 kB | `Iban()` first use |
| Reserved usernames | 0.8 kB | `Username({ blockReserved: true })` |
| Currency codes | 0.3 kB | `Currency()` first use |
| VAT patterns | 0.3 kB | `VatNumber()` first use |
| Credit card prefixes | 0.3 kB | `CreditCard()` first use |

Phone validation, postal codes, and disposable email detection use external packages (`libphonenumber-js`, `postcode-validator`, `disposable-email-domains`) which are peer/optional dependencies not included in these measurements.

Run `pnpm test:bundle-size` for per-rule measurements.

## License

[MIT](./LICENSE)
