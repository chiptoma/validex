# BUILD.md — validex Implementation Playbook

> **Purpose:** Sequenced build plan. What to build, in what order, and how to verify each step.
> **How to use with Claude Code:** Read this document first. For each phase/step, reference the cited SPEC.md section for detailed requirements. Don't load the entire SPEC.md at once — load sections as needed.
> **Companion docs:** SPEC.md (full spec, ~2,800 lines), DEFAULTS.md (all rule defaults), OPTIONS.md (all rule options/error codes)

---

## Phase 0: Project Scaffold

**Goal:** Empty project that builds, lints, and runs an empty test suite.

### 0.1 Directory Structure

```
validex/
├── src/
│   ├── index.ts                    # Main entry — re-exports everything
│   ├── types.ts                    # Range, Boundary, shared types
│   ├── config/
│   │   ├── index.ts                # setup(), getConfig()
│   │   ├── store.ts                # Config store (module-level singleton)
│   │   ├── merge.ts                # Three-tier merge logic
│   │   └── defaults.ts             # Built-in rule defaults
│   ├── core/
│   │   ├── validate.ts             # validate() utility → ValidationResult
│   │   ├── getParams.ts            # getParams() — extract validex params from Zod issues
│   │   ├── createRule.ts           # createRule() factory
│   │   ├── customError.ts          # Zod customError handler registration
│   │   └── errorMap.ts             # Error code → English message mapping
│   ├── checks/
│   │   ├── index.ts                # Re-exports all checks
│   │   ├── composition.ts          # hasUppercase, hasLowercase, hasDigits, hasSpecial
│   │   ├── detection.ts            # containsEmail, containsUrl, containsHtml, containsPhoneNumber
│   │   ├── restriction.ts          # onlyAlpha, onlyNumeric, onlyAlphanumeric, etc.
│   │   ├── limits.ts               # maxWords, maxConsecutive, noSpaces
│   │   └── transforms.ts           # emptyToUndefined, toTitleCase, toSlug, stripHtml, collapseWhitespace
│   ├── rules/
│   │   ├── index.ts                # Re-exports all rules
│   │   ├── email.ts
│   │   ├── personName.ts
│   │   ├── businessName.ts
│   │   ├── password.ts
│   │   ├── passwordConfirmation.ts
│   │   ├── phone.ts
│   │   ├── website.ts
│   │   ├── url.ts
│   │   ├── username.ts
│   │   ├── slug.ts
│   │   ├── postalCode.ts
│   │   ├── licenseKey.ts
│   │   ├── uuid.ts
│   │   ├── jwt.ts
│   │   ├── dateTime.ts
│   │   ├── token.ts
│   │   ├── text.ts
│   │   ├── country.ts
│   │   ├── currency.ts
│   │   ├── color.ts
│   │   ├── creditCard.ts
│   │   ├── iban.ts
│   │   ├── vatNumber.ts
│   │   ├── macAddress.ts
│   │   └── ipAddress.ts
│   ├── utilities/
│   │   ├── index.ts                # Re-exports
│   │   ├── sameAs.ts
│   │   └── requiredWhen.ts
│   ├── data/
│   │   ├── commonPasswords.ts      # Tiered: tier1 (100), tier2 (1k), tier3 (10k)
│   │   ├── reservedUsernames.ts    # 200+ reserved words
│   │   ├── countryCodes.ts         # ISO 3166-1 alpha-2 + alpha-3
│   │   ├── currencyCodes.ts        # ISO 4217
│   │   ├── ibanPatterns.ts         # Country → { length, regex } mapping
│   │   ├── vatPatterns.ts          # Country → regex mapping
│   │   └── creditCardPrefixes.ts   # Issuer → prefix + length mapping
│   ├── adapters/
│   │   ├── nuxt/
│   │   │   ├── index.ts            # Module entry
│   │   │   ├── module.ts           # defineNuxtModule
│   │   │   └── composables.ts      # useValidation
│   │   └── fastify/
│   │       ├── index.ts            # Plugin entry
│   │       ├── plugin.ts           # fastifyPlugin
│   │       └── decorators.ts       # app.validate, request.validate
│   └── internal/
│       ├── resolveRange.ts         # Range → { min?, max? } normalizer
│       ├── resolveBoundary.ts      # Boundary → { start, end } normalizer
│       └── normalizers.ts          # Per-rule normalize functions
├── tests/
│   ├── fixtures/
│   │   ├── personNames.valid.json      # ~100 tricky valid names (unicode, CJK, Arabic, accents)
│   │   ├── personNames.invalid.json    # ~50 known-bad inputs
│   │   ├── emails.valid.json           # ~100 RFC 5321/5322 edge cases
│   │   ├── emails.invalid.json         # ~100 invalid + attack vectors
│   │   ├── phones.valid.json           # ~100 real numbers from 20+ countries
│   │   ├── phones.invalid.json         # ~50 invalid formats
│   │   ├── postalCodes.valid.json      # ~100 real codes from 30+ countries
│   │   ├── businessNames.valid.json    # ~50 real company names (AT&T, H&M, 3M, etc.)
│   │   ├── usernames.reserved.json     # admin, root, system, api, www, etc.
│   │   ├── passwords.weak.json         # Top 100 common passwords
│   │   ├── security.xss.json           # ~200 XSS payloads (from SecLists)
│   │   └── security.injection.json     # ~100 SQL injection strings
│   ├── helpers/
│   │   ├── generateTestData.ts         # Faker-based bulk generators (10+ locales)
│   │   └── testRule.ts                 # Shared test harness for all rules
│   ├── checks/                         # Unit tests per check function
│   ├── rules/                          # Unit tests per rule (one file per rule)
│   ├── config/                         # Config system tests
│   ├── core/                           # Foundation tests (createRule, validate, getParams, errorMap)
│   ├── adapters/                       # Adapter integration tests (real Fastify/Nuxt instances)
│   ├── integration/                    # Full-system scenarios (composed schemas, i18n, async)
│   └── properties/                     # Property-based tests (fast-check invariants)
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── tsup.config.ts                  # Build config (ESM + CJS)
├── eslint.config.ts                # Flat config (antfu)
└── README.md
```

### 0.2 package.json Key Fields

```json
{
  "name": "validex",
  "version": "1.0.0-alpha.0",
  "type": "module",
  "packageManager": "pnpm@9.15.0",
  "sideEffects": false,
  "exports": {
    ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" },
    "./checks": { "import": "./dist/checks/index.js", "types": "./dist/checks/index.d.ts" },
    "./utilities": { "import": "./dist/utilities/index.js", "types": "./dist/utilities/index.d.ts" },
    "./nuxt": { "import": "./dist/adapters/nuxt/index.js", "types": "./dist/adapters/nuxt/index.d.ts" },
    "./fastify": { "import": "./dist/adapters/fastify/index.js", "types": "./dist/adapters/fastify/index.d.ts" }
  },
  "scripts": {
    "dev": "tsup --watch & vitest",
    "build": "tsup",
    "lint": "eslint .",
    "lint:fix": "eslint . --fix",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:checks": "vitest run tests/checks",
    "test:rules": "vitest run tests/rules",
    "test:integration": "vitest run tests/integration",
    "test:properties": "vitest run tests/properties",
    "test:adapters": "vitest run tests/adapters",
    "check": "pnpm lint && pnpm typecheck && pnpm test",
    "check:full": "pnpm check && pnpm test:coverage && pnpm build && publint && attw --pack && pnpm knip && pnpm size",
    "knip": "knip",
    "size": "size-limit",
    "changelog": "conventional-changelog -p conventionalcommits -i CHANGELOG.md -s",
    "release": "bumpp && pnpm changelog && git add CHANGELOG.md && git commit -m 'chore: changelog' && git push --follow-tags && pnpm publish",
    "prepublishOnly": "pnpm check:full",
    "prepare": "simple-git-hooks"
  },
  "simple-git-hooks": {
    "pre-commit": "pnpm lint-staged",
    "commit-msg": "node --input-type=module -e \"import {readFileSync} from 'fs'; const msg = readFileSync(process.argv[1], 'utf8').trim(); if (!/^(feat|fix|docs|refactor|test|chore|perf|ci|build|style|revert)(\\(.+\\))?!?:.+/.test(msg)) { console.error('Invalid commit message. Use conventional commits: feat|fix|docs|refactor|test|chore: message'); process.exit(1); }\" \"$1\""
  },
  "lint-staged": {
    "*.ts": [
      "eslint --fix"
    ]
  },
  "peerDependencies": { "zod": "^3.25.0 || ^4.0.0" },
  "dependencies": {
    "libphonenumber-js": "^1.11.0",
    "postal-codes-js": "^2.5.0",
    "disposable-email-domains": "^1.0.0"
  },
  "devDependencies": {
    "vitest": "^3.0.0",
    "@vitest/coverage-v8": "^3.0.0",
    "@faker-js/faker": "^9.0.0",
    "fast-check": "^4.0.0",
    "@nuxt/test-utils": "^3.0.0",
    "fastify": "^5.0.0",
    "typescript": "^5.0.0",
    "tsup": "^8.0.0",
    "@antfu/eslint-config": "^4.0.0",
    "eslint": "^9.0.0",
    "eslint-plugin-regexp": "^2.0.0",
    "eslint-plugin-sonarjs": "^4.0.0",
    "eslint-plugin-vitest": "^0.5.0",
    "simple-git-hooks": "^2.0.0",
    "lint-staged": "^15.0.0",
    "knip": "^5.0.0",
    "publint": "^0.2.0",
    "@arethetypeswrong/cli": "^0.17.0",
    "bumpp": "^9.0.0",
    "conventional-changelog-cli": "^5.0.0",
    "conventional-changelog-conventionalcommits": "^8.0.0",
    "size-limit": "^11.0.0",
    "@size-limit/preset-small-lib": "^11.0.0"
  },
  "peerDependenciesMeta": {
    "nuxt": { "optional": true },
    "fastify": { "optional": true }
  }
}
```

