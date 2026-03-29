# PLAN.md — validex Implementation Checklist

> Derived from docs/BUILD.md. Every task is a single concrete action.
> Nothing is started yet.

## Maintenance Rules

1. After completing each individual task, immediately change its checkbox from `[ ]` to `[x]`. Do this before starting the next task.
2. After completing all tasks in a phase, run the phase verification checks. Tick each verification item as you confirm it passes.
3. After ALL verification items pass, add a completion line at the end of the phase section: `Phase N complete — YYYY-MM-DD`
4. If a task fails or needs rework, add a note inline (e.g., `- [x] 4.8 — ... REWORKED: boundary check was off-by-one`).
5. Never delete tasks. Never uncheck completed tasks. Only add or annotate.
6. At the start of each new session, read PLAN.md to see where we left off. Resume from the first unchecked task.

---

## Hard Rules for ALL Phases (non-negotiable)

1. **Zero ESLint errors.** No exceptions.
2. **Zero ESLint warnings.** Warnings are errors that haven't been fixed yet.
3. **Zero TypeScript errors.** `pnpm typecheck` must pass.
4. **No ESLint config changes without approval.** Code adapts to rules, not vice versa.
5. **No `// eslint-disable` comments without a `// REASON:` comment.**
6. **No `any` type.** Use `unknown` with type narrowing.
7. **Coverage thresholds enforced.** 95% lines/functions/statements, 90% branches.
8. **JSDoc required** on all exported functions, interfaces, and types in `src/`.
9. **Zod Classic only.** Import from `zod` or `zod/v4`. Never from `zod/v4/core` or `zod/mini`. Use `error` not `message`. Use `.refine()` method chains.
10. **Every phase gate requires:** zero lint errors, zero warnings, zero TypeScript errors, no `any`, no unapproved ESLint config changes.

---

## Phase 0: Project Scaffold

