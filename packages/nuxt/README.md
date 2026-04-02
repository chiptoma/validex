# @validex/nuxt

Nuxt module for [validex](https://github.com/chiptoma/validex) — auto-imports all 25 validation rules and the `useValidation` composable.

## Prerequisites

`@validex/core` and `zod` must be installed.

## Install

```bash
pnpm add @validex/core @validex/nuxt zod
```

## Nuxt Module Setup

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@validex/nuxt'],
  validex: {
    rules: {
      email: { blockDisposable: true },
    },
  },
})
```

## Standalone Setup

```ts
// plugins/validex.ts
import { setupValidex } from '@validex/nuxt'

await setupValidex({
  rules: {
    email: { blockDisposable: true },
  },
})
```

## useValidation Composable

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

if (!result.success) {
  console.log(getFirstErrors()) // { email: '...', password: '...' }
}
```

## Auto-Imports

When used as a Nuxt module, the following are auto-imported:

- All 25 rules: `Email`, `Password`, `PersonName`, `Phone`, `CreditCard`, etc.
- `validate` — core validation function
- `validexSetup` — aliased `setup()` for configuration
- `useValidation` — composable for reactive validation state

## i18n Integration

Automatically detects `@nuxtjs/i18n` and enables translation mode:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n', '@validex/nuxt'],
})
```

## Documentation

See the [main validex docs](https://github.com/chiptoma/validex) for the full API reference and configuration guide.