**Script explanations:**

| Script | Purpose |
|---|---|
| `pnpm dev` | Watch mode — rebuilds on change + runs tests in watch |
| `pnpm build` | Production build (ESM + CJS + declarations) |
| `pnpm lint` | ESLint check (zero errors, zero warnings required) |
| `pnpm lint:fix` | ESLint check + auto-fix |
| `pnpm typecheck` | TypeScript type checking (no emit) |
| `pnpm test` | Run all tests |
| `pnpm test:coverage` | Run tests + enforce 95% coverage thresholds |
| `pnpm test:watch` | Run tests in watch mode |
| `pnpm check` | Full quality gate: lint + typecheck + test |
| `pnpm check:full` | Pre-publish gate: check + coverage + build + publint + attw + knip + size |
| `pnpm knip` | Detect unused exports, files, dependencies |
| `pnpm size` | Check bundle size against thresholds (size-limit) |
| `pnpm changelog` | Generate CHANGELOG.md from conventional commits |
| `pnpm release` | Full release: version bump → changelog → tag → push → publish |
| `pnpm prepare` | Install git hooks (runs automatically on `pnpm install`) |

**Git hooks (automatic):**

| Hook | Action |
|---|---|
| `pre-commit` | `lint-staged` — runs `eslint --fix` on staged `.ts` files |
| `commit-msg` | Validates conventional commit format (`feat:`, `fix:`, `docs:`, etc.) |

**Release workflow:**

```bash
# 1. Ensure everything passes
pnpm check:full

# 2. Release (interactive version bump prompt)
pnpm release
# bumpp prompts: patch / minor / major / prepatch / etc.
# → updates package.json version
# → creates git tag (v1.0.0)
# → generates changelog
# → pushes tag
# → publishes to npm
```

**Dev tools explained:**

| Tool | Purpose |
|---|---|
| `simple-git-hooks` | Runs `lint-staged` on pre-commit + validates conventional commit format on commit-msg |
| `lint-staged` | Only lints staged files (fast) — auto-fixes on commit |
| `knip` | Finds unused exports, unused files, unused dependencies. Run periodically to keep the codebase clean. |
| `publint` | Verifies package.json `exports`, `types`, `main` are correctly configured for consumers |
| `@arethetypeswrong/cli` (`attw`) | Verifies published `.d.ts` types resolve correctly in consumer projects (ESM and CJS) |
| `@vitest/coverage-v8` | Code coverage via V8 native coverage — 95% threshold enforced |
| `bumpp` | Interactive version bump — prompts for patch/minor/major, updates package.json, creates git tag |
| `conventional-changelog-cli` | Generates CHANGELOG.md from conventional commit history |
| `size-limit` | Monitors bundle size per import — fails CI if thresholds exceeded |
```

### 0.3 Tooling

- **Build:** tsup (ESM + CJS dual output, declaration files)
- **Test:** vitest
- **Lint + Format:** `@antfu/eslint-config` (ESLint only — no Prettier)
- **TypeScript:** strict mode (see tsconfig below)
- **Package manager:** pnpm
- **Git:** `main` (releases only, via PR) + `dev` (development). Never edit `main` directly.
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`, `test:`)
- **Versioning:** Semantic Versioning 2.0.0 (see SPEC.md §3.4)

### 0.3.1 TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "module": "ESNext",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist"
  }
}
```

**Hard rule: No `any` anywhere.** Not in implementation, not in tests, not in internal helpers. If a type assertion (`as`) is genuinely needed, it must have a `// SAFETY:` comment explaining why. Enforced by `ts/no-explicit-any: 'error'` in ESLint.

### 0.3.2 ESLint Configuration

Uses `@antfu/eslint-config` — handles both linting AND formatting. No Prettier.

Additional plugins for maximum code quality:
- `eslint-plugin-regexp` — regex quality and ReDoS prevention (critical for a validation library)
- `eslint-plugin-sonarjs` — cognitive complexity, code smells, bug detection
- `eslint-plugin-vitest` — test quality enforcement

```typescript
// eslint.config.ts
import antfu from '@antfu/eslint-config'
import sonarjs from 'eslint-plugin-sonarjs'
import pluginRegexp from 'eslint-plugin-regexp'
import vitest from 'eslint-plugin-vitest'

export default antfu(
  {
    type: 'lib',
    typescript: {
      tsconfigPath: 'tsconfig.json',
    },
    stylistic: {
      indent: 2,
      quotes: 'single',
      semi: false,
    },
    jsonc: true,
    yaml: false,
    markdown: false,
    ignores: ['**/fixtures', '**/dist'],
  },

  // Strict TypeScript
  {
    rules: {
      'ts/consistent-type-definitions': ['error', 'interface'],
      'ts/explicit-function-return-type': 'error',
      'ts/no-explicit-any': 'error',
      'ts/strict-boolean-expressions': 'error',
      'ts/consistent-type-imports': ['error', { prefer: 'type-imports' }],
      'ts/no-non-null-assertion': 'error',
      'no-console': 'warn',
      'prefer-const': 'error',
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 50, skipBlankLines: true, skipComments: true }],
      'max-depth': ['error', 3],
      'unicorn/filename-case': ['error', {
        case: 'camelCase',
        ignore: [
          'README.md', 'CHANGELOG.md', 'BUILD.md', 'SPEC.md',
          'OPTIONS.md', 'DEFAULTS.md', 'CONTRIBUTING.md', 'LICENSE', 'CLAUDE.md',
          'vitest.config.ts', 'tsup.config.ts', 'eslint.config.ts',
        ],
      }],
    },
  },

  // JSDoc on public exports — only for src/ files
  {
    files: ['src/**/*.ts'],
    rules: {
      'jsdoc/require-jsdoc': ['error', {
        require: {
          FunctionDeclaration: true,
          MethodDefinition: true,
          ClassDeclaration: true,
        },
        contexts: [
          'ExportNamedDeclaration > FunctionDeclaration',
          'ExportNamedDeclaration > VariableDeclaration',
          'TSInterfaceDeclaration',
          'TSTypeAliasDeclaration',
        ],
      }],
      'jsdoc/require-description': 'error',
      'jsdoc/require-param': 'error',
      'jsdoc/require-returns': 'error',
    },
  },

  // Regex quality — critical for a validation library
  pluginRegexp.configs['flat/recommended'],
  {
    rules: {
      'regexp/no-super-linear-backtracking': 'error',
      'regexp/no-misleading-unicode-character': 'error',
      'regexp/strict': 'error',
    },
  },

  // Code quality and complexity
  {
    plugins: { sonarjs },
    rules: {
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-identical-expressions': 'error',
      'sonarjs/no-duplicate-string': ['error', { threshold: 3 }],
      'sonarjs/no-redundant-jump': 'error',
      'sonarjs/no-collapsible-if': 'error',
      'sonarjs/prefer-single-boolean-return': 'error',
    },
  },

  // Test quality — relaxed rules + vitest enforcement
  {
    files: ['tests/**/*.ts'],
    plugins: { vitest },
    rules: {
      ...vitest.configs.recommended.rules,
      'vitest/no-focused-tests': 'error',
      'vitest/no-disabled-tests': 'warn',
      'vitest/expect-expect': 'error',
      'vitest/no-identical-title': 'error',
      'ts/explicit-function-return-type': 'off',    // test helpers don't need return types
      'max-lines-per-function': 'off',              // test files can be long
      'max-lines': ['error', { max: 500, skipBlankLines: true, skipComments: true }],
      'jsdoc/require-jsdoc': 'off',                 // tests don't need jsdoc
      'sonarjs/no-duplicate-string': 'off',          // test assertions repeat strings
    },
  },
)
```

**Why these three plugins matter for validex:**

| Plugin | What it catches | Why it matters |
|---|---|---|
| `eslint-plugin-regexp` | ReDoS vulnerabilities, invalid regex, redundant patterns | Half the rules are built on regex. A bad regex = DoS vulnerability. |
| `eslint-plugin-sonarjs` | Excessive complexity, duplicate code, dead branches | Keeps rule implementations readable and maintainable. |
| `eslint-plugin-vitest` | Focused tests, missing assertions, duplicate test names | Tests are the safety net. Bad tests = false confidence. |

**VS Code settings** (`.vscode/settings.json`):

```json
{
  "prettier.enable": false,
  "editor.formatOnSave": false,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "never"
  },
  "eslint.validate": ["javascript", "typescript", "json", "jsonc"]
}
```