- [x] 0.1 — Verify `CLAUDE.md` exists at project root (already present)
- [x] 0.2 — Run `pnpm init` and configure `package.json` with: name `validex`, version `1.0.0-alpha.0`, `type: "module"`, `packageManager: "pnpm@9.15.0"`, `sideEffects: false`, exports map (5 subpaths), all scripts (`dev`, `build`, `lint`, `lint:fix`, `typecheck`, `test`, `test:watch`, `test:coverage`, `test:checks`, `test:rules`, `test:integration`, `test:properties`, `test:adapters`, `check`, `check:full`, `knip`, `size`, `changelog`, `release`, `prepublishOnly`, `prepare`), peerDependencies (`zod: "^3.25.0 || ^4.0.0"`), dependencies (libphonenumber-js, postal-codes-js, disposable-email-domains), devDependencies (vitest, @vitest/coverage-v8, @faker-js/faker, fast-check, @nuxt/test-utils, fastify, typescript, tsup, @antfu/eslint-config, eslint, eslint-plugin-regexp, eslint-plugin-sonarjs, eslint-plugin-vitest, simple-git-hooks, lint-staged, knip, publint, @arethetypeswrong/cli, bumpp, conventional-changelog-cli, conventional-changelog-conventionalcommits, size-limit, @size-limit/preset-small-lib), peerDependenciesMeta, `simple-git-hooks` config (pre-commit: lint-staged, commit-msg: conventional commit validation), `lint-staged` config
- [x] 0.3 — Create `tsconfig.json` with strict mode and all flags (noUncheckedIndexedAccess, exactOptionalPropertyTypes, noImplicitReturns, noFallthroughCasesInSwitch, noPropertyAccessFromIndexSignature, forceConsistentCasingInFileNames, moduleResolution bundler, target ES2022, module ESNext, declaration, declarationMap, sourceMap, outDir dist)
- [x] 0.4 — Create `tsup.config.ts` for ESM + CJS dual output with declaration files
- [x] 0.5 — Create `vitest.config.ts` with globals, V8 coverage provider, reporters (text, lcov, html), include `src/**/*.ts`, exclude `src/**/index.ts` and `src/data/**`, thresholds: 95% lines/functions/statements, 90% branches
- [x] 0.6 — Create `eslint.config.ts` using `@antfu/eslint-config` flat config with: type `lib`, typescript with tsconfigPath, stylistic (indent 2, single quotes, no semi), ignores (fixtures, dist), strict TS rules (consistent-type-definitions interface, explicit-function-return-type, no-explicit-any error, strict-boolean-expressions, consistent-type-imports, no-non-null-assertion, no-console warn, prefer-const, max-lines 300, max-lines-per-function 50, max-depth 3, unicorn/filename-case camelCase), JSDoc enforcement on `src/**/*.ts` (require-jsdoc, require-description, require-param, require-returns), eslint-plugin-regexp (flat/recommended + no-super-linear-backtracking, no-misleading-unicode-character, strict), eslint-plugin-sonarjs (cognitive-complexity 15, no-identical-expressions, no-duplicate-string threshold 3, no-redundant-jump, no-collapsible-if, prefer-single-boolean-return), eslint-plugin-vitest for `tests/**/*.ts` (recommended rules + no-focused-tests error, no-disabled-tests warn, expect-expect, no-identical-title, relaxed: explicit-function-return-type off, max-lines-per-function off, max-lines 500, jsdoc off, sonarjs/no-duplicate-string off)
- [x] 0.7 — Create `.vscode/settings.json` (prettier disabled, formatOnSave disabled, eslint codeActionsOnSave, eslint validate for js/ts/json/jsonc)
- [x] 0.8 — Create `.node-version` with content `22`
- [x] 0.9 — Create `.npmrc` with `shamefully-hoist=false`, `strict-peer-dependencies=true`, `auto-install-peers=false`
- [x] 0.10 — Create `.size-limit.json` with two entries: Core (Email + Password) import `{ Email, Password }` from `dist/index.js` limit `10 kB`, Full library import `*` from `dist/index.js` limit `25 kB`
- [x] 0.11 — Create directory structure: `src/` (index.ts, types.ts, config/, core/, checks/, rules/, utilities/, data/, adapters/nuxt/, adapters/fastify/, internal/), `tests/` (fixtures/, helpers/, checks/, rules/, config/, core/, adapters/, integration/, properties/)
- [x] 0.12 — Create `src/index.ts` as empty re-export barrel
- [x] 0.13 — Create `.github/workflows/ci.yml` — fully specified: triggers on push to dev + PR to main, quality job with Node 18/20/22 matrix (checkout, pnpm, setup-node, install --frozen-lockfile, lint, typecheck, test:coverage, build, publint, attw --pack, knip, size), publish job (only on main push, checks version diff, publishes with NPM_TOKEN)
- [x] 0.14 — Create `CHANGELOG.md`, `CONTRIBUTING.md`, `LICENSE` (MIT), `README.md` (minimal placeholder)
- [x] 0.15 — Run `pnpm install`
- [ ] 0.16 — Run `pnpm prepare` to install git hooks (simple-git-hooks)
- [ ] 0.17 — Initialize git repo with `main` + `dev` branches

### Phase 0 — Verification
- [ ] `pnpm build` produces `dist/` with no errors
- [ ] `pnpm test` runs and passes (empty suite)
- [ ] `pnpm lint` passes with **zero errors AND zero warnings**
- [ ] `pnpm typecheck` passes with zero errors
- [ ] TypeScript strict mode enabled with all flags
- [ ] `sideEffects: false` in package.json
- [ ] `packageManager` field set in package.json
- [ ] Subpath exports resolve correctly
- [ ] Git hooks installed (`pnpm prepare`) — pre-commit runs lint-staged, commit-msg validates conventional commits
- [ ] Git repo initialised with `main` + `dev` branches
- [ ] `.github/workflows/ci.yml` fully configured (Node 18/20/22, bundle size check, auto-publish on main merge)
- [ ] `.node-version` set to `22`
- [ ] `.npmrc` configured with `strict-peer-dependencies=true`
- [ ] `.size-limit.json` configured with bundle thresholds (Core < 10kB, Full < 25kB)
- [ ] CLAUDE.md, CHANGELOG.md, CONTRIBUTING.md, LICENSE exist
- [ ] `.vscode/settings.json` present with ESLint-as-formatter config
- [ ] Peer dependency is `"zod": "^3.25.0 || ^4.0.0"`
- [ ] No `any` in any file

---

## Phase 1: Foundation

