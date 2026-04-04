# @validex/nuxt

[![npm version](https://img.shields.io/npm/v/@validex/nuxt)](https://www.npmjs.com/package/@validex/nuxt)
[![npm downloads](https://img.shields.io/npm/dm/@validex/nuxt)](https://www.npmjs.com/package/@validex/nuxt)
[![build](https://img.shields.io/github/actions/workflow/status/chiptoma/validex/ci.yml)](https://github.com/chiptoma/validex/actions)
[![TypeScript 5.0+](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![license MIT](https://img.shields.io/npm/l/@validex/nuxt)](https://github.com/chiptoma/validex/blob/main/LICENSE)

Nuxt module for [validex](https://github.com/chiptoma/validex) — auto-imports all 25 validation rules and the `useValidation` composable.

---

- [Prerequisites](#prerequisites)
- [Install](#install)
- [Nuxt Module Setup](#nuxt-module-setup) — nuxt.config.ts configuration
- [Module Options](#module-options) — rules, i18n, preload
- [Standalone Setup](#standalone-setup) — outside Nuxt context
- [`useValidation` Composable](#usevalidation-composable) — reactive validation state
- [Auto-Imports](#auto-imports) — all rules available without import
- [Preloading Data](#preloading-data) — server-side data loading
- [i18n Integration](#i18n-integration) — @nuxtjs/i18n auto-detection

---

## Prerequisites

`@validex/core` and `zod` must be installed as peer dependencies.

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
      password: { length: { min: 10 } },
    },
  },
})
```

## Module Options

```ts
interface ValidexNuxtOptions {
  rules?: GlobalConfig['rules']   // Per-rule defaults (same as setup({ rules }))
  i18n?: {
    enabled?: boolean             // Enable i18n key mode
    prefix?: string               // Key prefix (default: 'validation')
    separator?: string            // Key separator (default: '.')
    pathMode?: 'semantic' | 'key' | 'full' | PathTransform
  }
  preload?: PreloadOptions        // Data files to preload at startup
}
```

## Standalone Setup

For use outside of the Nuxt module system (e.g., in a plugin):

```ts
// plugins/validex.ts
import { setupValidex } from '@validex/nuxt'

await setupValidex({
  rules: {
    email: { blockDisposable: true },
  },
  preload: {
    disposable: true,
    passwords: 'basic',
  },
})
```

## `useValidation` Composable

Returns reactive Vue refs that automatically trigger template re-renders when validation state changes.

```ts
import { useValidation } from '@validex/nuxt'
import { Email, Password } from '@validex/core'
import { z } from 'zod'

const schema = z.object({
  email: Email(),
  password: Password(),
})

const {
  validate,    // (data: unknown) => Promise<ValidationResult<T>>
  clearErrors, // () => void — resets all errors
  errors,      // ShallowRef<Record<string, readonly string[]>>
  firstErrors, // ShallowRef<Record<string, string>>
  isValid,     // ShallowRef<boolean>
  data,        // ShallowRef<T | undefined>
} = useValidation(schema)

await validate({ email: 'user@example.com', password: 'Str0ng!Pass' })
// errors, firstErrors, isValid, data are reactive shallow refs
// Templates re-render automatically when they change
```

```vue
<script setup lang="ts">
import { useValidation } from '@validex/nuxt'
import { Email, Password } from '@validex/core'
import { z } from 'zod'

const schema = z.object({
  email: Email(),
  password: Password(),
})

const { validate, clearErrors, firstErrors, isValid } = useValidation(schema)

async function onSubmit(formData: Record<string, unknown>) {
  clearErrors()
  await validate(formData)
  // isValid and firstErrors refs update automatically
}
</script>

<template>
  <form @submit.prevent="onSubmit(formData)">
    <input v-model="formData.email" />
    <span v-if="firstErrors.email" class="error">
      {{ firstErrors.email }}
    </span>

    <input v-model="formData.password" type="password" />
    <span v-if="firstErrors.password" class="error">
      {{ firstErrors.password }}
    </span>

    <button :disabled="!isValid">Submit</button>
  </form>
</template>
```

## Auto-Imports

When used as a Nuxt module, the following are auto-imported (no explicit `import` needed):

- **All 25 rules:** `Email`, `Password`, `PasswordConfirmation`, `PersonName`, `BusinessName`, `Phone`, `Website`, `Url`, `Username`, `Slug`, `PostalCode`, `LicenseKey`, `Uuid`, `Jwt`, `DateTime`, `Token`, `Text`, `Country`, `Currency`, `Color`, `CreditCard`, `Iban`, `VatNumber`, `MacAddress`, `IpAddress`
- **`validate`** — core validation function
- **`validexSetup`** — `setup()` from `@validex/core`, aliased to avoid conflict with Nuxt's own `setup`
- **`useValidation`** — composable for validation state management

## Preloading Data

Preload async data files at startup so first validation has no delay:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@validex/nuxt'],
  validex: {
    preload: {
      disposable: true,
      passwords: 'moderate',
      phone: 'mobile',
      countryCodes: true,
    },
  },
})
```

## i18n Integration

Automatically detects `@nuxtjs/i18n` and enables translation mode. No extra configuration needed:

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n', '@validex/nuxt'],
  // validex i18n is auto-enabled when @nuxtjs/i18n is present
})
```

To configure manually:

```ts
export default defineNuxtConfig({
  modules: ['@validex/nuxt'],
  validex: {
    i18n: {
      enabled: true,
      prefix: 'validation',
      separator: '.',
    },
  },
})
```

## Documentation

- [Full API Reference](https://github.com/chiptoma/validex/blob/main/docs/API.md)
- [Translation Guide](https://github.com/chiptoma/validex/blob/main/docs/I18N.md)
- [Core Documentation](https://github.com/chiptoma/validex)

## License

[MIT](https://github.com/chiptoma/validex/blob/main/LICENSE)