### 0.3.3 Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/index.ts', 'src/data/**'],
      thresholds: {
        lines: 95,
        functions: 95,
        branches: 90,
        statements: 95,
      },
    },
  },
})
```

**Coverage thresholds:** 95% lines/functions/statements, 90% branches. These are enforced — `pnpm test:coverage` fails if thresholds aren't met. Data files are excluded from coverage (static lists). For a validation library where bugs mean rejecting valid users or accepting invalid data, 95% is the minimum standard.

### 0.3.4 Project Files

```
validex/
├── .github/
│   └── workflows/
│       └── ci.yml                  # Build + test + lint on PR
├── .vscode/
│   └── settings.json               # ESLint as formatter, no Prettier
├── .node-version                   # Pin Node version (e.g., "22")
├── .npmrc                          # pnpm settings
├── .size-limit.json                # Bundle size thresholds
├── CHANGELOG.md
├── CLAUDE.md                       # Rules for Claude Code — read before any implementation
├── CONTRIBUTING.md
├── LICENSE                         # MIT
├── README.md
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.ts
└── eslint.config.ts                # Flat config (antfu + regexp + sonarjs + vitest)
```

### 0.3.5 Environment Pinning

```
# .node-version
22
```

```ini
# .npmrc
shamefully-hoist=false
strict-peer-dependencies=true
auto-install-peers=false
```

### 0.3.6 Bundle Size Monitoring (`size-limit`)

```json
// .size-limit.json
[
  {
    "name": "Core (Email + Password)",
    "path": "dist/index.js",
    "import": "{ Email, Password }",
    "limit": "10 kB"
  },
  {
    "name": "Full library (all rules)",
    "path": "dist/index.js",
    "import": "*",
    "limit": "25 kB"
  }
]
```

Runs as part of `pnpm check:full` and CI. Fails if any import exceeds its size limit. Tracked over time — every PR shows the delta.

### 0.4 Done When

- [ ] `pnpm build` produces `dist/` with no errors
- [ ] `pnpm test` runs and passes (empty suite)
- [ ] `pnpm lint` passes with **zero errors AND zero warnings**
- [ ] `pnpm typecheck` passes with zero errors
- [ ] TypeScript strict mode enabled with all flags from §0.3.1
- [ ] `sideEffects: false` in package.json
- [ ] Subpath exports resolve correctly
- [ ] Git hooks installed (`pnpm prepare`) — pre-commit runs lint-staged
- [ ] Git repo initialised with `main` + `dev` branches
- [ ] `.github/workflows/ci.yml` configured per §7.4
- [ ] `.node-version` set to `22`
- [ ] `.npmrc` configured with `strict-peer-dependencies=true`
- [ ] `.size-limit.json` configured with bundle thresholds
- [ ] CHANGELOG.md, CONTRIBUTING.md, CLAUDE.md, LICENSE exist

**Hard rules for ALL phases (non-negotiable):**

1. **Zero ESLint errors.** No exceptions.
2. **Zero ESLint warnings.** Warnings are errors that haven't been fixed yet.
3. **Zero TypeScript errors.** `pnpm typecheck` must pass.
4. **No ESLint config changes without approval.** If a rule causes friction, the code adapts to the rule — not the other way around. If a rule is genuinely wrong for this project, present the case and get approval before changing it.
5. **No `// eslint-disable` comments without a `// REASON:` comment** explaining why the disable is necessary.
6. **No `any` type.** `ts/no-explicit-any` is `error`. If truly unavoidable, use `unknown` with type narrowing.
7. **Coverage thresholds enforced.** `pnpm test:coverage` must pass thresholds.

---

## Phase 1: Foundation

**Goal:** Config system, core utilities, createRule factory. Everything rules depend on.
**Ref:** SPEC.md §3-5

### 1.1 Shared Types (`src/types.ts`)

```typescript
export type Range = number | { min?: number; max?: number };
export type Boundary = 'alpha' | 'alphanumeric' | 'any' | {
  start?: 'alpha' | 'alphanumeric' | 'any';
  end?: 'alpha' | 'alphanumeric' | 'any';
};
```

Internal helpers in `src/internal/`:

```typescript
// resolveRange.ts
export function resolveRange(value: Range | undefined): { min?: number; max?: number } | undefined;
// resolveRange(8) → { min: 8, max: 8 }  (exact)
// resolveRange({ min: 8, max: 128 }) → { min: 8, max: 128 }
// resolveRange(undefined) → undefined

// resolveBoundary.ts
export function resolveBoundary(value: Boundary | undefined): { start: string; end: string } | undefined;
// resolveBoundary('alpha') → { start: 'alpha', end: 'alpha' }
// resolveBoundary({ start: 'alpha', end: 'alphanumeric' }) → as-is
```

**Ref:** SPEC.md §7.1 (Range and Boundary type definitions in Standard option properties)

### 1.2 Config Store (`src/config/`)

Implement:
- `store.ts` — module-level config singleton (not a class, just a `let config: GlobalConfig`)
- `defaults.ts` — built-in defaults for all 25 rules (import from DEFAULTS.md)
- `merge.ts` — three-tier merge: defaults → globals → per-call. Deep merge per key. `undefined` = intentional removal, absent key = inherit.
- `index.ts` — exports `setup()`, `getConfig()`, `preloadData()`

**Key behavior:** `setup()` stores config. Rules read config at parse-time (lazy), not at import-time. This means import order doesn't matter.

**Ref:** SPEC.md §4.1-4.5

### 1.3 Custom Error Handler (`src/core/customError.ts`)

Register via `z.config({ customError })`. Intercepts Zod issues, maps them to validex codes.

**Mapping table:** (SPEC.md §5.1)
- `too_small` + minimum=1 → `base.required`
- `too_small` + minimum>1 → `base.min`
- `too_big` → `base.max`
- `invalid_type` + undefined → `base.required`
- `invalid_type` + other → `base.type`
- `invalid_format` → `base.format`
- `invalid_string` → `base.format`

For validex custom codes (from `.refine()` params), pass through to the message system.

**Ref:** SPEC.md §4.6, §5.1

### 1.4 Error Message System (`src/core/errorMap.ts`)

English default messages for all ~82 error codes. Maps `{namespace}.{code}` → English string with `{{param}}` interpolation.

When i18n is enabled, returns the key instead of the interpolated message (or calls `t()` if configured).

**Ref:** SPEC.md §5.1 (full table), §5.2 (params), §5.3 (behavior matrix)

### 1.5 getParams (`src/core/getParams.ts`)

Extracts validex metadata from a Zod issue's `params` property. Returns:

```typescript
{ code, namespace, label, labelKey?, path, key, ...ruleParams }
```

**Ref:** SPEC.md §5.2

### 1.6 validate (`src/core/validate.ts`)

Wraps `safeParse` / `safeParseAsync` into `ValidationResult`:

```typescript
interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors: Record<string, string[]>;       // flat dot-path → messages
  firstErrors: Record<string, string>;     // flat dot-path → first message
  nestedErrors: NestedErrors;              // nested object matching schema shape
  issues: ZodIssue[];                      // raw escape hatch
}
```

**Ref:** SPEC.md §11.1

### 1.7 createRule (`src/core/createRule.ts`)

The rule factory. Every built-in rule uses this internally.

```typescript
function createRule<T extends BaseRuleOptions>(config: {
  name: string;                    // namespace
  defaults: Partial<T>;            // tier 1 defaults
  build: (opts: T, z: typeof zod) => ZodSchema;
  messages: Record<string, string>;
}): (options?: Partial<T>) => ZodSchema;
```

Responsibilities:
1. Three-tier merge: `config.defaults` → `getConfig().rules[name]` → per-call options
2. Apply `emptyToUndefined` transform
3. Apply `normalize` transform
4. Apply `regex` override (if FormatRuleOptions)
5. Apply `customFn` (if provided) as final `.refine()`
6. Register error messages in runtime catalog
7. Reject reserved namespaces (`base`, `string`, `confirmation`)

**Ref:** SPEC.md §7.1, §7.1.1

### 1.8 Done When

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

**Gate: Phase 1 → Phase 2 requires: all tests pass, `pnpm lint` zero errors/warnings, `pnpm typecheck` zero errors, no `any`, no unapproved ESLint config changes.**

---

## Phase 2: Checks

**Goal:** All 23 pure check functions, independently testable.
**Ref:** SPEC.md §6.1-6.7

Checks are pure functions. No Zod dependency, no config dependency. Build and test in isolation.

### 2.1 Character Composition (`src/checks/composition.ts`)

| Function | Signature | Notes |
|---|---|---|
| `hasUppercase` | `(value: string, min: number, max?: number) => boolean` | |
| `hasLowercase` | `(value: string, min: number, max?: number) => boolean` | |
| `hasDigits` | `(value: string, min: number, max?: number) => boolean` | |
| `hasSpecial` | `(value: string, min: number, max?: number) => boolean` | Special = not letter, not digit, not space |

### 2.2 Content Detection (`src/checks/detection.ts`)

| Function | Signature | Notes |
|---|---|---|
| `containsEmail` | `(value: string) => boolean` | Regex-based |
| `containsUrl` | `(value: string) => boolean` | Regex-based |
| `containsHtml` | `(value: string) => boolean` | Detects `<tag>` patterns |
| `containsPhoneNumber` | `(value: string) => boolean` | Uses `libphonenumber-js` `findPhoneNumbersInText()` |

**Note:** `containsPhoneNumber` is the only check with an external dependency.

### 2.3 Character Restriction (`src/checks/restriction.ts`)

| Function | Signature |
|---|---|
| `onlyAlpha` | `(value: string) => boolean` |
| `onlyNumeric` | `(value: string) => boolean` |
| `onlyAlphanumeric` | `(value: string) => boolean` |
| `onlyAlphanumericSpaceHyphen` | `(value: string) => boolean` |
| `onlyAlphaSpaceHyphen` | `(value: string) => boolean` |