- [ ] 1.1 — Create `src/types.ts` with `Range`, `Boundary`, `BaseRuleOptions`, `FormatRuleOptions` type definitions (with JSDoc on all exports)
- [ ] 1.2 — Create `src/internal/resolveRange.ts` — normalizes `Range` to `{ min?, max? }` (with JSDoc, explicit return type)
- [ ] 1.3 — Create `src/internal/resolveBoundary.ts` — normalizes `Boundary` to `{ start, end }` (with JSDoc, explicit return type)
- [ ] 1.4 — Create `src/internal/normalizers.ts` — per-rule normalize functions (with JSDoc, explicit return types)
- [ ] 1.5 — Create `src/config/store.ts` — module-level config singleton (`let config: GlobalConfig`) (with JSDoc)
- [ ] 1.6 — Create `src/config/defaults.ts` — built-in defaults for all 25 rules (from DEFAULTS.md) (with JSDoc)
- [ ] 1.7 — Create `src/config/merge.ts` — three-tier merge logic (defaults → globals → per-call), `undefined` = intentional removal (with JSDoc)
- [ ] 1.8 — Create `src/config/index.ts` — exports `setup()`, `getConfig()`, `preloadData()` (with JSDoc)
- [ ] 1.9 — Create `src/core/customError.ts` — register `z.config({ customError })`, map Zod issue types to validex codes per mapping table. Use Zod Classic APIs only, `error` not `message` (with JSDoc)
- [ ] 1.10 — Create `src/core/errorMap.ts` — English default messages for all ~82 error codes, `{{param}}` interpolation, i18n key mode (with JSDoc)
- [ ] 1.11 — Create `src/core/getParams.ts` — extract `{ code, namespace, label, labelKey?, path, key, ...ruleParams }` from Zod issues (with JSDoc)
- [ ] 1.12 — Create `src/core/validate.ts` — wraps `safeParse`/`safeParseAsync` into `ValidationResult` with `errors`, `firstErrors`, `nestedErrors`, `issues` (with JSDoc)
- [ ] 1.13 — Create `src/core/createRule.ts` — rule factory: three-tier merge, emptyToUndefined, normalize, regex override, customFn, register messages, reject reserved namespaces. Uses `.refine()` method chains (Zod Classic) (with JSDoc)
- [ ] 1.14 — Write unit tests for `resolveRange` and `resolveBoundary` in `tests/core/`
- [ ] 1.15 — Write unit tests for config store, merge, setup/getConfig in `tests/config/`
- [ ] 1.16 — Write unit tests for customError mapping in `tests/core/`
- [ ] 1.17 — Write unit tests for errorMap interpolation and i18n mode in `tests/core/`
- [ ] 1.18 — Write unit tests for getParams extraction in `tests/core/`
- [ ] 1.19 — Write unit tests for validate utility (ValidationResult shape) in `tests/core/`
- [ ] 1.20 — Write unit tests for createRule factory (merge, emptyToUndefined, customFn, reserved namespaces) in `tests/core/`
- [ ] 1.21 — Update `src/index.ts` to re-export foundation modules

### Phase 1 — Verification
- [ ] `setup({ rules: { Email: { blockDisposable: true } } })` stores config
- [ ] `getConfig().rules.Email.blockDisposable` returns `true`
- [ ] Three-tier merge works: defaults → globals → per-call
- [ ] `undefined` in per-call intentionally removes a global default
- [ ] `z.config({ customError })` registered, maps `too_small` → `base.required`
- [ ] `getParams()` extracts code, namespace, label from Zod issues
- [ ] `validate()` returns correct `ValidationResult` shape
- [ ] `createRule()` produces a working rule function
- [ ] Reserved namespace rejection works
- [ ] `customFn` runs after all other validations
- [ ] `emptyToUndefined` converts `""` → `undefined`
- [ ] All foundation tests pass
- [ ] `pnpm lint` — zero errors, zero warnings
- [ ] `pnpm typecheck` — zero errors
- [ ] No `any` in any file
- [ ] JSDoc present on all exported functions, interfaces, and types in `src/`
- [ ] All Zod imports from `zod` or `zod/v4` only (never `zod/v4/core` or `zod/mini`)

