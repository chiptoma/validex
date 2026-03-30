# validex

[![npm version](https://img.shields.io/npm/v/validex)](https://www.npmjs.com/package/validex)
[![build](https://img.shields.io/github/actions/workflow/status/nicepkg/validex/ci.yml)](https://github.com/nicepkg/validex/actions)
[![TypeScript 5.0+](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![license MIT](https://img.shields.io/npm/l/validex)](./LICENSE)

**Type-safe validation rules built on Zod 4** — tree-shakeable, so you only ship what you use.

## Install

```bash
pnpm add validex zod
```

## Quick Start

### Single rule

```ts
import { Email } from 'validex'

const EmailSchema = Email()
EmailSchema.parse('hello@example.com') // OK
EmailSchema.parse('not-an-email')      // throws ZodError
```

### Rule with options

```ts
import { Password } from 'validex'

const PasswordSchema = Password({
  minLength: 10,
  requireUppercase: true,
  requireNumber: true,
  requireSpecial: true,
})

PasswordSchema.parse('Str0ng!Pass') // OK
```

### Composed schema with `validate()`

```ts
import { z } from 'zod'
import { Email, Password } from 'validex'
import { validate } from 'validex/utilities'

const LoginSchema = z.object({
  email: Email(),
  password: Password({ minLength: 8 }),
})

const result = validate(LoginSchema, {
  email: 'user@example.com',
  password: 'Secret1!',
})

if (result.success) {
  console.log(result.data) // typed as { email: string; password: string }
} else {
  console.log(result.errors) // structured error list
}
```

## Tree-Shaking

Import only what you use. Email validation alone is **1.9 kB** (Brotli).

```ts
// Only Email lands in your bundle — nothing else
import { Email } from 'validex'
```

Bundlers (Vite, Rollup, esbuild, webpack 5) eliminate unused rules at build time. Every rule factory is annotated with `/*#__PURE__*/` so dead-code elimination works out of the box.

## Why validex?

- **One config system** — `setup()` applies defaults globally, per-rule, or per-call.
- **One error surface** — every rule returns standard Zod errors; `validate()` wraps them into a flat `ValidationResult`.
- **25 rules** — covering identity, auth, networking, finance, and general text.
- **i18n-ready** — swap error messages via key mode, `t()` function, or label transforms.
- **Tree-shakeable** — import 2 rules and ship 3.5 kB. Import all 25 and ship 13 kB (Brotli).

## Rules

| Rule | Import | Description |
| --- | --- | --- |
| Email | `Email` | Email address with optional MX-like and disposable checks |
| Password | `Password` | Strength rules: length, casing, digits, specials, common-password ban |
| PasswordConfirmation | `PasswordConfirmation` | Confirms two password fields match |
| PersonName | `PersonName` | Human name with unicode support and length limits |
| BusinessName | `BusinessName` | Company/organization name validation |
| Phone | `Phone` | International phone via libphonenumber-js |
| Website | `Website` | URL restricted to http/https with optional www |
| URL | `Url` | General URL with protocol and format validation |
| Username | `Username` | Alphanumeric with configurable separators and reserved-word ban |
| Slug | `Slug` | URL-safe slug (lowercase, hyphens, length limits) |
| PostalCode | `PostalCode` | Country-aware postal/ZIP code |
| LicenseKey | `LicenseKey` | Software license key format (groups, separators, charset) |
| UUID | `Uuid` | UUID v1-v7 validation |
| JWT | `Jwt` | JSON Web Token structure and optional claim checks |
| DateTime | `DateTime` | Date/time string with format and range constraints |
| Token | `Token` | Generic token validation (hex, base64, nanoid, etc.) |
| Text | `Text` | Free text with length, word count, and pattern rules |
| Country | `Country` | ISO 3166 country code (alpha-2, alpha-3, numeric) |
| Currency | `Currency` | ISO 4217 currency code |
| Color | `Color` | Hex, RGB, HSL, and named CSS color formats |
| CreditCard | `CreditCard` | Card number with Luhn check and issuer detection |
| IBAN | `Iban` | International Bank Account Number with country patterns |
| VatNumber | `VatNumber` | EU VAT identification number |
| MacAddress | `MacAddress` | MAC address (colon, hyphen, and dot notations) |
| IpAddress | `IpAddress` | IPv4 and IPv6 with optional CIDR notation |

## Configuration

Use `setup()` to apply defaults globally or per-rule:

```ts
import { setup, Email, Password } from 'validex'

setup({
  rules: {
    email: { allowDisposable: false },
    password: { minLength: 10, requireSpecial: true },
  },
  i18n: {
    t: (key, params) => translate(key, params),
  },
})

// Rules now use your defaults — no need to pass options every time
const EmailSchema = Email()
const PasswordSchema = Password()
```

Options merge in three tiers: **global defaults** < **setup() config** < **per-call options**.

## i18n

Pass a `t()` function to `setup()` and all error messages become translation keys:

```ts
import { setup } from 'validex'

setup({
  i18n: {
    t: (key, params) => i18next.t(key, params),
  },
})
```

Keys follow the pattern `validex.<rule>.<check>` (e.g., `validex.email.invalid`, `validex.password.tooShort`).

## Framework Adapters

### Nuxt

```ts
// plugins/validex.ts
import { defineNuxtPlugin } from '#app'
import { setup } from 'validex'

export default defineNuxtPlugin(() => {
  setup({ /* your config */ })
})
```

```vue
<script setup lang="ts">
import { useValidation } from 'validex/nuxt'
import { Email, Password } from 'validex'
import { z } from 'zod'

const schema = z.object({
  email: Email(),
  password: Password(),
})

const { errors, validate, isValid } = useValidation(schema)
</script>
```

### Fastify

```ts
import Fastify from 'fastify'
import { validexPlugin } from 'validex/fastify'
import { Email, Password } from 'validex'
import { z } from 'zod'

const app = Fastify()

await app.register(validexPlugin)

app.post('/login', {
  schema: {
    body: z.object({
      email: Email(),
      password: Password(),
    }),
  },
}, async (request) => {
  return { ok: true }
})
```

## Custom Rules

Build your own rule with `createRule()`:

```ts
import { createRule } from 'validex'

const hexColor = createRule<{ allowAlpha?: boolean }>({
  name: 'hexColor',
  message: 'Invalid hex color',
  check: (value, options) => {
    const pattern = options?.allowAlpha
      ? /^#[\da-f]{6,8}$/i
      : /^#[\da-f]{6}$/i
    return pattern.test(value)
  },
})

const HexColor = hexColor({ allowAlpha: true })
HexColor.parse('#ff00aacc') // OK
```

## Custom Validation

### Custom function

```ts
import { Email } from 'validex'

const WorkEmail = Email({
  customFn: (value) => {
    if (value.endsWith('@gmail.com')) return 'Use your work email'
    return true
  },
})
```

### Custom regex

```ts
import { Text } from 'validex'

const NoHtml = Text({
  regex: { pattern: /^[^<>]+$/, message: 'HTML tags not allowed' },
})
```

## Bundle Sizes

Measured with [size-limit](https://github.com/ai/size-limit), Brotli compression:

| Import | Size (Brotli) |
| --- | --- |
| `Email` only | 1.9 kB |
| `Email` + `Password` | 3.5 kB |
| Full library (all 25 rules) | 13 kB |

Data files (common passwords, country codes, IBAN patterns) are loaded on demand and not included in the base bundle.

## License

[MIT](./LICENSE)