### 2.4 Limits (`src/checks/limits.ts`)

| Function | Signature |
|---|---|
| `maxWords` | `(value: string, max: number) => boolean` |
| `maxConsecutive` | `(value: string, max: number) => boolean` |
| `noSpaces` | `(value: string) => boolean` |

### 2.5 Transforms (`src/checks/transforms.ts`)

| Function | Signature |
|---|---|
| `emptyToUndefined` | `(value: unknown) => unknown` |
| `toTitleCase` | `(value: string) => string` |
| `toSlug` | `(value: string) => string` |
| `stripHtml` | `(value: string) => string` |
| `collapseWhitespace` | `(value: string) => string` |

### 2.6 Schema Utilities (`src/utilities/`)

These ARE Zod-coupled (they produce refinements). Separate from checks.

| Function | Signature |
|---|---|
| `sameAs` | `(fieldPath: string) => ZodRefinement` |
| `requiredWhen` | `(condition: (data) => boolean) => ZodRefinement` |

### 2.7 Done When

- [ ] All 23 checks pass unit tests with real-world data
- [ ] `hasUppercase('HeLLo', 2)` → `true`
- [ ] `hasUppercase('NGUYỄN', 1)` → `true` (Vietnamese uppercase)
- [ ] `hasUppercase('MÜLLER', 1)` → `true` (German uppercase)
- [ ] `containsEmail('contact test@example.com please')` → `true`
- [ ] `containsEmail('user@sub.domain.co.uk is my email')` → `true`
- [ ] `containsPhoneNumber('call +34 612 345 678 now')` → `true` (uses libphonenumber)
- [ ] `containsPhoneNumber('call (212) 555-1234 now')` → `true` (US format)
- [ ] `containsPhoneNumber('call 06 12 34 56 78 now')` → `true` (French format)
- [ ] `maxConsecutive('aaab', 3)` → `true`, `maxConsecutive('aaaab', 3)` → `false`
- [ ] `toTitleCase('jean-paul o\'brien')` → `"Jean-Paul O'Brien"` (handles hyphens + apostrophes)
- [ ] `toTitleCase('maría garcía')` → `"María García"` (handles unicode)
- [ ] `emptyToUndefined('')` → `undefined`, `emptyToUndefined('hello')` → `'hello'`
- [ ] `sameAs` and `requiredWhen` produce working Zod refinements
- [ ] Zero Zod dependency in check files (except detection.ts for libphonenumber and utilities/)
- [ ] All check functions have explicit TypeScript return types
- [ ] No `any` in any check file

**Gate: Phase 2 → Phase 3 requires: all tests pass, `pnpm lint` zero errors/warnings, `pnpm typecheck` zero errors, no `any`, no unapproved ESLint config changes.**

---

## Phase 3: Data Files

**Goal:** All bundled data files ready for rules to consume.
**Ref:** SPEC.md §6.8

### 3.1 Files to Create