**Gate: Phase 1 → Phase 2 requires: all tests pass, `pnpm lint` zero errors/warnings, `pnpm typecheck` zero errors, no `any`, no unapproved ESLint config changes.**

---

## Phase 2: Checks

- [ ] 2.1 — Create `src/checks/composition.ts` with `hasUppercase`, `hasLowercase`, `hasDigits`, `hasSpecial` (min/max params, unicode-aware) (with JSDoc, explicit return types)
- [ ] 2.2 — Create `src/checks/detection.ts` with `containsEmail`, `containsUrl`, `containsHtml`, `containsPhoneNumber` (libphonenumber-js) (with JSDoc, explicit return types)
- [ ] 2.3 — Create `src/checks/restriction.ts` with `onlyAlpha`, `onlyNumeric`, `onlyAlphanumeric`, `onlyAlphanumericSpaceHyphen`, `onlyAlphaSpaceHyphen` (with JSDoc, explicit return types)
- [ ] 2.4 — Create `src/checks/limits.ts` with `maxWords`, `maxConsecutive`, `noSpaces` (with JSDoc, explicit return types)
- [ ] 2.5 — Create `src/checks/transforms.ts` with `emptyToUndefined`, `toTitleCase`, `toSlug`, `stripHtml`, `collapseWhitespace` (with JSDoc, explicit return types)
- [ ] 2.6 — Create `src/checks/index.ts` — re-exports all checks
- [ ] 2.7 — Create `src/utilities/sameAs.ts` — Zod refinement for cross-field equality (with JSDoc)
- [ ] 2.8 — Create `src/utilities/requiredWhen.ts` — Zod refinement for conditional required (with JSDoc)
- [ ] 2.9 — Create `src/utilities/index.ts` — re-exports
- [ ] 2.10 — Write unit tests for composition checks (unicode: Vietnamese, German, etc.)
- [ ] 2.11 — Write unit tests for detection checks (containsEmail, containsUrl, containsHtml, containsPhoneNumber with real-world strings)
- [ ] 2.12 — Write unit tests for restriction checks
- [ ] 2.13 — Write unit tests for limits checks (`maxConsecutive('aaab', 3)` → true, `maxConsecutive('aaaab', 3)` → false)
- [ ] 2.14 — Write unit tests for transform functions (toTitleCase with hyphens, apostrophes, unicode)
- [ ] 2.15 — Write unit tests for `sameAs` and `requiredWhen` utilities

### Phase 2 — Verification
- [ ] All 23 checks pass unit tests with real-world data
- [ ] `hasUppercase('HeLLo', 2)` → `true`
- [ ] `hasUppercase('NGUYỄN', 1)` → `true`
- [ ] `containsPhoneNumber('call +34 612 345 678 now')` → `true`
- [ ] `maxConsecutive('aaab', 3)` → `true`, `maxConsecutive('aaaab', 3)` → `false`
- [ ] `toTitleCase('jean-paul o\'brien')` → `"Jean-Paul O'Brien"`
- [ ] `emptyToUndefined('')` → `undefined`
- [ ] `sameAs` and `requiredWhen` produce working Zod refinements
- [ ] Zero Zod dependency in check files (except detection.ts for libphonenumber and utilities/)
- [ ] All check functions have explicit TypeScript return types
- [ ] No `any` in any check file
- [ ] `pnpm lint` — zero errors, zero warnings
- [ ] `pnpm typecheck` — zero errors
- [ ] JSDoc present on all exported functions

**Gate: Phase 2 → Phase 3 requires: all tests pass, `pnpm lint` zero errors/warnings, `pnpm typecheck` zero errors, no `any`, no unapproved ESLint config changes.**

---

## Phase 3: Data Files

