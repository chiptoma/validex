# SPEC.md — validex

> **Version:** 2.0.0-draft  
> **Last Updated:** March 2026  
> **Status:** Architectural Revision  
> **Companion:** [BUILD.md](./BUILD.md) — Implementation Playbook

## Scope

**This document answers:**

- **What** — Features, behaviors, contracts
- **Why** — Rationale, trade-offs, constraints
- **Constraints** — Limits, invariants, error conditions

**This document does NOT answer:**

- **How** — Implementation patterns, algorithms
- **With what** — Libraries, services, infrastructure
- **In what structure** — File layouts, code organization

*Concrete implementation details reside in BUILD.md.*

-----

## Table of Contents

### Part I: Product Definition

1. [Executive Summary](#1-executive-summary)
- 1.1 [What Is It?](#11-what-is-it)
- 1.2 [Core Value Proposition](#12-core-value-proposition)
- 1.3 [Design Principles](#13-design-principles)
- 1.4 [Non-Goals (v1)](#14-non-goals-v1)
- 1.5 [Companion Documents](#15-companion-documents)

### Part II: Architecture and Public API

2. [System Architecture](#2-system-architecture)
- 2.1 [Layer Model](#21-layer-model)
- 2.2 [Package Organization](#22-package-organization)
- 2.3 [Dependencies](#23-dependencies)
- 2.4 [Runtime Support](#24-runtime-support)
3. [Public API Surface](#3-public-api-surface)
- 3.1 [Public Import Paths](#31-public-import-paths)
- 3.2 [Exports](#32-exports)
- 3.3 [Type Exports](#33-type-exports)
- 3.4 [Versioning Contract](#34-versioning-contract)
- 3.5 [Breaking Change Policy](#35-breaking-change-policy)

### Part III: Configuration and Error System

4. [Global Configuration](#4-global-configuration)
- 4.1 [Configuration Interface](#41-configuration-interface)
- 4.2 [i18n System](#42-i18n-system)
- 4.3 [Error Map Integration](#43-error-map-integration)
- 4.4 [Setup Lifecycle](#44-setup-lifecycle)
- 4.5 [Auto-Initialization Contract](#45-auto-initialization-contract)
- 4.6 [Zod customError Chaining](#46-zod-customerror-chaining)
5. [Error Handling](#5-error-handling)
- 5.1 [Error Code Taxonomy](#51-error-code-taxonomy)
- 5.2 [Parameter Interpolation](#52-parameter-interpolation)
- 5.3 [Error Behavior Matrix](#53-error-behavior-matrix)

### Part IV: Checks

6. [Checks](#6-checks)
- 6.1 [Check Contract](#61-check-contract)
- 6.2 [Character Composition Checks (has*)](#62-character-composition-checks-has)
- 6.3 [Content Detection Checks (contains*)](#63-content-detection-checks-contains)
- 6.4 [Character Restriction Checks (only*)](#64-character-restriction-checks-only)
- 6.5 [Limit Checks](#65-limit-checks)
- 6.6 [Schema Utilities](#66-schema-utilities)
- 6.7 [Transform Checks](#67-transform-checks)
- 6.8 [Data Sets](#68-data-sets)

### Part V: Rules

7. [Rules](#7-rules)
- 7.1 [Rule Design Contract](#71-rule-design-contract)
- 7.2 [Email](#72-email)
- 7.3 [PersonName](#73-personname)
- 7.4 [BusinessName](#74-businessname)
- 7.5 [Password](#75-password)
- 7.6 [PasswordConfirmation](#76-passwordconfirmation)
- 7.7 [Phone](#77-phone)
- 7.8 [Website](#78-website)
- 7.9 [URL](#79-url)
- 7.10 [Username](#710-username)
- 7.11 [Slug](#711-slug)
- 7.12 [PostalCode](#712-postalcode)
- 7.13 [LicenseKey](#713-licensekey)
- 7.14 [UUID](#714-uuid)
- 7.15 [JWT](#715-jwt)
- 7.16 [DateTime](#716-datetime)
- 7.17 [Token](#717-token)
- 7.18 [Text](#718-text)
- 7.19 [Country](#719-country)
- 7.20 [Currency](#720-currency)
- 7.21 [Color](#721-color)
- 7.22 [CreditCard](#722-creditcard)
- 7.23 [IBAN](#723-iban)
- 7.24 [VatNumber](#724-vatnumber)
- 7.25 [MacAddress](#725-macaddress)
- 7.26 [IpAddress](#726-ipaddress)

### Part VI: Schema Recipes

8. [Common Schema Patterns](#8-common-schema-patterns)
- 8.1 [Auth Flow Recipes](#81-auth-flow-recipes)

### Part VII: Testing and Constraints

9. [Testing Requirements](#9-testing-requirements)
- 9.1 [Test Categories](#91-test-categories)
- 9.2 [Coverage Requirements](#92-coverage-requirements)
- 9.3 [Test Data Sources](#93-test-data-sources)
- 9.4 [Property-Based Testing](#94-property-based-testing)
- 9.5 [Security Test Cases](#95-security-test-cases)
10. [Invariants and Limits](#10-invariants-and-limits)
- 10.1 [Performance Constraints](#101-performance-constraints)
- 10.2 [Size Constraints](#102-size-constraints)
- 10.3 [Compatibility Invariants](#103-compatibility-invariants)
- 10.4 [Security Invariants](#104-security-invariants)

### Part VIII: Framework Adapters

11. [Validation Result Contract](#11-validation-result-contract)
- 11.1 [ValidationResult Interface](#111-validationresult-interface)
- 11.2 [Error Output Shapes](#112-error-output-shapes)
12. [Nuxt Adapter](#12-nuxt-adapter-validexnuxt)
- 12.1 [Module Configuration](#121-module-configuration)
- 12.2 [Auto-Setup Behavior](#122-auto-setup-behavior)
- 12.3 [Composables](#123-composables)
- 12.4 [i18n Integration](#124-i18n-integration)
- 12.5 [SSR Considerations](#125-ssr-considerations)
13. [Fastify Adapter](#13-fastify-adapter-validexfastify)
- 13.1 [Plugin Registration](#131-plugin-registration)
- 13.2 [Instance Decorator](#132-instance-decorator)
- 13.3 [Request Decorator](#133-request-decorator)
- 13.4 [Route-Level Schema Validation](#134-route-level-schema-validation)
- 13.5 [Error Response Format](#135-error-response-format)

### Appendices

- [Appendix A: Migration from Zod](#appendix-a-migration-from-zod)
- [Appendix B: Glossary](#appendix-b-glossary)

-----

## Part I: Product Definition

### 1. Executive Summary

#### 1.1 What Is It?

validex is a TypeScript validation library built on Zod 4 that provides:

- **Checks** — Pure functions for character composition, content detection, and input restriction
- **Rules** — Configurable business-logic validators (Email, Password, Phone, etc.) that compose Zod 4 native checks with custom checks
- **Global i18n** — Full ownership of the error surface: configure once, get consistent English messages or structured i18n keys for every error, whether it originates from Zod or from validex
- **Schema Recipes** — Documented common form patterns (Login, Register, PasswordReset) as composable examples
- **Framework Adapters** — Subpath imports for Nuxt and Fastify (`@validex/nuxt`, `@validex/fastify`)

**Single purpose:** Eliminate validation rewriting across projects.

**Relationship to Zod 4:** validex delegates base-level validation (string formats, type checking, min/max) to Zod 4's native validators. It adds business logic, curated data sets, and a unified error surface on top. No prototype patching. No monkey-patching. Rules compose Zod schemas using standard Zod APIs (`.refine()`, `.superRefine()`, `.pipe()`).

#### 1.2 Core Value Proposition

|Without validex        |With validex                              |
|-----------------------|------------------------------------------|
|Copy-paste email regex |`Email({ blockDisposable: true })`        |
|Rewrite password rules |`Password({ special: { min: 1 } })`       |
|Per-field i18n wiring  |`setup({ i18n: {...} })` once             |
|Inconsistent validation|Same rules everywhere                     |
|Inconsistent errors    |One error voice: Zod + business rules unified|
|Untested edge cases    |Comprehensive test coverage (see Part VII)|
|Framework boilerplate  |`@validex/nuxt`, `@validex/fastify` adapters|

#### 1.3 Design Principles

1. **Configure, don't rewrite** — Options for business rules, not hardcoded behavior
2. **Compose Zod 4, don't patch it** — Use Zod 4's native validators and standard composition APIs. No prototype mutation. No Zod extension registration.
3. **Test exhaustively** — RFC vectors, fuzzing, property-based tests
4. **Own the error surface** — Every error (Zod native or validex custom) passes through a single formatting layer producing consistent English messages or i18n keys
5. **Three consumer-facing levels** — Checks (building blocks), Rules (batteries included), and Schemas (common form patterns), all built on Zod 4
6. **Runtime-agnostic core** — Deno, Node, browser with zero changes
7. **Zero initial bundle cost** — Heavy dependencies loaded lazily on demand
8. **Lazy configuration** — Rules read global config at parse-time, not creation-time. `setup()` order relative to imports doesn't matter.

#### 1.4 Non-Goals (v1)

|Excluded                                |Rationale                             |
|----------------------------------------|--------------------------------------|
|Async validation (MX DNS lookup, external API calls)|No network calls at runtime. Lazy-loading via dynamic import() is used for data files but is not "async validation"|
|UI components                           |Out of scope, use with any framework  |
|Form state management                   |Use React Hook Form, VeeValidate, etc.|
|Server-side only features               |Must work in browser                  |
|Custom error renderers                  |Consumer's responsibility             |
|Database-aware validation (unique check)|Requires DB connection                |
|Zod 3 compatibility                     |Clean break; Zod 4 is stable          |
|`zod/mini` compatibility               |validex uses `.refine()` / `.superRefine()` method chains extensively. Zod Mini uses a functional API incompatible with this pattern. The audiences don't overlap — Zod Mini targets extreme bundle minimalism, validex targets comprehensive validation.|
|Zod plugin registry / extension system  |Fragile, import-order-dependent. Controlled ZodType.prototype augmentation via initAugmentation() is used intentionally (see §6.1)|
|Adapter monolith                        |Adapters are separate packages (@validex/nuxt, @validex/fastify) with peer dependency on @validex/core|
|Schema auto-loading from file paths     |Project structure is consumer's concern; validex provides docs/guides|

#### 1.5 Companion Documents

|Document    |Purpose                                                       |
|------------|--------------------------------------------------------------|
|SPEC.md     |This file — full specification, contracts, constraints         |
|BUILD.md    |Implementation playbook — phases, file structure, CI/CD        |
|OPTIONS.md  |Complete options reference — all 25 rules, defaults, error codes|
|DEFAULTS.md |All rule defaults with rationale                               |
|CLAUDE.md   |Development rules — code quality standards for implementation  |
|CHANGELOG.md|Version history (conventional changelog)                       |
|README.md   |Consumer documentation                                         |

**Scope boundary:** SPEC defines contracts and constraints abstractly. Concrete module organization, file layouts, and implementation patterns reside in BUILD.md. CLAUDE.md defines coding standards and patterns enforced during implementation.

-----

## Part II: Architecture and Public API

### 2. System Architecture

#### 2.1 Layer Model

```
┌─────────────────────────────────────────────────────────────┐
│                      Consumer Code                          │
├─────────────────────────────────────────────────────────────┤
│  Adapters (optional)  │  validex/nuxt, /next, /fastify      │
├─────────────────────────────────────────────────────────────┤
│  Layer 3: Recipes     │  Documented patterns (Login, Register) │
├─────────────────────────────────────────────────────────────┤
│  Layer 2: Rules       │  Email(), Password(), Phone()       │
│  (compose Zod 4 native checks + custom checks)             │
├─────────────────────────────────────────────────────────────┤
│  Layer 1: Checks      │  hasUppercase(), maxWords(), etc.   │
│  (pure functions, no Zod coupling)                          │
│  Schema Utilities     │  sameAs(), requiredWhen()           │
│  (Zod-coupled, cross-field)                                 │
├─────────────────────────────────────────────────────────────┤
│  Layer 0: Zod 4       │  z.email(), z.uuid(), z.url(), etc. │
│  (via zod/v4)                                               │
└─────────────────────────────────────────────────────────────┘
```

**Dependency rule:** Each layer may only depend on layers below it. Adapters depend on all core layers.

**Config dependency:** All layers read from the global config store. Config flows orthogonally (not through the layer stack).

```
Adapters → Schemas → Rules → Checks → Zod 4
                ↘       ↘       ↘
                    Config Store
```

#### 2.2 Package Organization

validex ships as a **single npm package** with subpath exports. Framework adapters are subpath imports, not separate packages.

```json
{
  "name": "validex",
  "exports": {
    ".":         "./dist/core/index.js",
    "./checks":  "./dist/checks/index.js",
    "./rules":   "./dist/rules/index.js",
    "./utilities": "./dist/utilities/index.js",
    "./nuxt":    "./dist/adapters/nuxt/index.js",
    "./next":    "./dist/adapters/next/index.js",
    "./fastify": "./dist/adapters/fastify/index.js"
  },
  "sideEffects": false,
  "peerDependencies": {
    "zod": "^3.25.0 || ^4.0.0"
  },
  "peerDependenciesMeta": {
    "nuxt":    { "optional": true },
    "next":    { "optional": true },
    "react":   { "optional": true },
    "fastify": { "optional": true }
  }
}
```

**Rationale:** Single package avoids multi-package maintenance overhead. Framework dependencies are optional peers — only required when importing the corresponding subpath. Consumers who only use the core never install or bundle framework code.

**Tree-shaking contract:** All exports are named. With `sideEffects: false`, bundlers can tree-shake unused rules. The augmentation side effect is preserved via `initAugmentation()` — a named function call in the entry point that bundlers never remove (only `/* @__PURE__ */` calls are removed). If a consumer imports only `Email` from `validex`, only the Email rule, its checks, the augmentation, and the config system are bundled — no other rules, no adapter code.

**Import patterns:**

```typescript
import { Email, Password, setup } from '@validex/core';           // Core
import { useValidation } from '@validex/nuxt';                // Nuxt composables
import { validexPlugin } from '@validex/fastify';             // Fastify plugin
```

#### 2.3 Dependencies

**Required:**

- `zod` ^3.25.0 || ^4.0.0 — Peer dependency. Consumers import from `zod/v4` or `zod` (post-npm bump).
- `libphonenumber-js` (core only) — Regular dependency (~8kb). Only bundled if `Phone` rule is imported. Metadata files are bundled inside validex as JSON.

**Optional (peer, framework adapters):**

- `nuxt` ^3.0.0 — Required only when importing `@validex/nuxt`
- `fastify` ^5.0.0 — Required only when importing `@validex/fastify`

Framework peer deps are declared with `"optional": true` in `peerDependenciesMeta`. Consumers who don't import adapter subpaths never need these installed.

**Dependency direction:** Higher layers depend on lower layers. No circular dependencies.

```
Schemas → Rules → Checks → Config
```

#### 2.4 Runtime Support

|Runtime              |Supported|
|---------------------|---------|
|Deno                 |✓        |
|Node (ESM)           |✓        |
|Browser (via bundler)|✓        |

**Constraints:**

- ESM only — CommonJS not supported
- Data-dependent features require async parsing (see 7.1 Rule Design Contract)
- `zod/mini` not supported in v1. Rules return full `zod/v4` schemas.

-----

### 3. Public API Surface

#### 3.1 Public Import Paths

|Path               |Contents                                |
|--------------------|----------------------------------------|
|`validex`           |All rules, checks, schemas, utilities, config|
|`validex/rules`     |Rules only                              |
|`validex/checks`    |Check functions only (pure, no Zod)     |
|`validex/utilities` |Schema utilities (sameAs, requiredWhen) |
|`@validex/nuxt`      |Nuxt module, composables                |
|`@validex/fastify`   |Fastify plugin, decorators              |

#### 3.2 Exports

```typescript
// Configuration
export { configure, getConfig, setup, preloadData } from "./config";

// Core validation utility
export { validate } from "./validate";

// Utility
export { getParams } from "./utils";

// Rule factory (for custom rules)
export { createRule } from "./createRule";

// Schema Utilities (Zod-coupled, cross-field)
export { requiredWhen, sameAs } from "./utilities";

// Checks — Character Composition
export { hasUppercase, hasLowercase, hasDigits, hasSpecial } from "./checks";

// Checks — Content Detection
export { containsEmail, containsUrl, containsHtml, containsPhoneNumber } from "./checks";

// Checks — Character Restriction
export { onlyAlpha, onlyNumeric, onlyAlphanumeric } from "./checks";
export { onlyAlphaSpaceHyphen, onlyAlphanumericSpaceHyphen } from "./checks";

// Checks — Limits
export { maxWords, maxConsecutive, noSpaces } from "./checks";

// Checks — Transforms
export { emptyToUndefined, toTitleCase, toSlug, stripHtml, collapseWhitespace } from "./checks";

// Rules
export { Email, PersonName, BusinessName, Password, PasswordConfirmation } from "./rules";
export { Phone, Website, Url, Username, Slug } from "./rules";
export { PostalCode, LicenseKey, Uuid, Jwt, DateTime } from "./rules";
export { Token, Text, Country, Currency, Color } from "./rules";
export { CreditCard, Iban, VatNumber, MacAddress, IpAddress } from "./rules";
```

**What is NOT exported (delegated to Zod 4):**

Consumers use Zod 4 natively for base-level format validation when not using a validex Rule:

```typescript
import { z } from 'zod';

// These are Zod 4 native — validex does not wrap or re-export them
z.email()          // basic email format
z.uuid()           // UUID validation
z.url()            // URL validation
z.jwt()            // JWT structure
z.iso.datetime()   // ISO datetime
z.base64()         // Base64 format
z.hex()            // Hex format
```

validex Rules (`Email()`, `UUID()`, `JWT()`, etc.) use these internally and add business logic on top.

#### 3.3 Type Exports

```typescript
// All option interfaces
export type {
  EmailOptions, PasswordOptions, PhoneOptions,
  PersonNameOptions, BusinessNameOptions, UsernameOptions,
  WebsiteOptions, URLOptions, SlugOptions,
  PostalCodeOptions, LicenseKeyOptions,
  UUIDOptions, JWTOptions, DateTimeOptions,
  TokenOptions, TextOptions,
  CountryOptions, CurrencyOptions, ColorOptions,
  CreditCardOptions, IbanOptions, VatNumberOptions,
  MacAddressOptions, IpAddressOptions,
  PasswordConfirmationOptions, BaseRuleOptions, FormatRuleOptions,
} from "./rules";

// Shared types
export type { Range, Boundary } from "./types";

// Configuration types
export type {
  GlobalConfig, RuleDefaults,
  LabelTransform, MessageTransform, PathTransform,
  TranslationFunction, PreloadOptions,
} from "./config";

// Rule factory types
export type { CreateRuleOptions } from "./createRule";

// Validation result (used by core validate() and all adapters)
export type { ValidationResult } from "./validate";

```

#### 3.4 Versioning Contract

Follows Semantic Versioning 2.0.0:

|Change Type                      |Version Bump|Example      |
|---------------------------------|------------|-------------|
|Bug fix                          |PATCH       |1.0.0 → 1.0.1|
|New rule/check                   |MINOR       |1.0.0 → 1.1.0|
|New option (backward compatible) |MINOR       |1.0.0 → 1.1.0|
|Option default change            |MAJOR       |1.0.0 → 2.0.0|
|Option removal                   |MAJOR       |1.0.0 → 2.0.0|
|Validation rule change (stricter)|MAJOR       |1.0.0 → 2.0.0|
|Error key change                 |MAJOR       |1.0.0 → 2.0.0|
|Zod peer dependency bump (major) |MAJOR       |1.0.0 → 2.0.0|

#### 3.5 Breaking Change Policy

Before any major version:

1. Deprecation warning in minor version
2. Migration guide in CHANGELOG
3. Minimum 1 minor version gap before removal

-----

## Part III: Configuration and Error System

### 4. Global Configuration

#### 4.1 Configuration Interface

```typescript
interface GlobalConfig {
  i18n: {
    enabled: boolean;                              // Default: false
    prefix?: string;                               // Default: "validation"
    separator?: string;                            // Default: "."
    pathMode?: "semantic" | "key" | "full" | PathTransform;  // Default: "semantic"
    t?: TranslationFunction;                       // Optional: translation function (e.g., i18next.t)
  };
  label?: {
    fallback?: "derived" | "generic" | "none";     // Default: "derived"
    transform?: LabelTransform;
  };
  message?: {
    transform?: MessageTransform;
  };
  rules?: Partial<RuleDefaults>;                   // Global defaults for all rules
}

// Translation function signature — compatible with i18next, vue-i18n, next-intl, etc.
type TranslationFunction = (key: string, params?: Record<string, unknown>) => string;

// Global rule defaults — set once, used everywhere
interface RuleDefaults {
  email: Partial<EmailOptions>;
  password: Partial<PasswordOptions>;
  phone: Partial<PhoneOptions>;
  personName: Partial<PersonNameOptions>;
  businessName: Partial<BusinessNameOptions>;
  username: Partial<UsernameOptions>;
  website: Partial<WebsiteOptions>;
  url: Partial<URLOptions>;
  slug: Partial<SlugOptions>;
  postalCode: Partial<PostalCodeOptions>;
  licenseKey: Partial<LicenseKeyOptions>;
  uuid: Partial<UUIDOptions>;
  jwt: Partial<JWTOptions>;
  dateTime: Partial<DateTimeOptions>;
  token: Partial<TokenOptions>;
  text: Partial<TextOptions>;
  country: Partial<CountryOptions>;
  currency: Partial<CurrencyOptions>;
  color: Partial<ColorOptions>;
  creditCard: Partial<CreditCardOptions>;
  iban: Partial<IbanOptions>;
  vatNumber: Partial<VatNumberOptions>;
  macAddress: Partial<MacAddressOptions>;
  ipAddress: Partial<IpAddressOptions>;
}

type PathTransform = (path: (string | number)[]) => string;

type LabelTransform = (ctx: {
  path: (string | number)[];
  fieldName: string;               // Last segment as string (e.g., ["billing", "address", "postalCode"] → "postalCode")
  defaultLabel: string;            // Auto-derived from fieldName: "postalCode" → "Postal Code" (camelCase/underscore split, title case)
  explicitLabel?: string;          // From rule options if provided
}) => string;

type MessageTransform = (ctx: {
  key: string;                     // "validation.messages.email.disposableBlocked"
  code: string;                    // "disposableBlocked"
  namespace: string;               // "email"
  path: (string | number)[];
  label: string;                   // Resolved label (already translated if t() provided)
  message: string;                 // English message
  params: Record<string, unknown>;
}) => string;
```

**`t()` and `MessageTransform` precedence:**

|`t` provided|`MessageTransform` provided|Result|
|---|---|---|
|No|No|English messages (i18n disabled) or raw keys (i18n enabled)|
|Yes|No|validex calls `t()` for labels and messages automatically|
|No|Yes|Transform receives English labels, returns whatever it wants|
|Yes|Yes|Transform receives translated labels (via `t`), returns whatever it wants|

When both are provided, `t` is used first to translate the label, then `MessageTransform` receives the translated label in `ctx.label` and has full control over the final output.

#### 4.2 i18n System

**Design intent:** validex owns the entire error surface. Every error — whether originating from Zod's native validators or from validex's custom business logic — passes through the same formatting layer. This produces either polished English messages (with interpolation) or structured i18n keys (with params for the consumer's translation function).

**Key format:**

Labels: `{prefix}{separator}labels{separator}{fieldName}`
Messages: `{prefix}{separator}messages{separator}{namespace}{separator}{code}`

**Translation file structure:**

Labels and messages are structurally separated to prevent namespace collisions:

```json
{
  "validation": {
    "labels": {
      "email": "Email",
      "password": "Password",
      "billingEmail": "Billing Email",
      "phone": "Phone"
    },
    "messages": {
      "base": {
        "required": "{{label}} is required",
        "min": "{{label}} must be at least {{minimum}} characters",
        "max": "{{label}} must be at most {{maximum}} characters"
      },
      "email": {
        "invalid": "{{label}} is not a valid email address",
        "disposableBlocked": "Disposable email addresses are not allowed"
      },
      "password": {
        "commonBlocked": "This password is too common"
      }
    }
  }
}
```

**Collision safety:** Field names only appear under `labels`. Rule namespaces only appear under `messages`. A field named `base` produces `validation.labels.base` (a label), which is structurally separate from `validation.messages.base.required` (a message). No collision possible.

**Reserved namespaces:** `base`, `string`, and `confirmation` are reserved message namespaces used by validex. `createRule` rejects these as custom rule namespaces.

**Namespaces (all camelCase):**

- `base` — Mapped Zod codes (required, min, max, format, type)
- `string` — String checks (minUppercase, noSpaces, etc.)
- `email` — Email rule codes
- `password` — Password rule codes
- `personName` — PersonName rule codes
- `businessName` — BusinessName rule codes
- `confirmation` — PasswordConfirmation rule codes
- `phone` — Phone rule codes
- `website` — Website rule codes
- `url` — URL rule codes
- `username` — Username rule codes
- `slug` — Slug rule codes
- `postalCode` — PostalCode rule codes
- `licenseKey` — LicenseKey rule codes
- `uuid` — UUID rule codes
- `jwt` — JWT rule codes
- `dateTime` — DateTime rule codes
- `token` — Token rule codes
- `text` — Text rule codes
- `country` — Country rule codes
- `currency` — Currency rule codes
- `color` — Color rule codes
- `creditCard` — CreditCard rule codes
- `iban` — IBAN rule codes
- `vatNumber` — VatNumber rule codes
- `macAddress` — MacAddress rule codes
- `ipAddress` — IpAddress rule codes

**Zod 4 code mapping (semantic stability):**

validex intercepts all Zod 4 native issues via `z.config({ customError })` and remaps them to consistent validex codes:

|Zod 4 Code      |Condition           |validex Code   |
|----------------|--------------------|---------------|
|`too_small`     |minimum = 1         |`base.required`|
|`too_small`     |minimum > 1         |`base.min`     |
|`too_big`       |—                   |`base.max`     |
|`invalid_type`  |received = undefined|`base.required`|
|`invalid_type`  |other               |`base.type`    |
|`invalid_format`|—                   |`base.format`  |
|`invalid_string`|—                   |`base.format`  |

**Why intercept Zod's native messages:** Zod 4's built-in English messages are terse (e.g., "Too small"). validex provides polished, label-aware messages (e.g., "Password must be at least 8 characters") that are consistent in voice and structure with validex's own business rule messages. When i18n is enabled, the consumer gets structured keys in the same format for both Zod-native and validex-custom errors, enabling a single translation file to cover everything.

**Examples:**

|Namespace|Code              |Full Key                                        |English Default                                        |
|---------|------------------|------------------------------------------------|-------------------------------------------------------|
|base     |required          |`validation.messages.base.required`              |`{{label}} is required`                                |
|base     |min               |`validation.messages.base.min`                   |`{{label}} must be at least {{minimum}} characters`    |
|base     |max               |`validation.messages.base.max`                   |`{{label}} must be at most {{maximum}} characters`     |
|base     |type              |`validation.messages.base.type`                  |`{{label}} must be a {{expected}}`                     |
|base     |format            |`validation.messages.base.format`                |`{{label}} is not valid`                               |
|email    |disposableBlocked |`validation.messages.email.disposableBlocked`    |`{{label}} must not use a disposable email provider`   |
|password |commonBlocked     |`validation.messages.password.commonBlocked`     |`{{label}} is too common`                              |
|string   |minUppercase      |`validation.messages.string.minUppercase`        |`{{label}} must have at least {{minimum}} uppercase characters`|

**Path modes (affect message keys only, not label keys):**

|pathMode              |Example Path          |Example Key                                                      |
|----------------------|----------------------|-----------------------------------------------------------------|
|`"semantic"` (default)|`["billing", "email"]`|`validation.messages.email.disposableBlocked` (path in params)   |
|`"key"`               |`["billing", "email"]`|`validation.messages.email.email.disposableBlocked`              |
|`"full"`              |`["billing", "email"]`|`validation.messages.billing.email.email.disposableBlocked`      |

**Note:** `"semantic"` (default) produces stable translation keys. Path always available in `params.path`.

**Important:** With `"semantic"` mode, different fields may produce identical keys (e.g., `billing.email` and `shipping.email` both produce `validation.messages.email.disposableBlocked`). Your translation function must use `params.path` for field-specific context when needed. Use `"key"` or `"full"` mode if you need the path embedded in the key itself.

**Behavior matrix:**

|i18n.enabled|message.transform|Output                |
|------------|-----------------|----------------------|
|false       |none             |English message string|
|false       |provided         |Transform return value|
|true        |none             |Key string            |
|true        |provided         |Transform return value|

**Label derivation:**

|label.fallback|label.transform|Output                                                   |
|--------------|---------------|---------------------------------------------------------|
|`"derived"`   |none           |Auto Title Case: "postalCode" → "Postal Code"            |
|`"derived"`   |provided       |Transform return value                                   |
|`"generic"`   |none           |"This field"                                             |
|`"generic"`   |provided       |Transform return value (receives "This field" as default)|
|`"none"`      |none           |undefined                                                |
|`"none"`      |provided       |Transform return value (receives undefined as default)   |

#### 4.3 Error Map Integration

Zod 4 issues have different structures for native vs custom errors. The `getParams()` helper normalizes both into a consistent shape.

**Zod 4 native error (e.g., z.string().min(8)):**

```typescript
{
  code: "too_small",
  minimum: 8,
  type: "string",
  path: ["password"],
  message: "...",   // Overridden by validex's customError handler
}
```

**validex custom error (e.g., disposable email check):**

```typescript
{
  code: "custom",
  path: ["email"],
  message: "...",
  params: {
    code: "disposableBlocked",
    namespace: "email",
  },
}
```

**Normalized via getParams():**

```typescript
{
  code: "disposableBlocked",                           // Actual code
  namespace: "email",                                  // Namespace
  label: "Email",                                      // Derived label (or translated if t() provided)
  labelKey: "validation.labels.email",                 // i18n key for the label
  path: ["email"],
  key: "validation.messages.email.disposableBlocked",  // Full i18n key for the message
}
```

#### 4.4 Setup Lifecycle

```typescript
// Configuration (can be called multiple times, deep merges)
function configure(config: Partial<GlobalConfig>): void;
function getConfig(): Readonly<GlobalConfig>;

// Combined setup: merges config + registers customError handler with Zod 4
function setup(config?: Partial<GlobalConfig>): void;

// Optional preload for sync-first workflows
async function preloadData(options: PreloadOptions): Promise<void>;

interface PreloadOptions {
  disposable?: boolean;                          // Preload disposable domains
  passwords?: boolean | 'basic' | 'moderate' | 'strict';  // Preload common passwords
  reserved?: boolean;                            // Preload reserved usernames
  phone?: 'min' | 'mobile' | 'max';             // Preload libphonenumber-js variant
  countryCodes?: boolean;                        // Preload ISO 3166-1 country codes
  currencyCodes?: boolean;                       // Preload ISO 4217 currency codes
  ibanPatterns?: boolean;                        // Preload IBAN country patterns
  vatPatterns?: boolean;                         // Preload VAT number patterns
  creditCardPrefixes?: boolean;                  // Preload credit card issuer prefixes
  postalCodes?: boolean;                         // Preload postal code patterns
}

// Utility for normalizing Zod issues
function getParams(issue: z.ZodIssue): {
  code: string;
  namespace: string;
  label: string;
  labelKey?: string;       // i18n mode only
  key: string;             // Full i18n key
  path: (string | number)[];
  [key: string]: unknown;  // Additional params (minimum, maximum, actual, etc.)
};

// Core validation utility — wraps safeParse + getParams into ValidationResult
async function validate<T extends z.ZodSchema>(
  schema: T,
  data: unknown
): Promise<ValidationResult<z.infer<T>>>;

interface ValidationResult<T> {
  success: boolean;
  data?: T;                                    // Typed parsed data, only if success
  errors: Record<string, string[]>;            // Flat dot-path → all messages
  firstErrors: Record<string, string>;         // Flat dot-path → first message only
  nestedErrors: Record<string, any>;           // Nested object → all messages
  issues?: z.ZodIssue[];                       // Raw Zod issues (escape hatch)
}
```

**`validate()` is the recommended way to run validation outside of adapters.** It uses `parseAsync` internally (safe for both sync and async rules) and produces the same `ValidationResult` shape that all adapters return:

```typescript
import { validate, Email, Password } from '@validex/core';
import { z } from 'zod';

const schema = z.object({
  email: Email(),
  password: Password(),
});

const result = await validate(schema, data);

if (!result.success) {
  console.log(result.firstErrors);
  // { email: "Email is required", password: "Password must be at least 8 characters" }
}
```

**Adapters use `validate()` internally.** `useValidation` in Nuxt/Next and `request.validate()` in Fastify all delegate to this core function.

**Lifecycle examples:**

```typescript
// Option 1: Zero config — just import and use
import { Email } from '@validex/core';
Email().safeParse(data);  // Auto-initializes with defaults on first parse

// Option 2: Configure globally
import { setup } from '@validex/core';
setup({ rules: { email: { blockDisposable: true } } });

// Option 3: With preload for sync everywhere
import { setup, preloadData } from '@validex/core';
await preloadData({ disposable: true });
setup({ rules: { email: { blockDisposable: true } } });
// Now Email().parse(data) works synchronously
```

**Invariants:**

- `configure()` may be called multiple times (deep merges config)
- `setup()` calls `configure()` then registers `customError` with Zod 4
- `setup()` is safe to call multiple times (re-registers handler with latest config)
- `preloadData()` caches loaded data globally; safe to call multiple times

**Config merge behavior — Three-tier model:**

Options are resolved at parse-time by merging three tiers (each overrides per-key):

```
Tier 1: Defaults (shipped with validex, sensible middle ground)
   ↓ deep merge
Tier 2: Globals (consumer sets via setup() or framework adapter)
   ↓ deep merge
Tier 3: Per-call overrides (passed to Email(), Password(), etc.)
```

**Merge rules:**

- **Absent key:** inherits from the tier above
- **Key present with value:** overrides the tier above
- **Key present with `undefined`:** intentionally disables/removes the option (does not inherit)
- **Nested objects:** merged recursively per-key, same absent/present/undefined rules
- **Arrays:** replaced entirely (not concatenated)

```typescript
// Tier 1 (defaults): password.uppercase = { min: 1 }
// Tier 2 (globals):
setup({ rules: { password: { digits: { min: 2 } } } });
// Merged: Password = { uppercase: { min: 1 }, digits: { min: 2 } }

// Tier 3 (per-call):
Password({ uppercase: undefined })
// Merged: { digits: { min: 2 } } — uppercase intentionally removed

Password({ digits: { min: 3 } })
// Merged: { uppercase: { min: 1 }, digits: { min: 3 } } — digits overridden, uppercase inherited

Password({})
// Merged: { uppercase: { min: 1 }, digits: { min: 2 } } — everything inherited
```

**`configure()` calls also deep-merge with existing globals:**

```typescript
configure({ rules: { password: { uppercase: { min: 2 } } } });
configure({ rules: { password: { digits: { min: 1 } } } });

// Globals result (deep merged):
// password: { uppercase: { min: 2 }, digits: { min: 1 } }
```

#### 4.5 Auto-Initialization Contract

If no explicit `setup()` call has been made, validex auto-initializes on first parse with default config.

**Trigger:** The first call to `.parse()`, `.safeParse()`, `.parseAsync()`, or `.safeParseAsync()` on any validex Rule or Schema.

**Behavior:** Equivalent to calling `setup()` with no arguments.

**Post-auto-init reconfiguration:** If `setup()` is called after auto-initialization has occurred, the new config fully replaces the auto-initialized config. The `customError` handler is re-registered. All subsequent parses use the new config.

**Lazy config reads:** Rules read from the global config store at parse-time, not at creation-time. This means:

```typescript
// This works regardless of import/execution order:
import { Email } from '@validex/core';
const schema = Email();  // Schema created with no config baked in

// Later...
setup({ rules: { email: { blockDisposable: true } } });

// Schema reads config NOW, at parse-time:
schema.safeParse("test@mailinator.com");
// ✗ "Disposable email addresses are not allowed"
```

#### 4.6 Zod customError Chaining

validex registers a `customError` handler via `z.config()`. This intercepts all Zod issues.

**Conflict handling:** If the consumer has registered their own `customError` before calling `setup()`, validex's handler wraps theirs. validex processes the issue first; if it recognizes the issue (Zod native code in the mapping table, or a validex custom code), it returns its formatted message. If not recognized, it delegates to the consumer's original handler.

**Order of precedence:**

1. Schema-level `{ error: ... }` (Zod 4's per-check error override) — **highest priority**
2. validex `customError` handler (registered by `setup()`)
3. Consumer's prior `customError` handler (if any, wrapped by validex)
4. Zod 4 locale (e.g., `z.locales.es()`) — **lowest priority**

**⚠️ Global handler warning:** Zod 4's `z.config()` is global — not per-instance. If other code in your application calls `z.config({ customError: ... })` after `setup()`, it will override validex's handler. Call `setup()` after all other Zod configuration, or re-call `setup()` if the handler is overridden.

**Implication:** Zod 4 locale translations are not visible for codes that validex intercepts (which is all standard codes). The consumer should use validex's i18n system, not Zod's locales, for translated messages. Both systems can coexist but validex takes priority for all recognized codes.

-----

### 5. Error Handling

#### 5.1 Error Code Taxonomy

**Key format:** `{prefix}.messages.{namespace}.{code}`

Example: `validation.messages.email.disposableBlocked`

**All codes and namespaces use camelCase.**

**Base codes (intercepted from Zod 4):**

|Zod 4 Code      |Condition           |validex Code|Full Key                            |English Default                                     |
|----------------|--------------------|------------|------------------------------------|---------------------------------------------------|
|`too_small`     |minimum = 1         |`required`  |`validation.messages.base.required` |`{{label}} is required`                            |
|`too_small`     |minimum > 1         |`min`       |`validation.messages.base.min`      |`{{label}} must be at least {{minimum}} characters`|
|`too_big`       |—                   |`max`       |`validation.messages.base.max`      |`{{label}} must be at most {{maximum}} characters` |
|`invalid_type`  |received = undefined|`required`  |`validation.messages.base.required` |`{{label}} is required`                            |
|`invalid_type`  |other               |`type`      |`validation.messages.base.type`     |`{{label}} must be a {{expected}}`                 |
|`invalid_format`|—                   |`format`    |`validation.messages.base.format`   |`{{label}} is not valid`                           |
|`invalid_string`|—                   |`format`    |`validation.messages.base.format`   |`{{label}} is not valid`                           |

**Check codes (namespace: `string`):**

|Code            |Full Key                                     |English Default                                                                    |Params         |
|----------------|---------------------------------------------|-----------------------------------------------------------------------------------|---------------|
|`minUppercase`  |`validation.messages.string.minUppercase`    |`{{label}} must have at least {{minimum}} uppercase characters`                    |minimum, actual|
|`maxUppercase`  |`validation.messages.string.maxUppercase`    |`{{label}} must have at most {{maximum}} uppercase characters`                     |maximum, actual|
|`minLowercase`  |`validation.messages.string.minLowercase`    |`{{label}} must have at least {{minimum}} lowercase characters`                    |minimum, actual|
|`maxLowercase`  |`validation.messages.string.maxLowercase`    |`{{label}} must have at most {{maximum}} lowercase characters`                     |maximum, actual|
|`minDigits`     |`validation.messages.string.minDigits`       |`{{label}} must have at least {{minimum}} digits`                                  |minimum, actual|
|`maxDigits`     |`validation.messages.string.maxDigits`       |`{{label}} must have at most {{maximum}} digits`                                   |maximum, actual|
|`minSpecial`    |`validation.messages.string.minSpecial`      |`{{label}} must have at least {{minimum}} special characters`                      |minimum, actual|
|`maxSpecial`    |`validation.messages.string.maxSpecial`      |`{{label}} must have at most {{maximum}} special characters`                       |maximum, actual|
|`minWords`      |`validation.messages.string.minWords`        |`{{label}} must have at least {{minimum}} words`                                   |minimum, actual|
|`maxWords`      |`validation.messages.string.maxWords`        |`{{label}} must have at most {{maximum}} words`                                    |maximum, actual|
|`maxConsecutive`|`validation.messages.string.maxConsecutive`  |`{{label}} must not repeat the same character more than {{maximum}} times`         |maximum        |
|`noSpaces`      |`validation.messages.string.noSpaces`        |`{{label}} must not contain spaces`                                                |—              |

**Rule-specific codes (complete list — all 25 rules):**

|Namespace      |Code                 |Full Key                                                |English Default                                                                    |
|---------------|---------------------|----------------------------------------------------|-----------------------------------------------------------------------------------|
|`email`        |`invalid`            |`validation.messages.email.invalid`                 |`{{label}} is not a valid email address`                                           |
|`email`        |`disposableBlocked`  |`validation.messages.email.disposableBlocked`       |`{{label}} must not use a disposable email provider`                               |
|`email`        |`plusAliasBlocked`   |`validation.messages.email.plusAliasBlocked`         |`{{label}} must not use plus aliases`                                              |
|`email`        |`domainBlocked`      |`validation.messages.email.domainBlocked`           |`Email domain '{{domain}}' is not allowed`                                         |
|`email`        |`domainNotAllowed`   |`validation.messages.email.domainNotAllowed`        |`Email domain '{{domain}}' is not in the allowed list`                             |
|`email`        |`subdomainNotAllowed`|`validation.messages.email.subdomainNotAllowed`     |`Subdomain email addresses are not allowed`                                        |
|`personName`   |`invalid`            |`validation.messages.personName.invalid`            |`{{label}} is not a valid name`                                                    |
|`personName`   |`maxWords`           |`validation.messages.personName.maxWords`           |`{{label}} must have at most {{maximum}} words`                                    |
|`personName`   |`boundary`           |`validation.messages.personName.boundary`           |`{{label}} must start and end with a letter`                                       |
|`personName`   |`maxConsecutive`     |`validation.messages.personName.maxConsecutive`     |`{{label}} must not repeat the same character more than {{maximum}} times`         |
|`businessName` |`invalid`            |`validation.messages.businessName.invalid`          |`{{label}} is not a valid business name`                                           |
|`businessName` |`boundary`           |`validation.messages.businessName.boundary`         |`{{label}} must start and end with an alphanumeric character`                      |
|`businessName` |`maxConsecutive`     |`validation.messages.businessName.maxConsecutive`   |`{{label}} must not repeat the same character more than {{maximum}} times`         |
|`password`     |`minUppercase`       |`validation.messages.password.minUppercase`         |`{{label}} must have at least {{minimum}} uppercase characters`                    |
|`password`     |`minLowercase`       |`validation.messages.password.minLowercase`         |`{{label}} must have at least {{minimum}} lowercase characters`                    |
|`password`     |`minDigits`          |`validation.messages.password.minDigits`            |`{{label}} must have at least {{minimum}} digits`                                  |
|`password`     |`minSpecial`         |`validation.messages.password.minSpecial`           |`{{label}} must have at least {{minimum}} special characters`                      |
|`password`     |`maxUppercase`       |`validation.messages.password.maxUppercase`         |`{{label}} must have at most {{maximum}} uppercase characters`                     |
|`password`     |`maxLowercase`       |`validation.messages.password.maxLowercase`         |`{{label}} must have at most {{maximum}} lowercase characters`                     |
|`password`     |`maxDigits`          |`validation.messages.password.maxDigits`            |`{{label}} must have at most {{maximum}} digits`                                   |
|`password`     |`maxSpecial`         |`validation.messages.password.maxSpecial`           |`{{label}} must have at most {{maximum}} special characters`                       |
|`password`     |`maxConsecutive`     |`validation.messages.password.maxConsecutive`       |`{{label}} must not have more than {{maximum}} consecutive identical characters`   |
|`password`     |`commonBlocked`      |`validation.messages.password.commonBlocked`        |`{{label}} is too common`                                                          |
|`confirmation` |`mismatch`           |`validation.messages.confirmation.mismatch`         |`{{label}} must match {{targetLabel}}`                                             |
|`phone`        |`invalid`            |`validation.messages.phone.invalid`                 |`{{label}} is not a valid phone number`                                            |
|`phone`        |`requireMobile`      |`validation.messages.phone.requireMobile`           |`{{label}} must be a mobile phone number`                                          |
|`phone`        |`countryCodeRequired`|`validation.messages.phone.countryCodeRequired`     |`{{label}} must include a country code prefix`                                     |
|`phone`        |`countryBlocked`     |`validation.messages.phone.countryBlocked`          |`Phone numbers from '{{country}}' are not allowed`                                 |
|`phone`        |`countryNotAllowed`  |`validation.messages.phone.countryNotAllowed`       |`Phone numbers from '{{country}}' are not in the allowed list`                     |
|`website`      |`invalid`            |`validation.messages.website.invalid`               |`{{label}} is not a valid website URL`                                             |
|`website`      |`httpsRequired`      |`validation.messages.website.httpsRequired`         |`{{label}} must use HTTPS`                                                         |
|`website`      |`wwwRequired`        |`validation.messages.website.wwwRequired`           |`{{label}} must include www prefix`                                                |
|`website`      |`pathNotAllowed`     |`validation.messages.website.pathNotAllowed`        |`{{label}} must not contain URL paths`                                             |
|`website`      |`queryNotAllowed`    |`validation.messages.website.queryNotAllowed`       |`{{label}} must not contain query strings`                                         |
|`website`      |`domainBlocked`      |`validation.messages.website.domainBlocked`         |`Domain '{{domain}}' is not allowed`                                               |
|`website`      |`domainNotAllowed`   |`validation.messages.website.domainNotAllowed`      |`Domain '{{domain}}' is not in the allowed list`                                   |
|`website`      |`subdomainNotAllowed`|`validation.messages.website.subdomainNotAllowed`   |`Subdomain URLs are not allowed`                                                   |
|`url`          |`invalid`            |`validation.messages.url.invalid`                   |`{{label}} is not a valid URL`                                                     |
|`url`          |`protocolNotAllowed` |`validation.messages.url.protocolNotAllowed`        |`Protocol '{{protocol}}' is not allowed`                                           |
|`url`          |`tldRequired`        |`validation.messages.url.tldRequired`               |`{{label}} must include a top-level domain`                                        |
|`url`          |`queryNotAllowed`    |`validation.messages.url.queryNotAllowed`           |`{{label}} must not contain query strings`                                         |
|`url`          |`authNotAllowed`     |`validation.messages.url.authNotAllowed`            |`{{label}} must not contain credentials`                                           |
|`url`          |`domainBlocked`      |`validation.messages.url.domainBlocked`             |`Domain '{{domain}}' is not allowed`                                               |
|`url`          |`domainNotAllowed`   |`validation.messages.url.domainNotAllowed`          |`Domain '{{domain}}' is not in the allowed list`                                   |
|`username`     |`invalid`            |`validation.messages.username.invalid`              |`{{label}} is not a valid username`                                                |
|`username`     |`reservedBlocked`    |`validation.messages.username.reservedBlocked`      |`The username '{{value}}' is reserved`                                             |
|`username`     |`boundary`           |`validation.messages.username.boundary`             |`{{label}} must start and end with an alphanumeric character`                      |
|`username`     |`maxConsecutive`     |`validation.messages.username.maxConsecutive`        |`{{label}} must not repeat the same character more than {{maximum}} times`         |
|`slug`         |`invalid`            |`validation.messages.slug.invalid`                  |`{{label}} is not a valid slug`                                                    |
|`postalCode`   |`invalid`            |`validation.messages.postalCode.invalid`             |`{{label}} is not a valid postal code`                                             |
|`licenseKey`   |`invalid`            |`validation.messages.licenseKey.invalid`             |`{{label}} is not a valid license key`                                             |
|`uuid`         |`invalid`            |`validation.messages.uuid.invalid`                  |`{{label}} is not a valid UUID`                                                    |
|`jwt`          |`invalid`            |`validation.messages.jwt.invalid`                   |`{{label}} is not a valid JWT`                                                     |
|`jwt`          |`expiryRequired`     |`validation.messages.jwt.expiryRequired`            |`{{label}} must have an expiration claim`                                          |
|`jwt`          |`expired`            |`validation.messages.jwt.expired`                   |`{{label}} has expired`                                                            |
|`jwt`          |`notYetValid`        |`validation.messages.jwt.notYetValid`               |`{{label}} is not yet valid`                                                       |
|`jwt`          |`missingClaim`       |`validation.messages.jwt.missingClaim`              |`Required claim '{{claim}}' is missing`                                            |
|`jwt`          |`algorithmNotAllowed`|`validation.messages.jwt.algorithmNotAllowed`       |`Algorithm '{{algorithm}}' is not allowed`                                         |
|`dateTime`     |`invalid`            |`validation.messages.dateTime.invalid`              |`{{label}} is not a valid date`                                                    |
|`dateTime`     |`tooEarly`           |`validation.messages.dateTime.tooEarly`             |`{{label}} must be after {{minimum}}`                                              |
|`dateTime`     |`tooLate`            |`validation.messages.dateTime.tooLate`              |`{{label}} must be before {{maximum}}`                                             |
|`dateTime`     |`noFuture`           |`validation.messages.dateTime.noFuture`             |`{{label}} must not be in the future`                                              |
|`dateTime`     |`noPast`             |`validation.messages.dateTime.noPast`               |`{{label}} must not be in the past`                                                |
|`token`        |`invalid`            |`validation.messages.token.invalid`                 |`{{label}} is not a valid {{type}} token`                                          |
|`text`         |`invalid`            |`validation.messages.text.invalid`                  |`{{label}} is not valid text`                                                      |
|`text`         |`noEmails`           |`validation.messages.text.noEmails`                 |`{{label}} must not contain email addresses`                                       |
|`text`         |`noUrls`             |`validation.messages.text.noUrls`                   |`{{label}} must not contain URLs`                                                  |
|`text`         |`noPhoneNumbers`     |`validation.messages.text.noPhoneNumbers`           |`{{label}} must not contain phone numbers`                                         |
|`text`         |`noHtml`             |`validation.messages.text.noHtml`                   |`{{label}} must not contain HTML`                                                  |
|`text`         |`minWords`           |`validation.messages.text.minWords`                 |`{{label}} must have at least {{minimum}} words`                                   |
|`text`         |`maxWords`           |`validation.messages.text.maxWords`                 |`{{label}} must have at most {{maximum}} words`                                    |
|`text`         |`maxConsecutive`     |`validation.messages.text.maxConsecutive`            |`{{label}} must not repeat the same character more than {{maximum}} times`         |
|`country`      |`invalid`            |`validation.messages.country.invalid`               |`{{label}} is not a valid country code`                                            |
|`country`      |`blocked`            |`validation.messages.country.blocked`               |`Country '{{country}}' is not allowed`                                             |
|`country`      |`notAllowed`         |`validation.messages.country.notAllowed`            |`Country '{{country}}' is not in the allowed list`                                 |
|`currency`     |`invalid`            |`validation.messages.currency.invalid`              |`{{label}} is not a valid currency code`                                           |
|`currency`     |`blocked`            |`validation.messages.currency.blocked`              |`Currency '{{currency}}' is not allowed`                                           |
|`currency`     |`notAllowed`         |`validation.messages.currency.notAllowed`           |`Currency '{{currency}}' is not in the allowed list`                               |
|`color`        |`invalid`            |`validation.messages.color.invalid`                 |`{{label}} is not a valid color`                                                   |
|`creditCard`   |`invalid`            |`validation.messages.creditCard.invalid`            |`{{label}} is not a valid credit card number`                                      |
|`creditCard`   |`issuerNotAllowed`   |`validation.messages.creditCard.issuerNotAllowed`   |`Card issuer '{{issuer}}' is not in the allowed list`                              |
|`creditCard`   |`issuerBlocked`      |`validation.messages.creditCard.issuerBlocked`      |`Card issuer '{{issuer}}' is not allowed`                                          |
|`iban`         |`invalid`            |`validation.messages.iban.invalid`                  |`{{label}} is not a valid IBAN`                                                    |
|`iban`         |`countryBlocked`     |`validation.messages.iban.countryBlocked`           |`IBANs from '{{country}}' are not allowed`                                         |
|`iban`         |`countryNotAllowed`  |`validation.messages.iban.countryNotAllowed`        |`IBANs from '{{country}}' are not in the allowed list`                             |
|`vatNumber`    |`invalid`            |`validation.messages.vatNumber.invalid`             |`{{label}} is not a valid VAT number`                                              |
|`macAddress`   |`invalid`            |`validation.messages.macAddress.invalid`            |`{{label}} is not a valid MAC address`                                             |
|`ipAddress`    |`invalid`            |`validation.messages.ipAddress.invalid`             |`{{label}} is not a valid IP address`                                              |
|`ipAddress`    |`privateNotAllowed`  |`validation.messages.ipAddress.privateNotAllowed`   |`{{label}} must not be a private IP address`                                       |

**Note:** Each rule remaps format validation errors from Zod's generic `invalid_format` code to a rule-specific `invalid` code. The namespace provides context (e.g., `email.invalid` vs `phone.invalid`), allowing consumers to write specific translations per rule.

**`customFn` error code:** When a rule's `customFn` returns a string, the error is registered under `{namespace}.custom`. The string returned becomes the error message. In i18n mode, the string is used as the i18n key.

**Reserved namespaces:** `base`, `string`, and `confirmation` are reserved. `createRule` rejects these as custom rule namespaces.

**Extensible via `createRule`:** Custom rules registered via `createRule` extend the taxonomy at runtime. Their codes appear under `validation.messages.{customNamespace}.{code}`.

#### 5.2 Parameter Interpolation

Parameters available in message templates:

|Parameter  |Type  |Provided By           |
|-----------|------|----------------------|
|`label`    |string|Always (via getParams)|
|`labelKey` |string|i18n mode only        |
|`code`     |string|Always                |
|`namespace`|string|Always                |
|`key`      |string|Always (full i18n key)|
|`path`     |array |Always                |
|`minimum`  |number|min validations       |
|`maximum`  |number|max validations       |
|`actual`   |number|count validations     |
|`expected` |string|type validations      |
|`received` |string|type validations      |

#### 5.3 Error Behavior Matrix

|Feature               |i18n OFF       |i18n ON                  |
|----------------------|---------------|-------------------------|
|`issue.message`       |English text   |i18n key                 |
|`getParams().label`   |Derived label  |Derived label            |
|`getParams().labelKey`|undefined      |i18n key for label       |
|`getParams().key`     |Full key       |Full key                 |
|Consumer action       |Display message|Call `t(key, params)`    |

**Consumer usage:**

```typescript
// i18n disabled (default) — English messages
import { Email } from "@validex/core";
const result = Email({ blockDisposable: true }).safeParse("bad@mailinator.com");
// result.error.issues[0].message → "Disposable email addresses are not allowed"

// i18n enabled with t() function — fully translated automatically
import { setup } from "@validex/core";
import i18next from "i18next";

setup({
  i18n: { enabled: true, t: i18next.t },
});

const result2 = Email().safeParse("");
// result2.error.issues[0].message → "Correo electrónico es obligatorio"
// (label translated via t("validation.labels.email"), message via t("validation.messages.base.required", params))

// i18n enabled without t() — raw keys for manual translation
setup({ i18n: { enabled: true } });
const issue = result.error.issues[0];
// issue.message → "validation.messages.email.disposableBlocked"
// getParams(issue) → {
//   code: "disposableBlocked",
//   namespace: "email",
//   label: "Email",
//   labelKey: "validation.labels.email",
//   key: "validation.messages.email.disposableBlocked",
//   path: ["email"],
// }
// Consumer calls: t(issue.message, getParams(issue))
```

-----

## Part IV: Checks

### 6. Checks

Checks exist in two layers:

- **Layer 0 — Pure functions** (`src/checks/`): No Zod coupling, no side effects. Standalone building blocks for filtering, custom logic, and custom schemas. Importable via `validex/checks`.
- **Layer 1 — Chainable Zod methods** (`src/augmentation.ts`): Wraps Layer 0 functions in `.superRefine()` or `.transform()` on `ZodType.prototype` via module augmentation. Imported as a side effect from `src/index.ts`. Consumers chain them directly: `z.string().hasUppercase({ min: 1 }).noEmails()`. Rules compose these internally.

#### 6.1 Check Contract

Every Layer 0 check must satisfy:

1. **Pure function** — No side effects, deterministic output
2. **Type-safe** — Throws `TypeError` on invalid input type
3. **Trims input** — Whitespace handled consistently
4. **No Zod coupling** — Does not import Zod, does not register extensions, does not touch prototypes. (Layer 1 methods are Zod-coupled by design — they augment `ZodType.prototype` at import time.)
5. **Patterns internal** — Regex not exported, encapsulated in check function
6. **Independently importable** — Each check is a standalone module

**Usage patterns:**

```typescript
// Standalone (direct use)
import { hasUppercase, containsHtml } from 'validex/checks';
hasUppercase('HeLLo', 2);   // true (2+ uppercase)
containsHtml('<b>hi</b>');  // true

// Inside consumer's custom Zod schema
import { hasUppercase, hasDigits } from 'validex/checks';
import { z } from 'zod';

const customPassword = z.string()
  .min(10)
  .refine(v => hasUppercase(v, 2), {
    params: { code: "minUppercase", namespace: "string", minimum: 2 }
  })
  .refine(v => hasDigits(v, 1), {
    params: { code: "minDigits", namespace: "string", minimum: 1 }
  });

// Via Rules (preferred — checks composed internally)
import { Password } from '@validex/core';
Password({ uppercase: { min: 2 }, digits: { min: 1 } });
// Internally uses hasUppercase and hasDigits
```

#### 6.2 Character Composition Checks (has*)

Return `true` if value contains minimum (and optionally maximum) occurrences.

|# |Check         |Signature                    |Error Code (when used in Rule)|
|--|--------------|-----------------------------|------------------------------|
|1 |`hasUppercase`|`(value, min, max?): boolean`|`minUppercase` / `maxUppercase`|
|2 |`hasLowercase`|`(value, min, max?): boolean`|`minLowercase` / `maxLowercase`|
|3 |`hasDigits`   |`(value, min, max?): boolean`|`minDigits` / `maxDigits`     |
|4 |`hasSpecial`  |`(value, min, max?): boolean`|`minSpecial` / `maxSpecial`   |

**Usage:**

```typescript
hasUppercase('HeLLo', 2);  // true (2+ uppercase)
hasDigits('abc123', 3);    // true (3+ digits)
hasSpecial('p@ss!', 1, 3); // true (1-3 special chars)
```

#### 6.3 Content Detection Checks (contains*)

Return `true` if content is detected. Used by Rules to block unwanted content.

|# |Check                |Signature         |Error Code (when used in Rule)|
|--|---------------------|------------------|------------------------------|
|5 |`containsEmail`      |`(value): boolean`|`noEmails`                    |
|6 |`containsUrl`        |`(value): boolean`|`noUrls`                      |
|7 |`containsHtml`       |`(value): boolean`|`noHtml`                      |
|8 |`containsPhoneNumber`|`(value): Promise<boolean>`|`noPhoneNumbers`              |

**Note:** The check returns `true` if detected (for filtering use). When used inside a Rule, detection causes validation failure (inverted logic).

```typescript
containsEmail('Contact me at test@example.com');  // true
containsHtml('<script>alert(1)</script>');          // true
```

#### 6.4 Character Restriction Checks (only*)

Return `true` if value contains only allowed characters.

|#  |Check                        |Signature         |Error Code                    |
|---|-----------------------------|------------------|------------------------------|
|9  |`onlyAlpha`                  |`(value): boolean`|`onlyAlpha`                   |
|10 |`onlyNumeric`                |`(value): boolean`|`onlyNumeric`                 |
|11 |`onlyAlphanumeric`           |`(value): boolean`|`onlyAlphanumeric`            |
|12 |`onlyAlphanumericSpaceHyphen`|`(value): boolean`|`onlyAlphanumericSpaceHyphen` |
|13 |`onlyAlphaSpaceHyphen`       |`(value): boolean`|`onlyAlphaSpaceHyphen`        |

#### 6.5 Limit Checks

Return `true` if value is within limits.

|#  |Check          |Signature              |Error Code       |
|---|---------------|-----------------------|-----------------|
|14 |`minWords`      |`(value, min): boolean`|`minWords`       |
|15 |`maxWords`     |`(value, max): boolean`|`maxWords`       |
|16 |`maxConsecutive`|`(value, max): boolean`|`maxConsecutive` |
|17 |`noSpaces`     |`(value): boolean`     |`noSpaces`       |

#### 6.6 Schema Utilities

These are **not Checks** — they produce Zod refinements and are Zod-coupled. They live in a separate category because they operate at schema level (cross-field validation), not field level.

|#  |Utility       |Signature                |Import Path                              |Purpose                        |
|---|--------------|-------------------------|-----------------------------------------|-------------------------------|
|17 |`requiredWhen`|`(fieldName): Refinement`|`validex` or `validex/utilities`         |Required based on another field|
|18 |`sameAs`      |`(path): Refinement`     |`validex` or `validex/utilities`         |Must match another field       |

**Usage in custom schemas:**

```typescript
import { sameAs, requiredWhen } from '@validex/core';

const schema = z.object({
  changePassword: z.boolean(),
  newPassword: Password().requiredWhen('changePassword'),
  confirmPassword: Password().sameAs('newPassword'),
});
```

#### 6.7 Transform Checks

Transform checks modify values (not validators). They return transformed strings.

|#  |Check               |Signature         |Purpose                         |
|---|---------------------|------------------|--------------------------------|
|19 |`emptyToUndefined`  |`(value): unknown`|`""` and `null` → `undefined`   |
|20 |`toTitleCase`       |`(value): string` |"hello world" → "Hello World"   |
|21 |`toSlug`            |`(value): string` |"Hello World!" → "hello-world"  |
|22 |`stripHtml`         |`(value): string` |Remove HTML tags                |
|23 |`collapseWhitespace`|`(value): string` |Multiple spaces → single        |

**`emptyToUndefined` scope:** Converts `""` (empty string) and `null` to `undefined`. Does not convert `[]` or `{}` — those are not expected inputs for string validation rules.

**Note:** Zod 4 has built-in `.trim()`, `.toLowerCase()`, `.toUpperCase()` — not duplicated.

#### 6.8 Data Sets

validex uses a combination of external npm packages and bundled curated lists for data-dependent validation. Data is loaded lazily via dynamic import on first `parseAsync()`.

**Data Sources:**

|Data Set          |Used By                    |Source                              |Approach          |
|------------------|---------------------------|------------------------------------|------------------|
|Disposable domains|Email (`blockDisposable`)  |`disposable-email-domains-js` npm pkg  |External dep      |
|Phone metadata    |Phone                      |`libphonenumber-js/core` + metadata |External dep      |
|Postal code patterns|PostalCode               |`postcode-validator` npm pkg           |External dep      |
|Common passwords  |Password (`blockCommon`)   |Breach compilations (10k+ entries)  |Bundled           |
|Reserved usernames|Username (`blockReserved`) |Platform standards (200+ entries)   |Bundled           |
|Country codes     |Country, Phone             |ISO 3166-1 (249 entries)            |Bundled           |
|Currency codes    |Currency                   |ISO 4217                            |Bundled           |
|IBAN patterns     |IBAN                       |Country format table (~80 countries)|Bundled           |
|VAT patterns      |VatNumber                  |Country format table (~30 countries)|Bundled           |
|Credit card prefixes|CreditCard               |Issuer prefix table                 |Bundled           |

**Principle:** If a well-maintained npm package exists for the data, use it as a dependency. If the data is small and stable, bundle it. If it's large and community-maintained, depend on it.

**Invariants:**

- Lists are read-only at runtime
- No external API fetches; data loaded via dynamic import on demand
- External deps are tree-shakable — only bundled when their rule is imported
- Consumers may extend via `customFn` on any rule
- Data loaded lazily on first `parseAsync()` — zero initial bundle cost
- After `preloadData()`, sync `.parse()` works for data-dependent rules

-----

## Part V: Rules

### 7. Rules

Rules are fully-formed, configurable validation functions that compose Zod 4 native validators with custom checks into business-logic-aware validators. They return Zod schemas that can be further chained.

#### 7.1 Rule Design Contract

Every rule must satisfy:

1. **Function signature:** `RuleName(options?: RuleOptions) => ZodSchema`
2. **Options optional:** Default config produces sensible validation (exceptions: PostalCode requires `country`, Token requires `type` — see §7.12, §7.17)
3. **Uses global defaults:** Merges with `setup({ rules: {...} })` config at parse-time (lazy)
4. **Composes Layer 1 chainable methods:** Rules compose chainable Zod methods (`.hasUppercase()`, `.noEmails()`, etc.) for reusable check-type validations. Rules NEVER create their own validation logic for operations a check can perform. Rule-specific logic (charset patterns, format parsing, boundary checks) may use `.superRefine()` directly.
5. **Chainable result:** Returns standard Zod schema for further chaining. Consumers can chain additional checks after a rule: `Password().noSpaces()`.
6. **Handles empty:** Uses `emptyToUndefined()` internally for form compatibility
7. **Augmentation is separate:** Prototype patching lives in `src/augmentation.ts`, not in rule files. Rules import it as a side effect.
8. **Extensible:** All rules accept `customFn` (BaseRuleOptions) for additional validation. Rules extending `FormatRuleOptions` also accept `regex` for format override.

**`allow*` / `block*` semantics (universal):**

- `allow*` and `block*` on the same rule are **mutually exclusive**. If both are provided, `allow*` takes precedence (whitelist wins).
- An empty array `[]` means **no filtering** (all values accepted). It does NOT mean "block all."
- `undefined` (not set) and `[]` (empty) behave identically — no filtering.

**`regex` override scope (FormatRuleOptions rules):**

When `regex` is provided, it replaces the rule's built-in character/format validation. The following still apply on top of regex: `length`, `words`, `consecutive`, `titleCase`, all `block*`/`allow*` lists, and `customFn`. Only the format pattern is overridden.

**`customFn` return value and i18n:**

- i18n disabled: the returned string is the error message, shown directly.
- i18n enabled: the returned string is treated as an i18n key, passed through the configured `t()` function with standard params. Consumer can return raw messages or i18n keys — the system handles both based on config.
- Error is registered under `{namespace}.custom` code.

**Standard option properties:**

```typescript
// Universal range type — used by all numeric constraints across all rules
type Range = number | { min?: number; max?: number };
// number = exact value (e.g., length: 21 means exactly 21)
// { min } = at least (e.g., length: { min: 8 } means 8 or more)
// { max } = at most (e.g., length: { max: 128 } means 128 or fewer)
// { min, max } = between (e.g., length: { min: 8, max: 128 })

// Universal boundary type — used by rules with character composition
type Boundary = 'alpha' | 'alphanumeric' | 'any' | {
  start?: 'alpha' | 'alphanumeric' | 'any';
  end?: 'alpha' | 'alphanumeric' | 'any';
};
// string = applies to both start and end
// object = per-side control

// Base — every rule inherits these
interface BaseRuleOptions {
  label?: string;                  // For error messages
  emptyToUndefined?: boolean;      // Default: true — converts "" and null to undefined
  normalize?: boolean;             // Default: true — rule-specific normalization (trim + format-appropriate casing)
  customFn?: (value: string) => true | string | Promise<true | string>;
  // Custom validation function, runs AFTER all built-in validations pass.
  // Return true = pass, return string = fail with that error message.
  // Async supported — triggers parseAsync requirement.
  // Error goes through validex error surface as {namespace}.custom
}

// Extended base — for rules that own their format pattern and support regex override
interface FormatRuleOptions extends BaseRuleOptions {
  regex?: RegExp;                  // Overrides format/character validation. Other options (blocking, length, transforms) still apply.
}
```

**Rules extending `FormatRuleOptions` (support `regex`):** PersonName, BusinessName, Username, Slug, PostalCode, LicenseKey, Token, Text

**Rules extending `BaseRuleOptions` only (no `regex`):** Email, Password, PasswordConfirmation, Phone, Website, URL, UUID, JWT, DateTime, Country, Currency, Color, CreditCard, IBAN, VatNumber, MacAddress, IpAddress

**`emptyToUndefined` default behavior:** Rules convert `""` and `null` to `undefined` before validation. This ensures empty form fields are treated as "not provided" and trigger required checks correctly. In API contexts where `""` is intentional, set `emptyToUndefined: false`.

**`normalize` default behavior:** Each rule applies format-appropriate normalization when `true`:

|Rule|Normalization|
|---|---|
|Email|lowercase + trim|
|Username|lowercase + trim|
|Website|lowercase + trim + auto-prepend `https://` to bare domains (e.g., `google.com` → `https://google.com`)|
|URL|trim (preserve case in path/query)|
|PersonName|trim only (never changes user's casing)|
|BusinessName|trim only (never changes user's casing)|
|Slug|lowercase + trim|
|Password|trim only (never changes case)|
|Phone|trim + strip formatting (spaces, dashes, parens) — libphonenumber handles this|
|PostalCode|uppercase + trim|
|UUID|lowercase + trim|
|JWT, DateTime, Token, LicenseKey|trim|
|Country, Currency|uppercase + trim|
|Color|lowercase + trim|
|CreditCard|trim + strip spaces/dashes|
|IBAN|uppercase + trim + strip spaces|
|VatNumber|uppercase + trim + strip spaces|
|MacAddress|trim|
|IpAddress|trim|
|Text|trim|

**Global defaults:**

```typescript
// Set once at app startup
setup({
  rules: {
    email: { blockDisposable: true },
    password: { length: { min: 10 }, digits: { min: 2 } },
    phone: { metadata: 'mobile' },
    licenseKey: { type: 'windows' },
  }
});

// Used everywhere without repeating options
Email()      // blockDisposable: true from global
Password()   // length.min: 10, digits.min: 2 from global
Phone()      // metadata: mobile from global

// Override when needed
Email({ blockDisposable: false })  // Override global
```

**Chainable after rule:**

```typescript
// Any Zod method
Username().min(5).max(20)

// Conditional (via schema utilities)
Password().requiredWhen('changePassword')

// Same as another field
Password().sameAs('password')
```

#### 7.1.1 `createRule` API

Consumers can create custom rules that integrate with the full validex system (three-tier merge, error surface, i18n, `emptyToUndefined`).

```typescript
import { createRule } from '@validex/core';

const VATNumber = createRule({
  name: 'vat',                                    // Namespace for error codes
  defaults: {                                      // Tier 1 defaults
    country: undefined,                            // Required, no default
    strict: false,
  },
  build: (opts, z) => {                            // Validation logic
    return z.string()
      .min(5)
      .refine(v => validateVAT(v, opts.country), {
        params: { code: 'invalid', namespace: 'vat' }
      });
  },
  messages: {                                      // English defaults for error codes
    invalid: '{{label}} is not a valid VAT number',
  },
});

// Usable exactly like built-in rules:
VATNumber({ country: 'DE' }).safeParse('DE123456789');
// Inherits three-tier merge, error surface, i18n — everything

// Translation key (i18n mode):
// validation.messages.vat.invalid
```

**`createRule` contract:**

1. Returns a rule function with the same signature as built-in rules: `(options?) => ZodSchema`
2. Applies two-tier merge for custom rules: `defaults` (from createRule definition) → per-call options. Custom rules do not participate in `setup({ rules: {} })` global config — their defaults are set at creation time.
3. Applies `emptyToUndefined` based on `BaseRuleOptions`
4. Registers error messages in the runtime catalog
5. Rejects reserved namespaces (`base`, `string`, `confirmation`) with a config error

**Built-in rules are built using `createRule` internally** — dogfooding ensures the API is complete and honest.

**Async requirement:** Rules with data-dependent options (`blockDisposable`, `blockCommon`, `blockReserved`) and Phone require `.parseAsync()` for initial validation. Data cached after first load.

**Async enforcement:** Rules requiring async validation throw on synchronous `.parse()` if data not yet loaded — but only if the value passes all sync checks first. If the value fails sync validation (e.g., invalid email format), the sync error is returned without throwing about async requirements:

```typescript
// Invalid email format — sync error returned, no async throw
Email({ blockDisposable: true }).parse("not-an-email");
// ✗ Returns: "Email is not valid" (format error, not async error)

// Valid format but data not loaded — throws about async
Email({ blockDisposable: true }).parse("test@temp.com");
// ❌ Throws: "This rule requires async validation. Use .parseAsync() or call preloadData() first."

// Correct async usage
await Email({ blockDisposable: true }).parseAsync("test@temp.com");  // ✓

// Or preload first
await preloadData({ disposable: true });
Email({ blockDisposable: true }).parse("test@temp.com");  // ✓ Now sync works
```

**Client vs server preloading strategy:**

|Environment|Preload?|Parse method|Rationale|
|---|---|---|---|
|Server (Fastify, Nitro, API routes)|Yes, at startup|`.parse()` sync|Server starts once, preload cost is negligible|
|Client (Nuxt, Next, browser)|No|`.parseAsync()` always|Data loads on demand, only when first needed. Avoids inflating first page load.|

Adapter composables (`useValidation`) always use `parseAsync` internally on the client. The consumer writes `await validate(data)` — whether data needs loading or not, the API is the same.

#### 7.2 Email

**Purpose:** Validate email addresses with business-rule configurability.

**Zod 4 base:** Uses `z.email()` internally for format validation.

**Options:**

```typescript
interface EmailOptions extends BaseRuleOptions {
  length?: Range;                  // Default: { max: 254 } (RFC 5321)
  blockPlusAlias?: boolean;        // Default: false
  blockDomains?: string[];         // Blacklist
  allowDomains?: string[];         // Whitelist (exclusive)
  blockDisposable?: boolean;       // Default: false (requires parseAsync)
  allowSubdomains?: boolean;       // Default: true — whether user@sub.domain.com is accepted
}
```

**Note:** Normalization (lowercase + trim) is controlled by `normalize` in `BaseRuleOptions` (default: `true`).

**Dependency:** `disposable-email-domains-js` npm package for disposable domain detection (dynamic import on first use, community-maintained).

**Error codes:** `email.invalid`, `email.plusAliasBlocked`, `email.disposableBlocked`, `email.domainBlocked`, `email.domainNotAllowed`, `email.subdomainNotAllowed`

#### 7.3 PersonName

**Purpose:** Validate human names with international support.

**Options:**

```typescript
interface PersonNameOptions extends FormatRuleOptions {
  length?: Range;                  // Default: { min: 2, max: 50 }
  words?: Range;                   // Default: { max: 5 }
  allowUnicode?: boolean;          // Default: true
  extraChars?: string;             // Additional allowed characters beyond default set
  disallowChars?: string;          // Characters to remove from default set
  boundary?: Boundary;             // Default: 'alpha' — first/last char must be a letter
  consecutive?: Range;             // Default: { max: 3 } — blocks "Aaaa" keyboard spam
  titleCase?: boolean;             // Default: false — transforms to Title Case
}
```

**Default character set:** Letters (+ unicode if enabled), spaces, hyphens, apostrophes. Use `extraChars` to add (e.g., `"."` for initials like "K. Rajan") or `disallowChars` to remove (e.g., `"'"` if apostrophes aren't used in your locale).

**Error codes:** `personName.invalid`, `personName.maxWords`, `personName.boundary`, `personName.maxConsecutive`

#### 7.4 BusinessName

**Purpose:** Validate company/brand names.

**Options:**

```typescript
interface BusinessNameOptions extends FormatRuleOptions {
  length?: Range;                  // Default: { min: 2, max: 100 }
  extraChars?: string;             // Additional allowed characters beyond default set
  disallowChars?: string;          // Characters to remove from default set
  boundary?: Boundary;             // Default: 'alphanumeric' — first/last char must be letter or digit
  consecutive?: Range;             // Default: { max: 4 } — blocks keyboard spam
  titleCase?: boolean;             // Default: false — transforms to Title Case
}
```

**Default character set:** Letters, digits, spaces, `&`, `.`, `,`, `-`, `'`, `()`. Covers most company names (e.g., "AT&T", "Ben & Jerry's", "H&M").

**Error codes:** `businessName.invalid`, `businessName.boundary`, `businessName.maxConsecutive`

#### 7.5 Password

**Purpose:** Validate passwords with configurable strength requirements.

**Options:**

```typescript
interface PasswordOptions extends BaseRuleOptions {
  length?: Range;                  // Default: { min: 8, max: 128 }
  uppercase?: Range;               // Default: { min: 1 }
  lowercase?: Range;               // Default: { min: 1 }
  digits?: Range;                  // Default: { min: 1 }
  special?: Range;                 // Default: { min: 1 }
  consecutive?: Range;             // Default: { max: 3 }
  blockCommon?: boolean | 'basic' | 'moderate' | 'strict';  // Default: false (async)
  // true | 'basic' = top 100, 'moderate' = top 1,000, 'strict' = top 10,000
}
```

**Error codes:** `password.minUppercase`, `password.minLowercase`, `password.minDigits`, `password.minSpecial`, `password.maxUppercase`, `password.maxConsecutive`, `password.commonBlocked`

#### 7.6 PasswordConfirmation

**Purpose:** Validate password confirmation matches password field.

**Options:**

```typescript
interface PasswordConfirmationOptions extends BaseRuleOptions {
  passwordField?: string;          // Default: 'password'
}
```

**Behavior:** Internally uses `sameAs(passwordField)`.

**Error codes:** `confirmation.mismatch`

**Note:** This rule validates a relationship between fields, not the content of a single field. It exists as a Rule (rather than only a check) for API consistency — consumers expect `PasswordConfirmation()` alongside `Password()`. Schema recipes demonstrate the pairing.

#### 7.7 Phone

**Purpose:** Validate international phone numbers using libphonenumber-js.

**Options:**

```typescript
interface PhoneOptions extends BaseRuleOptions {
  metadata?: 'min' | 'mobile' | 'max' | 'custom';  // Default: 'min'
  customMetadataPath?: string;
  country?: string;                // Default country (ISO 3166-1 alpha-2)
  allowCountries?: string[];       // Default: []
  blockCountries?: string[];       // Default: []
  requireMobile?: boolean;         // Default: false
  requireCountryCode?: boolean;    // Default: false — force +XX prefix in input
  format?: 'e164' | 'international' | 'national';  // Default: 'e164'
}
```

**Always requires `parseAsync()`** due to dynamic metadata loading (unless preloaded via `preloadData({ phone: '...' })`).

**Dependency approach:** `libphonenumber-js/core` (~8kb) is a regular dependency of validex — installed automatically, but only bundled if `Phone` is imported (tree-shaking). Phone metadata files (country patterns, number formats) are bundled inside validex as JSON data and loaded via dynamic import on first use. The consumer never installs anything extra.

**Bundle size impact:**

|What|Size|When loaded|
|---|---|---|
|`libphonenumber-js/core`|~8kb|In bundle only if `Phone` is imported|
|Metadata: `min`|~17kb|Dynamic import on first `parseAsync`|
|Metadata: `mobile`|~22kb|Dynamic import on first `parseAsync`|
|Metadata: `max`|~37kb|Dynamic import on first `parseAsync`|

**Metadata variant determines capability:**

|Variant |Can validate format|Can detect mobile vs landline|
|--------|------|---|
|`min` (default)|Yes|No|
|`mobile`|Yes|Yes|
|`max`|Yes|Yes (+ carrier detection)|

**Config validation:** If `requireMobile: true` is set with `metadata: 'min'`, validex throws a config error: `"requireMobile requires metadata: 'mobile' or 'max'"`. This is checked at schema creation time, not at parse time.

**Error codes:** `phone.invalid`, `phone.requireMobile`, `phone.countryBlocked`, `phone.countryNotAllowed`, `phone.countryCodeRequired`

#### 7.8 Website

**Purpose:** Validate website URLs (HTTP/HTTPS only).

**Zod 4 base:** Uses `z.url()` internally with protocol restriction.

**Options:**

```typescript
interface WebsiteOptions extends BaseRuleOptions {
  length?: Range;                  // Default: { max: 255 }
  requireWww?: boolean;            // Default: false
  requireHttps?: boolean;          // Default: false
  allowDomains?: string[];         // Default: []
  blockDomains?: string[];         // Default: []
  allowSubdomains?: boolean;       // Default: true
  allowPath?: boolean;             // Default: true
  allowQuery?: boolean;            // Default: false
}
```

**Error codes:** `website.invalid`, `website.domainBlocked`, `website.domainNotAllowed`, `website.subdomainNotAllowed`

**Note:** Website exists as a separate rule from URL for DX clarity. `Website()` validates web addresses (HTTP/HTTPS). `URL()` validates URIs with any protocol. They use distinct error codes (`website.invalid` vs `url.invalid`) so translation files can provide specific messages for each.

#### 7.9 URL

**Purpose:** Validate URLs with multiple protocol support.

**Zod 4 base:** Uses `z.url()` internally.

**Options:**

```typescript
interface URLOptions extends BaseRuleOptions {
  protocols?: string[];            // Default: ['http', 'https']
  requireTLD?: boolean;            // Default: true
  length?: Range;                  // Default: { max: 2048 }
  allowDomains?: string[];         // Default: []
  blockDomains?: string[];         // Default: []
  allowQuery?: boolean;            // Default: true
  allowAuth?: boolean;             // Default: false — blocks user:pass@host credentials in URL
}
```

**Error codes:** `url.invalid`, `url.protocolNotAllowed`, `url.domainBlocked`, `url.domainNotAllowed`

#### 7.10 Username

**Purpose:** Validate usernames with reserved word blocking.

**Options:**

```typescript
interface UsernameOptions extends FormatRuleOptions {
  length?: Range;                  // Default: { min: 3, max: 20 }
  pattern?: 'alphanumeric' | 'alphanumeric-dash' | 'alphanumeric-underscore';  // Default: 'alphanumeric-underscore'
  extraChars?: string;             // Default: undefined — additional chars beyond pattern
  disallowChars?: string;          // Default: undefined — remove chars from pattern
  boundary?: Boundary;             // Default: 'alphanumeric' — no _ or - at start/end
  consecutive?: Range;             // Default: undefined — e.g., { max: 2 } blocks user___name
  reservedWords?: string[];        // Default: [] — additional reserved words
  blockReserved?: boolean;         // Default: false (async)
  ignoreCase?: boolean;            // Default: true — treats "Admin" same as "admin"
}
```

**Error codes:** `username.invalid`, `username.reservedBlocked`, `username.boundary`, `username.maxConsecutive`

#### 7.11 Slug

**Purpose:** Validate URL-friendly slugs.

**Options:**

```typescript
interface SlugOptions extends FormatRuleOptions {
  length?: Range;                  // Default: { min: 3, max: 100 }
  extraChars?: string;             // Default: undefined — allow additional chars (e.g., '_' for underscored slugs)
}
```

**Error codes:** `slug.invalid`

#### 7.12 PostalCode

**Purpose:** Validate postal/ZIP codes with country-specific patterns.

**Options:**

```typescript
interface PostalCodeOptions extends FormatRuleOptions {
  country: string;                 // Required — ISO 3166-1 alpha-2 or alpha-3
}
```

**Exception to "options optional" contract:** `country` is required because postal code formats are entirely country-dependent. A default would be presumptuous and error-prone. This exception is explicitly acknowledged in the Rule Design Contract (§7.1).

**Dependency:** `postcode-validator` npm package (covers 200+ countries, supports alpha-2 and alpha-3 codes, case-insensitive). Same pattern as Phone: regular dependency, only bundled when PostalCode is imported (tree-shaking). Dynamic import on first use.

**Unsupported country behavior:** If the country code is not recognized by `postcode-validator`, the rule throws a config error at schema creation time. Consumer can use `regex` (from `FormatRuleOptions`) to provide a custom pattern, or `customFn` for advanced validation.

**Error codes:** `postalCode.invalid`

#### 7.13 LicenseKey

**Purpose:** Validate license keys in configurable formats.

**Options:**

```typescript
interface LicenseKeyOptions extends FormatRuleOptions {
  type?: 'windows' | 'uuid' | 'custom';  // Default: 'custom'
  segments?: number;               // For custom: default 5
  segmentLength?: number;          // For custom: default 5
  separator?: string;              // For custom: default '-'
  charset?: 'alphanumeric' | 'alpha' | 'numeric' | 'hex';  // Default: 'alphanumeric'
}
```

**Preset formats:**

- `windows`: `XXXXX-XXXXX-XXXXX-XXXXX-XXXXX` (5 segments, 5 chars, alphanumeric)
- `uuid`: Standard UUID format

**Error codes:** `licenseKey.invalid`

#### 7.14 UUID

**Purpose:** Validate UUIDs with version filtering.

**Zod 4 base:** Uses `z.uuid()` internally.

**Options:**

```typescript
interface UUIDOptions extends BaseRuleOptions {
  version?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 'any';    // Default: 'any'
}
```

**Rationale for keeping despite Zod 4 coverage:** Owns the error surface. UUID() produces validex error codes and messages consistent with all other rules. Consumers get one API style for everything.

**Error codes:** `uuid.invalid`

#### 7.15 JWT

**Purpose:** Validate JWT structure and optionally check expiry.

**Zod 4 base:** Uses `z.jwt()` internally for structure validation.

**Options:**

```typescript
interface JWTOptions extends BaseRuleOptions {
  requireExpiry?: boolean;         // Default: false
  checkExpiry?: boolean;           // Default: false
  checkNotBefore?: boolean;        // Default: false — check nbf (not before) claim
  clockTolerance?: number;         // Default: 0 (seconds) — tolerance for expiry/nbf checks
  requireClaims?: string[];        // Default: undefined — require specific claims (e.g., ['sub', 'iss', 'aud'])
  allowAlgorithms?: string[];      // Default: undefined — restrict accepted algorithms (e.g., ['RS256', 'HS256'])
}
```

**Rationale for keeping despite Zod 4 coverage:** `requireExpiry`, `checkExpiry`, `checkNotBefore`, `requireClaims`, and `allowAlgorithms` are business logic that Zod 4's `z.jwt()` does not provide. Combined, they turn JWT into a full auth token gate. Also owns the error surface for consistency.

**Note:** `clockTolerance` only applies when `checkExpiry` or `checkNotBefore` is `true`. `allowAlgorithms` prevents `'none'` algorithm attacks when specified.

**Error codes:** `jwt.invalid`, `jwt.expired`, `jwt.notYetValid`, `jwt.missingClaim`, `jwt.algorithmNotAllowed`

#### 7.16 DateTime

**Purpose:** Validate date/time strings with business constraints.

**Zod 4 base:** Uses `z.iso.datetime()`, `z.iso.date()`, or `z.iso.time()` internally based on format option.

**Options:**

```typescript
interface DateTimeOptions extends BaseRuleOptions {
  format?: 'iso' | 'date' | 'time';  // Default: 'iso'
  min?: Date | string;
  max?: Date | string;
  allowFuture?: boolean;           // Default: true
  allowPast?: boolean;             // Default: true
  allowOffset?: boolean;           // Default: true — accept timezone offsets (+02:00)
  allowLocal?: boolean;            // Default: false — accept timezone-less datetimes
  precision?: number;              // Default: undefined (any) — sub-second precision (0=seconds, 3=ms, 6=μs)
}
```

**Rationale for keeping despite Zod 4 coverage:** `allowFuture`, `allowPast`, `allowOffset`, `allowLocal`, and `precision` are business constraints Zod doesn't provide as options. `min`/`max` with Date objects is more ergonomic than Zod's regex-level validation. Owns the error surface.

**Error codes:** `dateTime.invalid`, `dateTime.tooEarly`, `dateTime.tooLate`, `dateTime.noFuture`, `dateTime.noPast`

#### 7.17 Token

**Purpose:** Validate opaque string tokens in specific formats (nanoid, hex, base64, cuid, cuid2, ulid).

**Zod 4 base:** Uses `z.nanoid()`, `z.hex()`, `z.base64()`, `z.cuid()`, `z.cuid2()`, `z.ulid()` internally based on type.

**Options:**

```typescript
interface TokenOptions extends FormatRuleOptions {
  type: 'nanoid' | 'hex' | 'base64' | 'cuid' | 'cuid2' | 'ulid';
  length?: Range;                  // Default: type-specific (nanoid:21, cuid:25, cuid2:24, ulid:26, hex/base64:undefined)
}
```

**Note:** `type` is required — there's no sensible default format for a generic token. `length` defaults to the standard length for each type where one exists. Consumer can override: `Token({ type: 'nanoid', length: 12 })`.

When `length` is a number, it means exact length. When `length` is `{ min, max }`, it means a range.

**Rationale:** Groups related identifier formats under one rule. Each type delegates to Zod 4's native validator but remaps errors to the validex error surface.

**Error codes:** `token.invalid` (with `type` available in params for per-type translation)

#### 7.18 Text

**Purpose:** Validate free-text fields (bio, description, comments) with content blocking.

**Options:**

```typescript
interface TextOptions extends FormatRuleOptions {
  length?: Range;                  // Default: undefined (no limit)
  words?: Range;                   // Default: undefined (no limit)
  consecutive?: Range;             // Default: undefined — block character spam
  noEmails?: boolean;              // Default: false — block email addresses in text
  noUrls?: boolean;                // Default: false — block URLs in text
  noPhoneNumbers?: boolean;        // Default: false — block phone numbers in text
  noHtml?: boolean;                // Default: false — block HTML tags in text
}
```

**Internally uses:** `containsEmail`, `containsUrl`, `containsHtml` checks (regex-based). `containsPhoneNumber` uses `libphonenumber-js` `findPhoneNumbersInText()` for accurate international phone number detection — this means `Text({ noPhoneNumbers: true })` pulls in `libphonenumber-js/core` as a dependency.

**Error codes:** `text.invalid`, `text.noEmails`, `text.noUrls`, `text.noPhoneNumbers`, `text.noHtml`, `text.maxWords`, `text.maxConsecutive`

#### 7.19 Country

**Purpose:** Validate ISO country codes.

**Options:**

```typescript
interface CountryOptions extends BaseRuleOptions {
  format?: 'alpha2' | 'alpha3';    // Default: 'alpha2'
  allowCountries?: string[];       // Whitelist of country codes
  blockCountries?: string[];       // Blacklist of country codes
}
```

**Data source:** ISO 3166-1 country code list (bundled, same data used by Phone rule).

**Error codes:** `country.invalid`, `country.blocked`, `country.notAllowed`

#### 7.20 Currency

**Purpose:** Validate ISO 4217 currency codes.

**Options:**

```typescript
interface CurrencyOptions extends BaseRuleOptions {
  allowCurrencies?: string[];      // Whitelist (e.g., ['EUR', 'USD', 'GBP'])
  blockCurrencies?: string[];      // Blacklist
}
```

**Data source:** ISO 4217 currency code list (bundled).

**Error codes:** `currency.invalid`, `currency.blocked`, `currency.notAllowed`

#### 7.21 Color

**Purpose:** Validate color values in various formats.

**Options:**

```typescript
interface ColorOptions extends BaseRuleOptions {
  format?: 'hex' | 'rgb' | 'hsl' | 'any';  // Default: 'hex'
  alpha?: boolean;                           // Default: true (allow alpha channel)
}
```

**Formats:**

- `hex`: `#RGB`, `#RRGGBB`, `#RRGGBBAA` (with alpha)
- `rgb`: `rgb(0, 0, 0)`, `rgba(0, 0, 0, 0.5)` (with alpha)
- `hsl`: `hsl(0, 0%, 0%)`, `hsla(0, 0%, 0%, 0.5)` (with alpha)
- `any`: accepts any of the above

**Error codes:** `color.invalid`

#### 7.22 CreditCard

**Purpose:** Validate credit card numbers with Luhn algorithm and issuer detection.

**Options:**

```typescript
interface CreditCardOptions extends BaseRuleOptions {
  allowIssuers?: ('visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'unionpay')[];
  blockIssuers?: ('visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'unionpay')[];
}
```

**Validation:** Luhn checksum algorithm + issuer prefix matching.

**Note:** `allowIssuers` and `blockIssuers` are mutually exclusive. If both provided, `allowIssuers` takes precedence. This validates the number format and checksum only — it does NOT verify the card is active, has funds, or is authorized. That's the payment processor's job.

**Error codes:** `creditCard.invalid`, `creditCard.issuerNotAllowed`, `creditCard.issuerBlocked`

#### 7.23 IBAN

**Purpose:** Validate International Bank Account Numbers.

**Options:**

```typescript
interface IbanOptions extends BaseRuleOptions {
  allowCountries?: string[];       // Whitelist of country codes
  blockCountries?: string[];       // Blacklist of country codes
}
```

**Validation:** Structure check (2-letter country + 2 check digits + country-specific BBAN) + mod-97 checksum. Country-specific length and format validation.

**Data source:** IBAN country format table (~80 countries, bundled).

**Error codes:** `iban.invalid`, `iban.countryBlocked`, `iban.countryNotAllowed`

#### 7.24 VatNumber

**Purpose:** Validate VAT identification numbers (EU and international).

**Options:**

```typescript
interface VatNumberOptions extends BaseRuleOptions {
  country?: string;                // ISO country code — auto-detected from prefix if not provided
  requirePrefix?: boolean;         // Default: false — force country prefix in value (e.g., "DE" in "DE123456789")
}
```

**Validation:** Country-specific format validation (prefix + structure). Does NOT verify against VIES or other tax authority APIs — that requires network calls (non-goal). Consumer can use `customFn` for external API validation.

**Behavior:**
- `country` set + `requirePrefix: false` → prefix optional, validates against country format
- `country` set + `requirePrefix: true` → prefix required in value
- `country` undefined → auto-detect from prefix (e.g., "DE" → Germany). Fails if no recognizable prefix.

**Data source:** VAT format patterns per country (bundled, ~30 countries).

**Error codes:** `vatNumber.invalid`

#### 7.25 MacAddress

**Purpose:** Validate MAC addresses.

**Zod 4 base:** Uses `z.mac()` internally.

**Options:**

```typescript
interface MacAddressOptions extends BaseRuleOptions {
  delimiter?: ':' | '-' | 'none';  // Default: ':'
}
```

**Rationale for keeping despite Zod 4 coverage:** Owns the error surface for consistency with all other rules.

**Error codes:** `macAddress.invalid`

#### 7.26 IpAddress

**Purpose:** Validate IP addresses with version and scope filtering.

**Zod 4 base:** Uses `z.ipv4()` and `z.ipv6()` internally.

**Options:**

```typescript
interface IpAddressOptions extends BaseRuleOptions {
  version?: 'v4' | 'v6' | 'any';  // Default: 'any'
  allowCidr?: boolean;             // Default: false — allow CIDR notation (e.g., 192.168.0.0/24)
  allowPrivate?: boolean;          // Default: true — allow private/reserved ranges
}
```

**Rationale for keeping despite Zod 4 coverage:** `allowPrivate: false` (blocking 192.168.x.x, 10.x.x.x, 172.16-31.x.x, ::1, fc00::/7) is genuine business logic Zod doesn't provide. Owns the error surface.

**Error codes:** `ipAddress.invalid`, `ipAddress.privateNotAllowed`

-----

## Part VI: Schema Recipes

### 8. Common Schema Patterns

**v1 scope:** validex does not ship pre-built schemas. Rules are the product — they are the composable building blocks. Schemas are trivial compositions that every project customizes. Instead, we document common patterns as recipes.

#### 8.1 Auth Flow Recipes

**Login:**

```typescript
import { Email, Password } from '@validex/core';

const LoginSchema = z.object({
  email: Email(),
  password: Password(),
});
```

**Register:**

```typescript
import { Email, Password, PasswordConfirmation, Username } from '@validex/core';

const RegisterSchema = z.object({
  email: Email(),
  password: Password(),
  passwordConfirmation: PasswordConfirmation(),
  username: Username(),  // optional — add if needed
  acceptTerms: z.literal(true),  // optional — add if needed
});
```

**Forgot Password:**

```typescript
const ForgotPasswordSchema = z.object({
  email: Email(),
});
```

**Password Reset:**

```typescript
const PasswordResetSchema = z.object({
  password: Password(),
  passwordConfirmation: PasswordConfirmation(),
});
```

**Change Password:**

```typescript
const ChangePasswordSchema = z.object({
  currentPassword: Password(),
  newPassword: Password(),
  confirmPassword: PasswordConfirmation({ passwordField: 'newPassword' }),
}).refine(
  (data) => data.currentPassword !== data.newPassword,
  { message: 'New password must differ from current password', path: ['newPassword'] }
);
```

**Rationale for recipes over exports:** Every project customizes auth forms (add name, phone, avatar, company, role). Pre-built schemas create the illusion of completeness when the consumer always needs to extend or modify. Rules provide the real value — schemas are 3-5 lines of composition that belong in the consumer's codebase, not in the library.

-----

## Part VII: Testing and Constraints

### 9. Testing Requirements

#### 9.1 Test Categories

|Category      |Purpose                     |Example                    |
|--------------|----------------------------|---------------------------|
|Unit          |Individual function behavior|`Email().parse()`          |
|Integration   |Component interaction       |Schema with multiple rules |
|RFC Compliance|Standards adherence         |RFC 5321 email vectors     |
|Edge Cases    |Boundary conditions         |Empty string, max length   |
|Security      |Malicious input handling    |XSS, injection attempts    |
|Property-Based|Invariant verification      |"Valid email always parses"|

#### 9.2 Coverage Requirements

|Metric             |Minimum                   |
|-------------------|--------------------------|
|Line coverage      |95%                       |
|Branch coverage    |90%                       |
|Rule coverage      |100% (all rules tested)   |
|Check coverage     |100% (all checks tested)  |
|Error code coverage|100% (all codes triggered)|

#### 9.3 Test Data Sources

|Rule      |External Test Data                          |
|----------|--------------------------------------------|
|Email     |RFC 5321/5322 examples, validator.js vectors|
|Phone     |libphonenumber test corpus                  |
|URL       |WHATWG URL Standard examples                |
|PersonName|Unicode CLDR, big-list-of-naughty-strings   |
|All       |big-list-of-naughty-strings (security)      |

#### 9.4 Property-Based Testing

Using `fast-check`:

```typescript
// Never throws on any input
fc.assert(fc.property(fc.string(), (input) => {
  const result = Email().safeParse(input);
  return typeof result.success === "boolean";
}));

// Normalization is idempotent
fc.assert(fc.property(fc.emailAddress(), (email) => {
  const once = Email().parse(email);
  const twice = Email().parse(once);
  return once === twice;
}));

// Valid inputs always parse successfully
fc.assert(fc.property(fc.emailAddress(), (email) => {
  return Email().safeParse(email).success === true;
}));
```

#### 9.5 Security Test Cases

Every rule must reject without throwing:

```typescript
const securityInputs = [
  "<script>alert(1)</script>",
  "'; DROP TABLE users; --",
  "${7*7}",
  "{{constructor.constructor('return this')()}}",
  "\x00\x01\x02",
  "a".repeat(100000),
  null,
  undefined,
  {},
  [],
];
```

-----

### 10. Invariants and Limits

#### 10.1 Performance Constraints

|Operation                             |Max Time|
|--------------------------------------|--------|
|Single field validation (sync)        |< 1ms   |
|Schema with 10 fields (sync)          |< 5ms   |
|Phone validation (with libphonenumber)|< 10ms  |
|Data-dependent validation (first call)|< 100ms |

#### 10.2 Size Constraints

|Metric                         |Limit         |
|-------------------------------|--------------|
|Core bundle (no data, no phone)|< 10kb gzipped|
|With all data loaded           |< 60kb gzipped|
|With phone (min metadata)      |+ ~17kb (raw) |
|With phone (mobile metadata)   |+ ~22kb (raw) |
|With phone (max metadata)      |+ ~37kb (raw) |
|libphonenumber-js/core         |+ ~8kb        |
|postcode-validator                |+ ~15kb       |
|disposable-email-domains       |+ ~30kb       |

**Note:** Phone metadata, postal code data, and disposable domain lists are loaded via dynamic import — not included in the initial bundle. Core bundle target assumes none of these are imported.

**Dependencies:**

|Dependency                 |Type              |Used by          |When loaded                    |
|---------------------------|------------------|-----------------|-------------------------------|
|`zod` ^3.25.0 || ^4.0.0               |peer dependency   |Everything       |Always                         |
|`libphonenumber-js/core`   |regular dependency|Phone            |In bundle if Phone imported    |
|`postcode-validator`          |regular dependency|PostalCode       |Dynamic import on first use    |
|`disposable-email-domains-js` |regular dependency|Email (blockDisposable)|Dynamic import on first use|

**Verification:**

- Bundle sizes verified via automated CI tests
- Test against: Vite (Rollup), Webpack 5, esbuild
- Scenarios: Email-only, Email+Password, Email+Phone, full library

#### 10.3 Compatibility Invariants

|Constraint |Requirement|
|-----------|-----------|
|Zod version|^4.0.0     |
|TypeScript |^5.9.0     |
|Node       |≥22.0.0    |
|Deno       |≥1.37.0    |
|ES version |ES2024     |

#### 10.4 Security Invariants

1. **No eval** — Never execute dynamic code
2. **No RegExp DoS** — All patterns must be safe from catastrophic backtracking
3. **No external fetches** — All data bundled, no runtime network
4. **Input sanitization** — All inputs treated as untrusted
5. **No sensitive logging** — Never log input values

-----

## Part VIII: Framework Adapters

### 11. Validation Result Contract

All validation methods — the core `validate()` utility and all adapter methods (`useValidation`, `request.validate()`, etc.) — return a consistent `ValidationResult` shape.

#### 11.1 ValidationResult Interface

```typescript
interface ValidationResult<T> {
  success: boolean;
  data?: T;                                    // Typed parsed data, only if success
  errors: Record<string, string[]>;            // Flat dot-path → all messages
  firstErrors: Record<string, string>;         // Flat dot-path → first message only
  nestedErrors: Record<string, any>;           // Nested object → all messages
  issues?: z.ZodIssue[];                       // Raw Zod issues (escape hatch)
}
```

**`errors`** is the source of truth — all errors, all fields, flat dot-path keys.

**`firstErrors`** is a convenience accessor for UIs that show one message per field.

**`nestedErrors`** is a computed accessor for programmatic use (e.g., passing a subtree of errors to a child component).

#### 11.2 Error Output Shapes

Given a schema with nested fields:

```typescript
const schema = z.object({
  billing: z.object({
    email: Email(),
    address: z.object({
      postalCode: PostalCode({ country: 'US' }),
    }),
  }),
  password: Password(),
});
```

If all fields fail validation:

```typescript
// result.errors (flat dot-path keys → all messages per field)
{
  "billing.email": ["Email is required"],
  "billing.address.postalCode": ["Invalid postal code"],
  "password": [
    "Password must be at least 8 characters",
    "Password must have at least 1 uppercase character",
    "Password must have at least 1 digit"
  ]
}

// result.firstErrors (flat dot-path keys → first message only)
{
  "billing.email": "Email is required",
  "billing.address.postalCode": "Invalid postal code",
  "password": "Password must be at least 8 characters"
}

// result.nestedErrors (nested objects → all messages)
{
  billing: {
    email: ["Email is required"],
    address: {
      postalCode: ["Invalid postal code"]
    }
  },
  password: [
    "Password must be at least 8 characters",
    "Password must have at least 1 uppercase character",
    "Password must have at least 1 digit"
  ]
}
```

-----

### 12. Nuxt Adapter (`@validex/nuxt`)

#### 12.1 Module Configuration

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['validex/nuxt'],
  validex: {
    rules?: Partial<RuleDefaults>;
    i18n?: {
      enabled?: boolean;       // Default: auto-detects @nuxtjs/i18n
      prefix?: string;
      separator?: string;
      pathMode?: string;
    };
    preload?: PreloadOptions;  // Data to preload at server start
  },
});
```

#### 12.2 Auto-Setup Behavior

The module:

1. Registers a Nuxt plugin that calls `setup()` with the provided config
2. Runs `preloadData()` during server initialization (Nitro plugin) if `preload` options are set
3. Exposes composables via auto-imports

**SSR data preloading:** `preloadData()` runs once in the Nitro server context. Since data is cached globally, all subsequent SSR renders and API routes can use sync `.parse()` for data-dependent rules.

#### 12.3 Composables

```typescript
// Auto-imported by the module
function useValidation<T extends z.ZodSchema>(schema: T): {
  validate: (data: unknown) => Promise<ValidationResult<z.infer<T>>>;
  clearErrors: () => void;
  getErrors: () => Record<string, string[]>;
  getFirstErrors: () => Record<string, string>;
  getIsValid: () => boolean;
  getData: () => z.infer<T> | undefined;
};
```

The getter pattern (`getErrors`, `getFirstErrors`) is framework-agnostic — works with Vue refs, React state, or plain JavaScript. `validateField` is planned for v1.1.

**Usage:**

```vue
<script setup>
import { Email, PersonName } from '@validex/core';

// Compose any schema on demand
const contactSchema = z.object({
  name: PersonName(),
  email: Email(),
  message: z.string().min(10).max(2000),
});

const { validate, getFirstErrors, clearErrors } = useValidation(contactSchema);

async function onSubmit(formData) {
  const result = await validate(formData);
  if (result.success) {
    // submit to API
  }
}
</script>

<template>
  <form @submit.prevent="onSubmit(formData)">
    <input v-model="formData.email" />
    <span v-if="getFirstErrors()['email']">{{ getFirstErrors()['email'] }}</span>
  </form>
</template>
```

#### 12.4 i18n Integration

When `@nuxtjs/i18n` is detected:

- Module auto-enables `i18n.enabled` in validex config
- `useValidation` automatically uses `useI18n().t()` as the message transform
- Errors returned by composables are already translated

The consumer provides translation keys in their locale files matching the `validation.*` key format.

**Without @nuxtjs/i18n:** Module works normally, returns English messages or raw keys depending on manual `i18n.enabled` setting.

#### 12.5 SSR Considerations

- Config is set once during plugin initialization, shared across all requests
- `customError` handler registered globally — safe for SSR since config is request-independent
- Composable state (`errors` ref) is per-component instance, not shared across requests
- `preloadData()` runs once at server start, not per-request

-----

### 13. Fastify Adapter (`@validex/fastify`)

#### 13.1 Plugin Registration

```typescript
import Fastify from 'fastify';
import { validexPlugin } from '@validex/fastify';

const app = Fastify();

await app.register(validexPlugin, {
  rules: {
    email: { blockDisposable: true },
    password: { digits: { min: 1 } },
  },
  preload: { disposable: true, passwords: true },
});
```

The plugin:

1. Calls `setup()` with the provided config
2. Runs `preloadData()` during registration (awaited, so data is ready before routes accept requests)
3. Decorates the Fastify instance and request with validation methods
4. Optionally integrates with Fastify's built-in schema validation

#### 13.2 Instance Decorator

```typescript
// Available anywhere you have access to the Fastify instance
const result = app.validate(schema, data);
// result: ValidationResult<T>
```

**Usage:**

```typescript
// Validate arbitrary data anywhere in the app
app.post('/webhook', async (request, reply) => {
  const schema = z.object({
    event: z.string(),
    payload: z.object({
      email: Email(),
      timestamp: DateTime(),
    }),
  });

  const result = app.validate(schema, request.body);
  if (!result.success) {
    return reply.status(400).send({ errors: result.firstErrors });
  }

  // result.data is fully typed
  processWebhook(result.data);
});
```

#### 13.3 Request Decorator

```typescript
// Validates request.body against the given schema
const result = request.validate(schema);
// result: ValidationResult<T>

// Can also validate query/params
const result = request.validate(schema, { source: 'query' });
const result = request.validate(schema, { source: 'params' });
```

**Usage:**

```typescript
app.post('/contact', async (request, reply) => {
  const schema = z.object({
    name: PersonName(),
    email: Email(),
    message: z.string().min(10).max(2000),
  });

  const result = request.validate(schema);
  if (!result.success) {
    return reply.status(400).send({
      errors: result.firstErrors,
    });
  }

  await sendContactEmail(result.data);
  return reply.send({ success: true });
});
```

#### 13.4 Route-Level Schema Validation

For declarative validation, schemas can be passed in the route options. The plugin integrates with Fastify's schema validation system:

```typescript
import { Email, Password, PersonName, Phone } from '@validex/core';

app.post('/register', {
  schema: {
    body: z.object({
      name: PersonName(),
      email: Email({ blockDisposable: true }),
      password: Password(),
      phone: Phone().optional(),
    }),
  },
}, async (request, reply) => {
  // request.body is already validated and typed
  // If validation failed, Fastify auto-returns error response (see 14.5)
  const { name, email, password } = request.body;
});

// Works with consumer-defined schemas
const LoginSchema = z.object({ email: Email(), password: Password() });
app.post('/login', {
  schema: { body: LoginSchema },
}, handler);

// Or any composition
app.put('/profile/:id', {
  schema: {
    params: z.object({ id: z.string().uuid() }),
    body: z.object({
      name: PersonName(),
      email: Email(),
    }),
  },
}, handler);
```

#### 13.5 Error Response Format

When route-level schema validation fails, the plugin formats the error response using validex's error surface:

```json
{
  "statusCode": 400,
  "error": "Validation Error",
  "errors": {
    "email": "Disposable email addresses are not allowed",
    "password": "Password must be at least 8 characters"
  },
  "allErrors": {
    "email": ["Disposable email addresses are not allowed"],
    "password": [
      "Password must be at least 8 characters",
      "Password must have at least 1 uppercase character"
    ]
  }
}
```

The response includes `firstErrors` (as `errors` for simplicity) and all errors (as `allErrors`). The consumer can customize this format via a hook:

```typescript
await app.register(validexPlugin, {
  // ... rules, preload
  errorHandler: (result, request, reply) => {
    // Custom error response format
    return reply.status(422).send({
      message: 'Invalid input',
      fields: result.firstErrors,
    });
  },
});
```

-----

## Appendix A: Migration from Zod

```typescript
// Before (raw Zod)
const schema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).refine(v => /[A-Z]/.test(v)).refine(v => /[0-9]/.test(v)),
});

// After (validex)
import { Email, Password } from '@validex/core';
const schema = z.object({
  email: Email(),
  password: Password({ special: undefined }),  // No special chars required
});
```

-----

## Appendix B: Glossary

|Term             |Definition                                                                            |
|-----------------|--------------------------------------------------------------------------------------|
|Check            |Pure function for validation logic (character composition, content detection, etc.)    |
|Rule             |Configurable validation function composing Zod 4 native checks + custom checks, returns Zod schema|
|Schema           |Pre-composed Zod object schema for common forms                                       |
|Adapter          |Subpath export providing framework integration (composables, hooks, plugins)           |
|ValidationResult |Standardized return type from adapter validate methods (errors, firstErrors, nestedErrors)|
|Error key        |i18n lookup key emitted on validation failure                                         |
|Namespace        |Category prefix for error codes (base, email, string, etc.)                           |
|Normalization    |Transform to canonical form (trim, lowercase, etc.)                                   |
|Three-tier merge |Config resolution: Defaults → Globals → Per-call overrides, deep merged per-key       |
|Subpath export   |Package entry point like `@validex/nuxt` that enables tree-shaking of adapter code      |

-----

*End of SPEC.md*