| File | Content | Size | Source |
|---|---|---|---|
| `commonPasswords.ts` | Exports `tier1` (100), `tier2` (1k), `tier3` (10k) as `string[]` each | ~50kb total | [SecLists](https://github.com/danielmiessler/SecLists/tree/master/Passwords) |
| `reservedUsernames.ts` | Export `string[]` of 200+ reserved words | ~2kb | Curate from GitHub/Twitter/Instagram reserved lists |
| `countryCodes.ts` | Export `Map<string, { alpha2, alpha3, name }>` | ~5kb | ISO 3166-1 |
| `currencyCodes.ts` | Export `Set<string>` of valid ISO 4217 codes | ~3kb | ISO 4217 |
| `ibanPatterns.ts` | Export `Map<string, { length, regex }>` | ~5kb | ECB IBAN registry |
| `vatPatterns.ts` | Export `Map<string, RegExp>` | ~3kb | EU VAT format patterns |
| `creditCardPrefixes.ts` | Export issuer prefix + length data | ~1kb | Well-documented industry data |

**Password tiers:** `blockCommon` accepts `boolean | 'basic' | 'moderate' | 'strict'`:
- `true` or `'basic'` → tier1 (top 100) — default
- `'moderate'` → tier2 (top 1,000)
- `'strict'` → tier3 (top 10,000)
- `false` → no blocking

Each tier is a separate export. Only the requested tier is loaded. Tiers are cumulative — tier2 includes tier1.

### 3.2 Data Loading Strategy

**All data is lazily loaded via dynamic `import()`.** No static imports for any data file. One pattern, no exceptions.

This means:
- Every rule that depends on bundled data requires `parseAsync()` on first use (or `preloadData()` first)
- After first load, data is cached in memory — subsequent calls are sync-safe
- If a rule is never imported, its data never enters the bundle (tree-shaking)
- On the server, `preloadData()` at startup loads everything needed — all subsequent calls are sync

```typescript
// preloadData() loads data for all enabled async features
await preloadData({
  commonPasswords: 'basic',     // or 'moderate' or 'strict'
  reservedUsernames: true,
  disposableDomains: true,
  phoneMetadata: 'min',         // or 'mobile' or 'max'
  postalCodes: true,
  countryCodes: true,
  currencyCodes: true,
  ibanPatterns: true,
  vatPatterns: true,
  creditCardPrefixes: true,
});
// After this, sync .parse() works for everything
```

**Internal pattern:** Each data file exports a loader function:

```typescript
// src/data/countryCodes.ts
let cache: Map<string, CountryData> | undefined;

export async function loadCountryCodes(): Promise<Map<string, CountryData>> {
  if (cache) return cache;
  const data = await import('./countryCodes.data.json');
  cache = new Map(Object.entries(data));
  return cache;
}

export function getCountryCodes(): Map<string, CountryData> {
  if (!cache) throw new Error('Country codes not loaded. Use parseAsync() or call preloadData() first.');
  return cache;
}
```

### 3.3 Done When

- [ ] All data files export correct types (no `any`)
- [ ] `countryCodes` contains 249 entries
- [ ] `commonPasswords` tier1 contains 100 entries, tier2 contains 1,000, tier3 contains 10,000+
- [ ] Tiers are cumulative (tier2 includes all of tier1)
- [ ] `reservedUsernames` contains admin, root, system, support, help, webmaster, postmaster, etc.
- [ ] `ibanPatterns` covers ~80 countries with correct lengths
- [ ] `creditCardPrefixes` correctly identifies Visa, Mastercard, Amex, Discover, Diners, JCB, UnionPay
- [ ] All data files use the async loader pattern (lazy load + cache)
- [ ] `loadCountryCodes()` / `getCountryCodes()` pattern works correctly
- [ ] `getCountryCodes()` throws if called before `loadCountryCodes()`
- [ ] Second call to `loadCountryCodes()` returns cached data (no re-import)

**Gate: Phase 3 → Phase 4 requires: all tests pass, `pnpm lint` zero errors/warnings, `pnpm typecheck` zero errors, no `any`, no unapproved ESLint config changes.**

---

## Phase 4: Rules

**Goal:** All 25 rules implemented and tested.
**Ref:** SPEC.md §7.2-7.26, OPTIONS.md (all options/defaults/error codes per rule)

Every rule follows the same implementation pattern:

```typescript
// src/rules/{ruleName}.ts
import { createRule } from '../core/createRule';
import type { FormatRuleOptions } from '../types'; // or BaseRuleOptions

export interface {RuleName}Options extends FormatRuleOptions {
  // ... options from OPTIONS.md
}

export const {RuleName} = createRule<{RuleName}Options>({
  name: '{namespace}',
  defaults: { /* from DEFAULTS.md */ },
  build: (opts, z) => {
    let schema = z.string();
    // ... validation logic using checks
    return schema;
  },
  messages: {
    invalid: '{{label}} is not a valid {thing}',
    // ... from OPTIONS.md error codes
  },
});
```

### Build Order

Build rules in this order — simplest first, most complex last. Each rule is independently testable after Phase 1 is complete.

#### Tier 1: Thin Wrappers (Zod native + error surface)

These delegate format validation entirely to Zod. validex adds error surface ownership and options.

| # | Rule | Zod base | Options count | SPEC ref |
|---|---|---|---|---|
| 1 | UUID | `z.uuid()` | 1 | §7.14 |
| 2 | MacAddress | `z.mac()` | 1 | §7.25 |
| 3 | Color | regex | 2 | §7.21 |
| 4 | Slug | regex | 2 | §7.11 |
| 5 | Country | lookup | 3 | §7.19 |
| 6 | Currency | lookup | 2 | §7.20 |

**Implementation notes:**
- UUID: `z.uuid()` with optional version filter via regex on version nibble
- MacAddress: `z.mac()` with delimiter normalization
- Color: regex per format (hex, rgb, hsl, any). Alpha channel handling.
- Slug: single regex `^[a-z0-9]+(-[a-z0-9]+)*$` + `extraChars` modifies pattern
- Country: lookup against `countryCodes` data, `allowCountries`/`blockCountries` filtering
- Currency: lookup against `currencyCodes` data, same filtering pattern

#### Tier 2: Business Logic (checks + options, no external deps)

| # | Rule | Key logic | Options count | SPEC ref |
|---|---|---|---|---|
| 7 | PersonName | charset + boundary + consecutive + words | 8 | §7.3 |
| 8 | BusinessName | charset + boundary + consecutive | 6 | §7.4 |
| 9 | Password | composition checks + consecutive | 7 | §7.5 |
| 10 | PasswordConfirmation | `sameAs` utility | 1 | §7.6 |
| 11 | Username | pattern + boundary + consecutive | 9 | §7.10 |
| 12 | LicenseKey | segment pattern generation | 5 | §7.13 |
| 13 | DateTime | Zod iso validators + business constraints | 8 | §7.16 |
| 14 | Token | Zod native per type + length defaults | 2 | §7.17 |
| 15 | IpAddress | `z.ipv4()`/`z.ipv6()` + CIDR + private ranges | 3 | §7.26 |
| 16 | Website | `z.url()` + protocol + domain + path/query control | 8 | §7.8 |
| 17 | URL | `z.url()` + protocol + domain + auth control | 7 | §7.9 |

**Implementation notes:**
- PersonName/BusinessName: build character class regex from defaults + `extraChars` - `disallowChars`. Apply `boundary` check on first/last char. Apply `consecutive` via `maxConsecutive` check. Apply `words` via `maxWords` check.
- Password: chain `hasUppercase`, `hasLowercase`, `hasDigits`, `hasSpecial`, `maxConsecutive` checks as `.refine()` calls. Each produces its own error code.
- Username: build regex from `pattern` preset + `extraChars` - `disallowChars`. Apply `boundary`. Apply `consecutive`.
- LicenseKey: generate regex from `segments` × `segmentLength` + `separator` + `charset`. Presets override these.
- DateTime: select Zod base (`z.iso.datetime()`, `z.iso.date()`, `z.iso.time()`) from `format`. Apply `allowOffset`, `allowLocal`, `precision` as Zod options. Apply `min`/`max`/`allowFuture`/`allowPast` as `.refine()`.
- Token: select Zod base from `type` (`z.nanoid()`, `z.hex()`, etc.). Apply `length` (type-specific defaults from DEFAULTS.md).
- IpAddress: `z.ipv4()` or `z.ipv6()` or union based on `version`. CIDR via regex extension. Private range detection via `.refine()` checking known ranges.
- Website: `z.url()` base. Normalize adds `https://` to bare domains. Protocol restricted to http/https. `allowSubdomains`, `allowPath`, `allowQuery` via `.refine()` on parsed URL.
- URL: similar to Website but more permissive. `protocols` array, `allowAuth` blocks `user:pass@`.

#### Tier 3: Bundled Data Rules

| # | Rule | Data source | SPEC ref |
|---|---|---|---|
| 18 | CreditCard | `creditCardPrefixes.ts` | §7.22 |
| 19 | IBAN | `ibanPatterns.ts` | §7.23 |
| 20 | VatNumber | `vatPatterns.ts` | §7.24 |
| 21 | JWT | JSON parse + claim/algorithm checks | §7.15 |

**Implementation notes:**
- CreditCard: Luhn algorithm implementation + prefix matching against `creditCardPrefixes`. `allowIssuers`/`blockIssuers` filtering.
- IBAN: extract country code (first 2 chars), lookup in `ibanPatterns`, validate length + regex + mod-97 checksum.
- VatNumber: auto-detect country from first 2 chars or use `country` option. Lookup in `vatPatterns`. Validate against country regex. `requirePrefix` controls whether country prefix must be in the value.
- JWT: split on `.`, validate 3 parts, base64-decode header + payload. Check `requireExpiry`/`checkExpiry`/`checkNotBefore`/`clockTolerance` against decoded `exp`/`nbf` claims. Check `requireClaims` against decoded payload keys. Check `allowAlgorithms` against decoded header `alg`.

#### Tier 4: External Dependency Rules (async capable)

| # | Rule | External dep | SPEC ref |
|---|---|---|---|
| 22 | PostalCode | `postal-codes-js` | §7.12 |
| 23 | Phone | `libphonenumber-js/core` | §7.7 |
| 24 | Email | `disposable-email-domains` | §7.2 |
| 25 | Text | checks + `libphonenumber-js` (for `noPhoneNumbers`) | §7.18 |

**Implementation notes:**
- PostalCode: dynamic import `postal-codes-js`. Call `postalCodes.validate(country, value)`. If country unsupported and no `regex`/`customFn`, throw config error at creation time.
- Phone: dynamic import metadata JSON. Use `parsePhoneNumber(value, { defaultCountry, extract: false })`. Check `.isValid()`. Apply `requireMobile` via `.getType()`. Apply `requireCountryCode` by checking input starts with `+`. Apply `format` via `.format('E164')` etc. Apply `allowCountries`/`blockCountries`.
- Email: `z.email()` for format. Apply `blockPlusAlias` (check for `+`). Apply `allowSubdomains` (count dots in domain). Apply `blockDomains`/`allowDomains`. Dynamic import `disposable-email-domains` for `blockDisposable`.
- Text: chain `containsEmail`, `containsUrl`, `containsPhoneNumber` (uses libphonenumber), `containsHtml` checks based on `no*` options. Apply `maxWords`, `maxConsecutive`.

#### Tier 5: Async Data Rules

| # | Rule | Async data | SPEC ref |
|---|---|---|---|
| — | Password | `commonPasswords.ts` (when `blockCommon` is truthy) | §7.5 |
| — | Username | `reservedUsernames.ts` (when `blockReserved: true`) | §7.10 |

These rules are already built in Tier 2 but their async features need wiring:
- Dynamic import of data file on first `parseAsync()` call
- Password loads only the requested tier: `'basic'` → tier1, `'moderate'` → tier2, `'strict'` → tier3, `true` → tier1
- Cache after first load
- Throw on sync `.parse()` if data not loaded and value passes sync checks

**Note:** All data-dependent rules follow this same async pattern (Tier 1-4 rules with bundled data also use lazy loading, per Phase 3 §3.2). Tier 5 highlights the rules where the async is most visible to the consumer because `blockCommon`/`blockReserved` are opt-in features.

**Ref:** SPEC.md §7.1 (async enforcement pattern)

### 4.1 Per-Rule Test Checklist

Every rule must have tests covering:

**Functional:**
- [ ] Default options produce valid schema
- [ ] `emptyToUndefined` converts `""` → undefined (triggers required)
- [ ] `normalize` transforms input correctly (trim, case, etc.)
- [ ] Each option works in isolation
- [ ] Options combine correctly (no conflicts)
- [ ] `customFn` runs after all built-in checks pass
- [ ] `customFn` does NOT run if built-in checks fail
- [ ] `regex` overrides format (FormatRuleOptions rules only)
- [ ] `regex` does NOT override length, blocking, customFn
- [ ] Error codes match OPTIONS.md exactly
- [ ] `getParams()` returns correct namespace, code, and params
- [ ] Three-tier merge: default → global → per-call override

**Real-world data (minimum per rule):**
- [ ] 10+ valid inputs that must pass
- [ ] 10+ invalid inputs that must fail
- [ ] Edge cases: minimum length, maximum length, boundary values
- [ ] Unicode inputs (where applicable)
- [ ] International data (names, phones, postal codes from multiple countries)

**Security:**
- [ ] XSS payloads: `<script>alert(1)</script>`, `"><img src=x onerror=alert(1)>`
- [ ] SQL injection patterns: `'; DROP TABLE users; --`
- [ ] Null bytes: `"hello\x00world"`
- [ ] Extremely long input (10,000+ chars)
- [ ] Malformed unicode: overlong encodings, surrogate pairs

**Async (where applicable):**
- [ ] `parseAsync()` loads data and validates correctly
- [ ] Sync `.parse()` throws if data not loaded
- [ ] After `preloadData()`, sync `.parse()` works
- [ ] Data caching: second `parseAsync()` doesn't re-import

### 4.2 Real-World Test Data Examples

**PersonName must accept:**
`"Jean-Paul"`, `"O'Brien"`, `"María García"`, `"José María García de la Cruz"`, `"Nguyễn Thị Thanh"`, `"李明"`, `"Müller"`, `"Björk"`, `"Renée"`, `"Søren"`, `"D'Angelo"`, `"al-Rashid"`

**PersonName must reject:**
`"A"` (too short), `"Aaaaaaron"` (consecutive), `"-John"` (boundary), `"John-"` (boundary), `"123"` (no letters), `""` (empty), `"<script>"` (XSS)

**Email must accept:**
`"user@example.com"`, `"user+tag@gmail.com"`, `"user@sub.domain.co.uk"`, `"very.common@example.org"`, `"user@123.123.123.123"`, `"user@[IPv6:::1]"` (if RFC-compliant)

**Phone must accept (with appropriate country):**
`"+34 612 345 678"` (Spain), `"+44 20 7946 0958"` (UK), `"+1 (212) 555-1234"` (US), `"+81 3-1234-5678"` (Japan), `"+49 30 12345678"` (Germany)

**PostalCode must accept:**
`"12345"` (US), `"12345-6789"` (US ZIP+4), `"SW1A 1AA"` (UK), `"K1A 0B1"` (Canada), `"10115"` (Germany), `"75001"` (France), `"123-4567"` (Japan)

### 4.3 Done When

- [ ] All 25 rules pass unit tests
- [ ] All error codes match OPTIONS.md registry exactly
- [ ] Async rules throw on sync `.parse()` when data needed and not loaded
- [ ] `preloadData()` enables sync `.parse()` for all async rules
- [ ] `createRule` dogfooding verified — all 25 rules use it
- [ ] Three-tier merge verified end-to-end (defaults → setup globals → per-call)
- [ ] `regex` override works on all 8 FormatRuleOptions rules
- [ ] `customFn` works on all 25 rules (sync and async)
- [ ] All data lazily loaded via dynamic import (no static data imports)
- [ ] Minimum 10 valid + 10 invalid test cases per rule
- [ ] Security test vectors pass for all rules
- [ ] No `any` in any rule file
- [ ] All rule option interfaces exported and fully typed

**Gate: Phase 4 → Phase 5 requires: all tests pass, `pnpm lint` zero errors/warnings, `pnpm typecheck` zero errors, no `any`, no unapproved ESLint config changes.**

---

## Phase 5: Adapters

**Goal:** Nuxt module and Fastify plugin.
**Ref:** SPEC.md §11-14

### 5.1 Validation Result Contract (`src/core/validate.ts`)

Already built in Phase 1. Verify it matches §11.1-11.2 exactly.

### 5.2 Nuxt Adapter (`src/adapters/nuxt/`)

**~75 lines of code.** Three files:

1. **`module.ts`** — `defineNuxtModule` that:
   - Reads `validex` key from `nuxt.config.ts`
   - Calls `setup()` with the config
   - Registers auto-imports for rules and composables
   - Detects `@nuxtjs/i18n` and auto-configures i18n integration

2. **`composables.ts`** — `useValidation` composable:
   - Accepts a Zod schema
   - Returns reactive `{ errors, firstErrors, validate, isValid }`
   - Always uses `safeParseAsync` (client-side)
   - Manages error state via `useState`/`ref`

3. **`index.ts`** — re-exports module and composables

**Ref:** SPEC.md §12.1-12.5

### 5.3 Fastify Adapter (`src/adapters/fastify/`)

**~60 lines of code.** Three files:

1. **`plugin.ts`** — `fastifyPlugin` that:
   - Calls `setup()` on registration
   - Calls `preloadData()` for async rules
   - Registers decorators

2. **`decorators.ts`**:
   - `app.validate(schema, data)` — instance-level validate
   - `request.validate(schema)` — request-level (uses request.body)
   - Route-level `schema: { body: MySchema }` via `preValidation` hook

3. **`index.ts`** — re-exports

**Ref:** SPEC.md §14.1-14.5

### 5.4 Adapter Test Requirements

**Nuxt adapter tests** (using `@nuxt/test-utils`):
- [ ] Module registers without errors
- [ ] Rules are auto-imported (no manual `import` needed in components)
- [ ] `useValidation` composable returns reactive `errors`, `firstErrors`, `validate`, `isValid`
- [ ] `useValidation` always uses `parseAsync` internally
- [ ] Error state clears on re-validation
- [ ] Config from `nuxt.config.ts` `validex` key is applied
- [ ] i18n auto-detection works when `@nuxtjs/i18n` is installed
- [ ] i18n auto-detection gracefully skips when `@nuxtjs/i18n` is not installed
- [ ] SSR: `preloadData` runs server-side, sync parse works after

**Fastify adapter tests** (using real Fastify instance):
- [ ] Plugin registers without errors
- [ ] `preloadData` called during registration
- [ ] `app.validate(schema, data)` returns `ValidationResult`
- [ ] `request.validate(schema)` validates `request.body`
- [ ] Route-level `schema: { body: ... }` validates automatically
- [ ] Invalid request returns structured error response (§14.5)
- [ ] Valid request passes through to handler with typed body
- [ ] Multiple routes with different schemas work independently
- [ ] Plugin config overrides via `setup()` apply to all routes

### 5.5 Done When

- [ ] Nuxt module registers and auto-imports rules
- [ ] `useValidation` returns reactive errors
- [ ] Nuxt i18n auto-detection works
- [ ] Fastify plugin registers and preloads data
- [ ] `app.validate()` and `request.validate()` work
- [ ] Route-level schema validation works
- [ ] Error response format matches §14.5
- [ ] All adapter tests pass with real framework instances (not mocks)
- [ ] No `any` in adapter code

**Gate: Phase 5 → Phase 6 requires: all tests pass, `pnpm lint` zero errors/warnings, `pnpm typecheck` zero errors, no `any`, no unapproved ESLint config changes.**

---

## Phase 6: Integration Tests

**Goal:** End-to-end scenarios that verify the full system works as a cohesive unit.
**Ref:** SPEC.md §9

### 6.1 Scenarios to Test

| Scenario | What it verifies |
|---|---|
| Register form | Email + Password + PasswordConfirmation + Username composed in `z.object()` |
| Login form | Email + Password composed together |
| Profile form | PersonName + Phone + Website + Text(bio) composed together |
| Payment form | CreditCard + PostalCode + Country + IBAN composed together |
| Auth token validation | JWT with `checkExpiry` + `requireClaims` + `allowAlgorithms` + `customFn` |
| i18n mode (keys) | All error codes produce correct i18n keys when `i18n.enabled: true` |
| i18n mode (t function) | `t()` function called with correct key + params |
| Global config | `setup()` affects all subsequent rule uses across multiple schemas |
| Per-call override | Per-call options override globals, globals override defaults |
| Override removal | `undefined` in per-call intentionally removes a global setting |
| Async flow | `blockDisposable` + `blockCommon` + `blockReserved` all work with `parseAsync` |
| `preloadData` | After preload, sync `.parse()` works for all async rules |
| Error surface | All errors go through validex error surface, none leak raw Zod codes |
| `customFn` in schema | `customFn` on multiple rules in same schema all run correctly |
| `regex` in schema | `regex` override on one rule doesn't affect other rules in same schema |
| `ValidationResult` shape | `errors`, `firstErrors`, `nestedErrors`, `issues` all correct |
| `validate()` utility | `validate(schema, data)` returns correct `ValidationResult` |
| Cross-field | `sameAs` and `requiredWhen` work within composed schemas |
| Nuxt end-to-end | Full form validation flow in Nuxt component |
| Fastify end-to-end | Full request validation flow with route-level schema |

### 6.2 Tree-Shaking Verification

- [ ] Import `Email` only → build → bundle does NOT contain Phone, PostalCode, or any other rule code
- [ ] Import `Email` only → build → bundle does NOT contain `libphonenumber-js`, `postal-codes-js`
- [ ] Import `Phone` only → build → bundle contains `libphonenumber-js/core` but NOT `postal-codes-js`
- [ ] Import nothing from `validex/nuxt` → build → no adapter code in bundle
- [ ] `sideEffects: false` verified by bundler analysis (Vite/Rollup)

### 6.3 Bundle Size Verification

- [ ] Core bundle (Email + Password only) < 10kb gzipped
- [ ] Full library (all 25 rules imported) < target from SPEC.md §10.2
- [ ] Verify with: Vite (Rollup), webpack 5, esbuild

### 6.4 Done When

- [ ] All integration scenarios pass
- [ ] No circular dependencies (verified by tooling)
- [ ] Tree-shaking verified for 3+ scenarios
- [ ] Bundle size within limits
- [ ] All errors use validex error surface (no raw Zod codes leak through)
- [ ] No `any` in test files

**Gate: Phase 6 → Phase 7 requires: all tests pass, `pnpm lint` zero errors/warnings, `pnpm typecheck` zero errors, no `any`, no unapproved ESLint config changes.**

---

## Phase 7: Polish

**Goal:** Ready for npm publish and public GitHub repo.

### 7.1 README.md

Structure:
1. Badges row (npm version, build status, TypeScript, license, bundle size)
2. One-line description + tagline
3. Install (`pnpm add validex zod`)
4. Quick start (3 examples: Email, Password, composed schema with `z.object`)
5. Why validex? (3-4 bullet points: one config, one error surface, 25 rules, i18n)
6. Rule list table (25 rules, one-line description each)
7. Configuration (`setup()` with example)
8. i18n (brief example with `t()`)
9. Framework adapters (Nuxt, Fastify — brief examples)
10. Custom rules (`createRule` brief example)
11. Custom validation (`customFn` and `regex` brief examples)
12. API reference link (to full docs, or to OPTIONS.md)
13. License

**Badges:**

```markdown
[![npm version](https://img.shields.io/npm/v/validex)](https://www.npmjs.com/package/validex)
[![build](https://img.shields.io/github/actions/workflow/status/{user}/validex/ci.yml)](https://github.com/{user}/validex/actions)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![license](https://img.shields.io/npm/l/validex)](./LICENSE)
```

### 7.2 CONTRIBUTING.md

Structure:
1. Development setup (`pnpm install`, `pnpm build`, `pnpm test`)
2. Project structure overview (brief — point to BUILD.md §0.1)
3. Branching: develop on `dev`, PRs to `main`
4. Commit convention: Conventional Commits
5. Adding a new rule (use `createRule`, follow existing rule as template)
6. Running tests (`pnpm test`, `pnpm test:watch`, `pnpm test:coverage`)
7. Code style: strict TypeScript, no `any`, ESLint enforced

### 7.3 CHANGELOG.md

Start with:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] - YYYY-MM-DD