- [ ] 3.1 — Create `src/data/commonPasswords.ts` with tiered exports: tier1 (100), tier2 (1k), tier3 (10k), using async loader pattern (lazy load + cache) (with JSDoc)
- [ ] 3.2 — Create `src/data/reservedUsernames.ts` with 200+ reserved words, async loader pattern (with JSDoc)
- [ ] 3.3 — Create `src/data/countryCodes.ts` with ISO 3166-1 alpha-2 + alpha-3, 249 entries, `loadCountryCodes()`/`getCountryCodes()` pattern (with JSDoc)
- [ ] 3.4 — Create `src/data/currencyCodes.ts` with ISO 4217 codes as `Set<string>`, async loader pattern (with JSDoc)
- [ ] 3.5 — Create `src/data/ibanPatterns.ts` with country → `{ length, regex }` mapping (~80 countries), async loader pattern (with JSDoc)
- [ ] 3.6 — Create `src/data/vatPatterns.ts` with country → `RegExp` mapping, async loader pattern (with JSDoc)
- [ ] 3.7 — Create `src/data/creditCardPrefixes.ts` with issuer prefix + length data (Visa, Mastercard, Amex, Discover, Diners, JCB, UnionPay), async loader pattern (with JSDoc)
- [ ] 3.8 — Write unit tests verifying data counts (249 countries, 100/1k/10k passwords, etc.)
- [ ] 3.9 — Write unit tests verifying async loader pattern (load, cache, throw-if-not-loaded)
- [ ] 3.10 — Write unit tests verifying tier cumulativity (tier2 includes tier1)

### Phase 3 — Verification
- [ ] All data files export correct types (no `any`)
- [ ] `countryCodes` contains 249 entries
- [ ] `commonPasswords` tier1=100, tier2=1000, tier3=10000+
- [ ] Tiers are cumulative
- [ ] `reservedUsernames` contains admin, root, system, support, etc.
- [ ] `ibanPatterns` covers ~80 countries with correct lengths
- [ ] `creditCardPrefixes` identifies all 7 major issuers
- [ ] All data files use async loader pattern
- [ ] `getCountryCodes()` throws if called before `loadCountryCodes()`
- [ ] Second call to `loadCountryCodes()` returns cached data
- [ ] `pnpm lint` — zero errors, zero warnings
- [ ] `pnpm typecheck` — zero errors

**Gate: Phase 3 → Phase 4 requires: all tests pass, `pnpm lint` zero errors/warnings, `pnpm typecheck` zero errors, no `any`, no unapproved ESLint config changes.**

---

## Phase 4: Rules

### Tier 1 — Thin Wrappers
- [ ] 4.1 — Create `src/rules/uuid.ts` — UUID rule using `z.uuid()` + optional version filter. Zod Classic, `error` not `message` (with JSDoc)
- [ ] 4.2 — Create `src/rules/macAddress.ts` — MacAddress rule using `z.mac()` + delimiter normalization. Zod Classic (with JSDoc)
- [ ] 4.3 — Create `src/rules/color.ts` — Color rule with regex per format (hex, rgb, hsl, any), alpha channel (with JSDoc)
- [ ] 4.4 — Create `src/rules/slug.ts` — Slug rule with regex + `extraChars` (with JSDoc)
- [ ] 4.5 — Create `src/rules/country.ts` — Country rule with lookup against `countryCodes`, allow/block filtering (with JSDoc)
- [ ] 4.6 — Create `src/rules/currency.ts` — Currency rule with lookup against `currencyCodes`, allow/block filtering (with JSDoc)
- [ ] 4.7 — Write unit tests for Tier 1 rules (10+ valid, 10+ invalid each, security vectors)

### Tier 2 — Business Logic
- [ ] 4.8 — Create `src/rules/personName.ts` — charset + boundary + consecutive + words checks (with JSDoc)
- [ ] 4.9 — Create `src/rules/businessName.ts` — charset + boundary + consecutive checks (with JSDoc)
- [ ] 4.10 — Create `src/rules/password.ts` — composition checks + consecutive (sync part; blockCommon wired in Tier 5) (with JSDoc)
- [ ] 4.11 — Create `src/rules/passwordConfirmation.ts` — `sameAs` utility wrapper (with JSDoc)
- [ ] 4.12 — Create `src/rules/username.ts` — pattern + boundary + consecutive (sync part; blockReserved wired in Tier 5) (with JSDoc)
- [ ] 4.13 — Create `src/rules/licenseKey.ts` — segment pattern generation from segments x segmentLength + separator + charset (with JSDoc)
- [ ] 4.14 — Create `src/rules/dateTime.ts` — Zod iso validators (`z.iso.datetime()`, `z.iso.date()`, `z.iso.time()`) + business constraints (min/max/allowFuture/allowPast/precision) (with JSDoc)
- [ ] 4.15 — Create `src/rules/token.ts` — Zod native per type (`z.nanoid()`, `z.hex()`, etc.) + length defaults (with JSDoc)
- [ ] 4.16 — Create `src/rules/ipAddress.ts` — `z.ipv4()`/`z.ipv6()` + CIDR + private range detection (with JSDoc)
- [ ] 4.17 — Create `src/rules/website.ts` — `z.url()` + protocol + domain + normalize + path/query control (with JSDoc)
- [ ] 4.18 — Create `src/rules/url.ts` — `z.url()` + protocol + domain + auth control (with JSDoc)
- [ ] 4.19 — Write unit tests for Tier 2 rules (10+ valid, 10+ invalid each, security vectors, unicode)

### Tier 3 — Bundled Data Rules
- [ ] 4.20 — Create `src/rules/creditCard.ts` — Luhn algorithm + prefix matching + allowIssuers/blockIssuers (with JSDoc)
- [ ] 4.21 — Create `src/rules/iban.ts` — country lookup + length + regex + mod-97 checksum (with JSDoc)
- [ ] 4.22 — Create `src/rules/vatNumber.ts` — country auto-detect + pattern lookup + requirePrefix (with JSDoc)
- [ ] 4.23 — Create `src/rules/jwt.ts` — 3-part split + base64 decode + claim/algorithm checks (with JSDoc)
- [ ] 4.24 — Write unit tests for Tier 3 rules (10+ valid, 10+ invalid each, security vectors)

### Tier 4 — External Dependency Rules
- [ ] 4.25 — Create `src/rules/postalCode.ts` — dynamic import `postal-codes-js`, validate per country (with JSDoc)
- [ ] 4.26 — Create `src/rules/phone.ts` — dynamic import `libphonenumber-js/core`, parsePhoneNumber, format, country filtering (with JSDoc)
- [ ] 4.27 — Create `src/rules/email.ts` — `z.email()` + blockPlusAlias + allowSubdomains + blockDomains + dynamic import `disposable-email-domains` (with JSDoc)
- [ ] 4.28 — Create `src/rules/text.ts` — chain detection checks (noEmails, noUrls, noPhoneNumbers, noHtml) + maxWords + maxConsecutive (with JSDoc)
- [ ] 4.29 — Write unit tests for Tier 4 rules (10+ valid, 10+ invalid each, security vectors, international data)

### Tier 5 — Async Data Wiring
- [ ] 4.30 — Wire `blockCommon` in Password rule — dynamic import `commonPasswords.ts`, tier selection, cache
- [ ] 4.31 — Wire `blockReserved` in Username rule — dynamic import `reservedUsernames.ts`, cache
- [ ] 4.32 — Write async-specific tests: `parseAsync()` loads + validates, sync `.parse()` throws if not loaded, `preloadData()` enables sync

### Rules barrel + test harness
- [ ] 4.33 — Create `src/rules/index.ts` — re-exports all 25 rules
- [ ] 4.34 — Create `tests/helpers/testRule.ts` — shared test harness enforcing universal contract
- [ ] 4.35 — Create `tests/helpers/generateTestData.ts` — Faker-based bulk generators (10+ locales)
- [ ] 4.36 — Run shared test harness (`testRuleContract`) against all 25 rules
- [ ] 4.37 — Create test fixtures: `personNames.valid.json`, `personNames.invalid.json`, `emails.valid.json`, `emails.invalid.json`, `phones.valid.json`, `phones.invalid.json`, `postalCodes.valid.json`, `businessNames.valid.json`, `usernames.reserved.json`, `passwords.weak.json`, `security.xss.json`, `security.injection.json`
- [ ] 4.38 — Write property-based tests (fast-check) in `tests/properties/` for Email, PersonName, Password, Phone, Website, Username, Slug, UUID, CreditCard, IBAN (invariants from BUILD.md Testing Strategy Layer 3)