### Added
- Initial release with 25 validation rules
- Nuxt and Fastify framework adapters
- i18n support with configurable translation functions
- `createRule` API for custom rules
```

### 7.4 CI Pipeline (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  push:
    branches: [dev]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18, 20, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          cache: pnpm
      - run: pnpm install --frozen-lockfile

      # Quality gates — same as local
      - name: Lint
        run: pnpm lint
      - name: Typecheck
        run: pnpm typecheck
      - name: Test with coverage
        run: pnpm test:coverage
      - name: Build
        run: pnpm build

      # Package correctness
      - name: Publint
        run: pnpm publint
      - name: Are the types wrong?
        run: pnpm attw --pack
      - name: Dead code check
        run: pnpm knip
      - name: Bundle size check
        run: pnpm size

  # Only runs on main after merge
  publish:
    needs: quality
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
          registry-url: 'https://registry.npmjs.org'
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      # Only publishes if version in package.json changed
      - name: Publish
        run: |
          CURRENT=$(npm view validex version 2>/dev/null || echo "0.0.0")
          LOCAL=$(node -p "require('./package.json').version")
          if [ "$CURRENT" != "$LOCAL" ]; then
            pnpm publish --no-git-checks
          else
            echo "Version unchanged ($LOCAL), skipping publish"
          fi
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

**CI tests on Node 18, 20, and 22** — ensures compatibility across all supported versions.

### 7.5 npm Publish Config

- [ ] `files` field in package.json: `["dist", "README.md", "LICENSE", "CHANGELOG.md"]`
- [ ] `prepublishOnly` script runs `pnpm check:full`
- [ ] `keywords`: `zod`, `validation`, `zod4`, `email`, `phone`, `typescript`, `i18n`, `nuxt`, `fastify`
- [ ] `repository`, `bugs`, `homepage` fields set
- [ ] `NPM_TOKEN` secret configured in GitHub repo settings

### 7.6 Final Verification

- [ ] `npm pack` produces clean tarball (inspect contents)
- [ ] README renders correctly on npm (preview with `npx npm-packlist`)
- [ ] No test files, source maps, or dev configs in published package
- [ ] License file present (MIT)
- [ ] All tests pass (`pnpm test`)
- [ ] All lint passes (`pnpm lint`)
- [ ] Build produces correct output (`pnpm build`)
- [ ] Package installs cleanly in a fresh project (`pnpm add ./validex-1.0.0.tgz`)
- [ ] Subpath imports work: `import { Email } from 'validex'`, `import { useValidation } from 'validex/nuxt'`
- [ ] TypeScript types resolve correctly for consumers
- [ ] Tree-shaking works in consumer's bundler

---

## Testing Strategy

**Three layers of testing for bulletproof validation.**

### Layer 1: Volume Fuzz Testing (`@faker-js/faker`)

Generate 1,000+ valid inputs per rule across 10+ locales. Any failure is a bug.

```typescript
// tests/helpers/generateTestData.ts
import { faker, fakerDE, fakerFR, fakerES, fakerJA, fakerVI,
         fakerTR, fakerPL, fakerRO, fakerAR } from '@faker-js/faker';