### Phase 4 — Verification
- [ ] All 25 rules pass unit tests
- [ ] All error codes match OPTIONS.md registry exactly
- [ ] Async rules throw on sync `.parse()` when data needed and not loaded
- [ ] `preloadData()` enables sync `.parse()` for all async rules
- [ ] All 25 rules use `createRule` (dogfooding verified)
- [ ] Three-tier merge verified end-to-end
- [ ] `regex` override works on all FormatRuleOptions rules
- [ ] `customFn` works on all 25 rules (sync and async)
- [ ] All data lazily loaded via dynamic import
- [ ] Minimum 10 valid + 10 invalid test cases per rule
- [ ] Security test vectors pass for all rules
- [ ] No `any` in any rule file
- [ ] All rule option interfaces exported and fully typed
- [ ] `pnpm lint` — zero errors, zero warnings
- [ ] `pnpm typecheck` — zero errors
- [ ] JSDoc present on all exported functions, interfaces, and types
- [ ] All Zod imports from `zod` or `zod/v4` only

**Gate: Phase 4 → Phase 5 requires: all tests pass, `pnpm lint` zero errors/warnings, `pnpm typecheck` zero errors, no `any`, no unapproved ESLint config changes.**

---

## Phase 5: Adapters

- [ ] 5.1 — Verify `src/core/validate.ts` matches SPEC.md §11.1-11.2 exactly
- [ ] 5.2 — Create `src/adapters/nuxt/module.ts` — `defineNuxtModule`: reads `validex` config key, calls `setup()`, registers auto-imports, detects `@nuxtjs/i18n` (with JSDoc)
- [ ] 5.3 — Create `src/adapters/nuxt/composables.ts` — `useValidation` composable: accepts Zod schema, returns reactive `{ errors, firstErrors, validate, isValid }`, always uses `safeParseAsync` (with JSDoc)
- [ ] 5.4 — Create `src/adapters/nuxt/index.ts` — re-exports module and composables
- [ ] 5.5 — Create `src/adapters/fastify/plugin.ts` — `fastifyPlugin`: calls `setup()`, `preloadData()`, registers decorators (with JSDoc)
- [ ] 5.6 — Create `src/adapters/fastify/decorators.ts` — `app.validate(schema, data)`, `request.validate(schema)`, route-level `preValidation` hook (with JSDoc)
- [ ] 5.7 — Create `src/adapters/fastify/index.ts` — re-exports
- [ ] 5.8 — Write Nuxt adapter tests (module registration, auto-imports, useValidation reactivity, config, i18n detection, SSR preload)
- [ ] 5.9 — Write Fastify adapter tests (plugin registration, preloadData, app.validate, request.validate, route-level schema, error response format, multi-route)

### Phase 5 — Verification
- [ ] Nuxt module registers and auto-imports rules
- [ ] `useValidation` returns reactive errors
- [ ] Nuxt i18n auto-detection works
- [ ] Fastify plugin registers and preloads data
- [ ] `app.validate()` and `request.validate()` work
- [ ] Route-level schema validation works
- [ ] Error response format matches §14.5
- [ ] All adapter tests pass with real framework instances (not mocks)
- [ ] No `any` in adapter code
- [ ] `pnpm lint` — zero errors, zero warnings
- [ ] `pnpm typecheck` — zero errors
- [ ] JSDoc present on all exported functions

**Gate: Phase 5 → Phase 6 requires: all tests pass, `pnpm lint` zero errors/warnings, `pnpm typecheck` zero errors, no `any`, no unapproved ESLint config changes.**

---

## Phase 6: Integration Tests

- [ ] 6.1 — Register form scenario: Email + Password + PasswordConfirmation + Username in `z.object()`
- [ ] 6.2 — Login form scenario: Email + Password composed
- [ ] 6.3 — Profile form scenario: PersonName + Phone + Website + Text(bio) composed
- [ ] 6.4 — Payment form scenario: CreditCard + PostalCode + Country + IBAN composed
- [ ] 6.5 — Auth token scenario: JWT with checkExpiry + requireClaims + allowAlgorithms + customFn
- [ ] 6.6 — i18n mode (keys): all error codes produce correct i18n keys when `i18n.enabled: true`
- [ ] 6.7 — i18n mode (t function): `t()` called with correct key + params
- [ ] 6.8 — Global config scenario: `setup()` affects all subsequent rule uses across multiple schemas
- [ ] 6.9 — Per-call override scenario: per-call options override globals, globals override defaults
- [ ] 6.10 — Override removal scenario: `undefined` in per-call removes a global setting
- [ ] 6.11 — Async flow scenario: blockDisposable + blockCommon + blockReserved all work with `parseAsync`
- [ ] 6.12 — `preloadData` scenario: after preload, sync `.parse()` works for all async rules
- [ ] 6.13 — Error surface scenario: all errors go through validex surface, none leak raw Zod codes
- [ ] 6.14 — `customFn` in schema scenario: customFn on multiple rules in same schema
- [ ] 6.15 — `regex` in schema scenario: regex override on one rule doesn't affect others
- [ ] 6.16 — `ValidationResult` shape scenario: errors, firstErrors, nestedErrors, issues all correct
- [ ] 6.17 — `validate()` utility scenario: `validate(schema, data)` returns correct result
- [ ] 6.18 — Cross-field scenario: `sameAs` and `requiredWhen` work within composed schemas
- [ ] 6.19 — Nuxt end-to-end scenario: full form validation flow in Nuxt component
- [ ] 6.20 — Fastify end-to-end scenario: full request validation flow with route-level schema
- [ ] 6.21 — Tree-shaking verification: import Email only → bundle excludes Phone, PostalCode, libphonenumber-js
- [ ] 6.22 — Bundle size verification via `pnpm size`: Core (Email + Password) < 10kB, Full < 25kB
- [ ] 6.23 — No circular dependencies (verified by tooling)
- [ ] 6.24 — Run `pnpm knip` — no unused exports, files, or dependencies

### Phase 6 — Verification
- [ ] All integration scenarios pass
- [ ] No circular dependencies
- [ ] Tree-shaking verified for 3+ scenarios
- [ ] Bundle size within limits (`pnpm size` passes)
- [ ] All errors use validex error surface
- [ ] No `any` in test files
- [ ] `pnpm lint` — zero errors, zero warnings
- [ ] `pnpm typecheck` — zero errors

**Gate: Phase 6 → Phase 7 requires: all tests pass, `pnpm lint` zero errors/warnings, `pnpm typecheck` zero errors, no `any`, no unapproved ESLint config changes.**

---

## Phase 7: Polish

- [ ] 7.1 — Write full README.md (badges, install, quick start, rule list table, config, i18n, adapters, custom rules, API reference link, license)
- [ ] 7.2 — Write CONTRIBUTING.md (dev setup, project structure, branching, commit convention, adding rules, running tests, code style)
- [ ] 7.3 — Write CHANGELOG.md (initial release entry)
- [ ] 7.4 — Verify `.github/workflows/ci.yml` matches the full spec from BUILD.md §7.4 (Node 18/20/22 matrix, quality gates, bundle size check, auto-publish job)
- [ ] 7.5 — Add `files` field to package.json: `["dist", "README.md", "LICENSE", "CHANGELOG.md"]`
- [ ] 7.6 — Add `keywords`, `repository`, `bugs`, `homepage` fields to package.json
- [ ] 7.7 — Run `npm pack` and verify tarball contents (no test files, no source maps, no dev configs)
- [ ] 7.8 — Verify README renders correctly
- [ ] 7.9 — Verify package installs cleanly in fresh project
- [ ] 7.10 — Verify subpath imports work: `import { Email } from 'validex'`, `import { useValidation } from 'validex/nuxt'`
- [ ] 7.11 — Verify TypeScript types resolve correctly for consumers (run `attw --pack`)
- [ ] 7.12 — Verify tree-shaking works in consumer's bundler
- [ ] 7.13 — Run `pnpm check:full` — final pre-publish gate (lint + typecheck + test + coverage + build + publint + attw + knip + size)

### Phase 7 — Verification
- [ ] `npm pack` produces clean tarball
- [ ] No test files, source maps, or dev configs in published package
- [ ] License file present (MIT)
- [ ] `pnpm check:full` passes (all quality gates including `pnpm size`)
- [ ] Package installs cleanly in a fresh project
- [ ] Subpath imports work
- [ ] TypeScript types resolve correctly for consumers (`attw --pack` passes)
- [ ] `publint` passes
- [ ] Tree-shaking works in consumer's bundler
- [ ] `pnpm knip` — zero unused exports/files/dependencies
- [ ] `pnpm size` — bundle within thresholds