const locales = { en: faker, de: fakerDE, fr: fakerFR, es: fakerES,
                  ja: fakerJA, vi: fakerVI, tr: fakerTR, pl: fakerPL,
                  ro: fakerRO, ar: fakerAR };

export function generateNames(perLocale = 100) {
  return Object.entries(locales).flatMap(([code, f]) =>
    Array.from({ length: perLocale }, () => ({
      value: f.person.fullName(),
      locale: code,
    }))
  );
}

export function generateEmails(count = 1000) {
  return Array.from({ length: count }, () => faker.internet.email());
}

export function generatePhones(perLocale = 100) {
  return Object.entries(locales).flatMap(([code, f]) =>
    Array.from({ length: perLocale }, () => ({
      value: f.phone.number(),
      locale: code,
    }))
  );
}

export function generateCompanyNames(perLocale = 100) {
  return Object.entries(locales).flatMap(([code, f]) =>
    Array.from({ length: perLocale }, () => ({
      value: f.company.name(),
      locale: code,
    }))
  );
}
```

**Usage in tests:**

```typescript
// tests/rules/personName.test.ts
import { generateNames } from '../helpers/generateTestData';

describe('PersonName — fuzz testing', () => {
  const names = generateNames(100); // 1,000 names across 10 locales

  it.each(names)('should accept "$value" ($locale)', ({ value }) => {
    expect(PersonName().safeParse(value).success).toBe(true);
  });
});
```

**What Faker covers per rule:**

| Rule | Faker method | Locales to test |
|---|---|---|
| PersonName | `person.fullName()`, `person.firstName()`, `person.lastName()` | All 10 |
| BusinessName | `company.name()` | All 10 |
| Email | `internet.email()` | en (locale doesn't affect email format) |
| Phone | `phone.number()` | All 10 |
| Username | `internet.username()` | en |
| Website | `internet.url()` | en |
| PostalCode | `location.zipCode()` | Per-country (US, UK, CA, DE, FR, JP) |
| Password | `internet.password()` | en |
| UUID | `string.uuid()` | en |
| Color | `color.rgb()`, `internet.color()` | en |
| IBAN | `finance.iban()` | de, fr, es, gb |
| CreditCard | `finance.creditCardNumber()` | en |

### Layer 2: Curated Edge Case Fixtures

Static JSON files committed to the repo. These cover the cases Faker won't generate — unicode edge cases, boundary violations, security payloads, RFC compliance vectors.

**Fixture format:**

```json
// tests/fixtures/personNames.valid.json
[
  { "value": "Li", "note": "shortest valid (2 chars)" },
  { "value": "O'Brien", "note": "apostrophe" },
  { "value": "Jean-Paul", "note": "hyphen" },
  { "value": "María García", "note": "Spanish accents" },
  { "value": "José María García de la Cruz", "note": "5-word Spanish compound" },
  { "value": "Nguyễn Thị Thanh", "note": "Vietnamese with diacritics" },
  { "value": "李明", "note": "Chinese characters" },
  { "value": "田中太郎", "note": "Japanese kanji" },
  { "value": "Müller", "note": "German umlaut" },
  { "value": "Björk", "note": "Icelandic" },
  { "value": "Søren Kierkegaard", "note": "Danish ø" },
  { "value": "D'Angelo", "note": "apostrophe at boundary" },
  { "value": "al-Rashid", "note": "Arabic transliterated" },
  { "value": "Renée", "note": "French accent" },
  { "value": "Sinéad O'Connor", "note": "Irish accent + apostrophe" },
  { "value": "Chloë", "note": "diaeresis" },
  { "value": "Beyoncé", "note": "accent at end" },
  { "value": "Siân", "note": "Welsh circumflex" },
  { "value": "Пушкин", "note": "Cyrillic" },
  { "value": "محمد", "note": "Arabic script" }
]
```

```json
// tests/fixtures/personNames.invalid.json
[
  { "value": "", "note": "empty string", "expectedCode": "required" },
  { "value": "A", "note": "too short (1 char)", "expectedCode": "min" },
  { "value": "Aaaaaaaaaron", "note": "consecutive > 3", "expectedCode": "maxConsecutive" },
  { "value": "-John", "note": "starts with hyphen", "expectedCode": "boundary" },
  { "value": "John-", "note": "ends with hyphen", "expectedCode": "boundary" },
  { "value": "'Smith", "note": "starts with apostrophe", "expectedCode": "boundary" },
  { "value": "123", "note": "digits only", "expectedCode": "invalid" },
  { "value": "John123Smith", "note": "contains digits", "expectedCode": "invalid" },
  { "value": "One Two Three Four Five Six", "note": "6 words (max is 5)", "expectedCode": "maxWords" },
  { "value": "<script>alert(1)</script>", "note": "XSS payload", "expectedCode": "invalid" },
  { "value": "John\u0000Smith", "note": "null byte injection", "expectedCode": "invalid" },
  { "value": "'; DROP TABLE users;--", "note": "SQL injection", "expectedCode": "invalid" }
]
```

**Full fixture list:**

| File | Valid count | Invalid count | Source |
|---|---|---|---|
| `personNames.valid.json` | 100+ | — | Hand-curated international names |
| `personNames.invalid.json` | — | 50+ | Hand-curated + SecLists |
| `emails.valid.json` | 100+ | — | RFC 5321/5322 test vectors |
| `emails.invalid.json` | — | 100+ | RFC vectors + attack patterns |
| `phones.valid.json` | 100+ | — | Real numbers from 20+ countries |
| `phones.invalid.json` | — | 50+ | Malformed formats |
| `postalCodes.valid.json` | 100+ | — | Real codes, 30+ countries |
| `postalCodes.invalid.json` | — | 50+ | Wrong format per country |
| `businessNames.valid.json` | 50+ | — | Real companies (AT&T, H&M, 3M, etc.) |
| `businessNames.invalid.json` | — | 30+ | Boundary/consecutive violations |
| `passwords.weak.json` | — | 100 | SecLists top 100 common passwords |
| `usernames.reserved.json` | — | 200+ | admin, root, system, api, www, ftp, etc. |
| `security.xss.json` | — | 200+ | SecLists XSS Filter Evasion payloads |
| `security.injection.json` | — | 100+ | SecLists SQL injection strings |

**Usage in tests:**

```typescript
// tests/rules/personName.test.ts
import validNames from '../fixtures/personNames.valid.json';
import invalidNames from '../fixtures/personNames.invalid.json';

describe('PersonName — curated edge cases', () => {
  it.each(validNames)('should accept "$value" ($note)', ({ value }) => {
    expect(PersonName().safeParse(value).success).toBe(true);
  });

  it.each(invalidNames)('should reject "$value" ($note)', ({ value, expectedCode }) => {
    const result = PersonName().safeParse(value);
    expect(result.success).toBe(false);
    // Optionally verify error code
    if (expectedCode) {
      const params = getParams(result.error.issues[0]);
      expect(params.code).toBe(expectedCode);
    }
  });
});
```

### Layer 3: Property-Based Testing (`fast-check`)

Mathematical invariants that must hold across ALL possible inputs. Catches things neither Faker nor curated lists find.

```typescript
// tests/properties/email.property.test.ts
import * as fc from 'fast-check';
import { Email } from 'validex';

describe('Email — property-based', () => {
  it('accepted emails always contain exactly one @', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = Email().safeParse(input);
        if (result.success) {
          expect(result.data.split('@').length).toBe(2);
        }
      }),
      { numRuns: 10_000 }
    );
  });

  it('accepted emails are always trimmed and lowercase', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = Email().safeParse(input);
        if (result.success) {
          expect(result.data).toBe(result.data.trim().toLowerCase());
        }
      }),
      { numRuns: 10_000 }
    );
  });

  it('empty string always produces "required" error', () => {
    const result = Email().safeParse('');
    expect(result.success).toBe(false);
  });
});
```

```typescript
// tests/properties/personName.property.test.ts
import * as fc from 'fast-check';
import { PersonName } from 'validex';

describe('PersonName — property-based', () => {
  it('never accepts strings containing < or >', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        if (input.includes('<') || input.includes('>')) {
          expect(PersonName().safeParse(input).success).toBe(false);
        }
      }),
      { numRuns: 10_000 }
    );
  });

  it('accepted names are always >= 2 and <= 50 chars', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = PersonName().safeParse(input);
        if (result.success) {
          expect(result.data.length).toBeGreaterThanOrEqual(2);
          expect(result.data.length).toBeLessThanOrEqual(50);
        }
      }),
      { numRuns: 10_000 }
    );
  });

  it('accepted names never start or end with hyphen or apostrophe', () => {
    fc.assert(
      fc.property(fc.string(), (input) => {
        const result = PersonName().safeParse(input);
        if (result.success) {
          expect(result.data).not.toMatch(/^[-']/);
          expect(result.data).not.toMatch(/[-']$/);
        }
      }),
      { numRuns: 10_000 }
    );
  });
});
```

**Property tests per rule (examples):**

| Rule | Invariant |
|---|---|
| Email | Accepted → contains exactly one `@`, trimmed, lowercase |
| PersonName | Accepted → length 2-50, no `<>`, boundary alpha, max 5 words |
| Password | Accepted → length 8-128, has uppercase/lowercase/digit/special |
| Phone | Accepted → starts with `+` when `requireCountryCode: true` |
| Website | Accepted → starts with `http://` or `https://` |
| URL | Accepted → protocol is in `protocols` list |
| Username | Accepted → matches pattern, boundary alphanumeric |
| Slug | Accepted → matches `^[a-z0-9]+(-[a-z0-9]+)*$` |
| UUID | Accepted → matches UUID regex, correct version nibble |
| CreditCard | Accepted → passes Luhn algorithm |
| IBAN | Accepted → passes mod-97 checksum |
| All rules | Empty string → `required` error |
| All rules | `emptyToUndefined: true` + `""` → undefined |
| All rules | `customFn` runs only when built-in checks pass |
| All rules | Error codes are always camelCase |
| All rules | `getParams()` always returns `namespace` and `code` |

### Shared Test Harness

Every rule is tested through a shared harness that enforces the universal contract:

```typescript
// tests/helpers/testRule.ts
import { getParams } from 'validex';

export function testRuleContract(
  ruleName: string,
  ruleFactory: (opts?: any) => ZodSchema,
  namespace: string,
) {
  describe(`${ruleName} — universal contract`, () => {
    it('accepts undefined when field is optional', () => {
      const schema = ruleFactory().optional();
      expect(schema.safeParse(undefined).success).toBe(true);
    });

    it('converts empty string to undefined (emptyToUndefined: true)', () => {
      const result = ruleFactory().safeParse('');
      expect(result.success).toBe(false);
      const params = getParams(result.error.issues[0]);
      expect(params.code).toBe('required');
      expect(params.namespace).toBe('base');
    });

    it('preserves empty string when emptyToUndefined: false', () => {
      const result = ruleFactory({ emptyToUndefined: false }).safeParse('');
      // Should fail for a different reason (format), not "required"
      if (!result.success) {
        const params = getParams(result.error.issues[0]);
        expect(params.code).not.toBe('required');
      }
    });

    it('error issues always have correct namespace', () => {
      const result = ruleFactory().safeParse('definitely-invalid-input-!@#$%');
      if (!result.success) {
        for (const issue of result.error.issues) {
          const params = getParams(issue);
          // Should be rule namespace or 'base'
          expect([namespace, 'base', 'string']).toContain(params.namespace);
        }
      }
    });

    it('error codes are always camelCase', () => {
      const result = ruleFactory().safeParse('!@#$%^&*');
      if (!result.success) {
        for (const issue of result.error.issues) {
          const params = getParams(issue);
          expect(params.code).toMatch(/^[a-z][a-zA-Z]*$/);
        }
      }
    });

    it('customFn runs after built-in checks pass', () => {
      let customFnCalled = false;
      const schema = ruleFactory({
        customFn: (v: string) => { customFnCalled = true; return true; },
      });
      // Parse invalid input — customFn should NOT run
      schema.safeParse('!@#$');
      expect(customFnCalled).toBe(false);
    });

    it('customFn error uses {namespace}.custom code', async () => {
      const schema = ruleFactory({
        customFn: () => 'Custom error message',
      });
      // Need a valid input that passes built-in checks
      // This varies per rule — override in per-rule tests
    });

    it('normalize trims whitespace by default', () => {
      // Rule-specific — valid input with leading/trailing spaces
      // Override in per-rule tests with appropriate input
    });
  });
}
```

**Usage:**

```typescript
// tests/rules/email.test.ts
import { testRuleContract } from '../helpers/testRule';
import { Email } from 'validex';

testRuleContract('Email', Email, 'email');

describe('Email — rule-specific tests', () => {
  // ... curated fixtures, faker fuzz, property-based
});
```

### Testing & Dev Dependencies

All devDependencies are defined in §0.2 package.json. Key testing tools:

| Tool | Purpose |
|---|---|
| `vitest` + `@vitest/coverage-v8` | Test runner + native V8 coverage |
| `@faker-js/faker` | Volume fuzz testing across 10+ locales |
| `fast-check` | Property-based testing (10,000 random inputs) |
| `@nuxt/test-utils` | Nuxt adapter integration tests |
| `fastify` | Fastify adapter integration tests |
| `knip` | Dead code / unused export detection |
| `publint` | Package.json exports verification |
| `@arethetypeswrong/cli` | TypeScript declaration file verification |
| `simple-git-hooks` + `lint-staged` | Pre-commit lint enforcement |

---

## Appendix: Claude Code Handoff Strategy

### How to Feed This to Claude Code

**Don't dump everything at once.** Use this sequence:

1. **Start:** "Read CLAUDE.md first — these are your development rules. Then read docs/BUILD.md. We're starting Phase 0." (give CLAUDE.md + BUILD.md)
2. **Phase 1:** "Here's SPEC.md §3-5 for the foundation." (give relevant sections)
3. **Phase 2:** "Here's SPEC.md §6 for checks." (give §6 only)
4. **Phase 3:** "Here's the data files section from SPEC.md §6.8." (give §6.8 only)
5. **Phase 4, per rule:** "Build the Email rule. Here's OPTIONS.md §1 (Email) and SPEC.md §7.2." (give one rule at a time)
6. **Phase 5:** "Here's SPEC.md §11-14 for adapters." (give adapter sections)

**Remind Claude Code of CLAUDE.md rules** if you see violations. Common ones to watch for:
- Using `any` instead of `unknown`
- Missing JSDoc on exported functions
- Functions longer than 50 lines
- Missing return type annotations
- Using `message` directly in `.refine()` instead of `params`
- Modifying ESLint config to suppress errors

**Zod 4 API reference:** Claude Code's training data may include more Zod 3 patterns than Zod 4. Key differences to watch for:
- Zod 4 uses `z.email()` not `z.string().email()` (both work but `z.email()` is preferred)
- Zod 4 uses `error` param not `message` in schema definitions
- Zod 4 refinements store params in `issue.params` not `issue.message`
- Zod 4 has `z.config()` for global configuration (new in v4)
- Zod 4 has `z.iso.datetime()`, `z.iso.date()`, `z.iso.time()` (not `z.string().datetime()`)

If Claude Code writes Zod 3 patterns, point it to: https://zod.dev/v4
Zod 4 also provides an MCP server and `llms.txt` at https://zod.dev/llms.txt for AI-assisted development.

### Context Window Management

- BUILD.md (~500 lines) fits easily alongside one SPEC.md section
- OPTIONS.md (~500 lines) can be loaded alongside BUILD.md when building rules
- Never load full SPEC.md + OPTIONS.md + DEFAULTS.md simultaneously
- When switching phases, tell Claude Code "we're done with Phase X, starting Phase Y" so it can release context

### File-by-File Approach

For Phase 4 (rules), build one rule per session if needed:

```
Session 1: "Build UUID rule. Here's the interface from OPTIONS.md §13."
Session 2: "Build PersonName rule. Here's OPTIONS.md §2 and the checks from Phase 2."
Session 3: "Build Email rule. Here's OPTIONS.md §1 and SPEC.md §7.2."
```

Each rule is self-contained once the foundation (Phase 1) is built.
