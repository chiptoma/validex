# Contributing to validex

Thanks for your interest in contributing. This guide covers setup, conventions, and the workflow for submitting changes.

## Development Setup

```bash
# Clone and install
git clone https://github.com/chiptoma/validex.git
cd validex
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Full check (lint + typecheck + test + build + publint + knip + bundle size)
pnpm check:full
```

Requires **Node.js 22+** and **pnpm 10+**.

## Project Structure

```
packages/
├── core/             # @validex/core — main validation library
│   ├── src/
│   │   ├── rules/        # 25 validation rule factories
│   │   ├── checks/       # 22 pure check functions
│   │   ├── core/         # validate(), createRule(), getParams(), errorMap
│   │   ├── config/       # setup(), configure(), getConfig(), resetConfig()
│   │   ├── utilities/    # sameAs(), requiredWhen()
│   │   ├── augmentation/ # Zod type augmentation (22 chainable methods)
│   │   ├── internal/     # Shared helpers (not exported)
│   │   ├── data/         # Bundled JSON data files (loaded on demand)
│   │   ├── loaders/      # Thin lazy-loading wrappers for data/
│   │   ├── locales/      # i18n message templates (en.json)
│   │   └── cli/          # CLI for generating locale files
│   └── tests/
│       ├── unit/         # Unit tests per module
│       ├── integration/  # Cross-rule and schema composition tests
│       ├── e2e/          # End-to-end consumer tests
│       ├── property/     # Property-based tests (fast-check)
│       └── fuzz/         # Fuzz tests with faker data
├── nuxt/             # @validex/nuxt — Nuxt module adapter
└── fastify/          # @validex/fastify — Fastify plugin adapter
```

### Path Aliases (core package)

The core package uses TypeScript path aliases to avoid deep relative imports:

| Alias | Maps to |
|-------|---------|
| `@rules/email` | `src/rules/email.ts` |
| `@core/createRule` | `src/core/createRule.ts` |
| `@checks/composition` | `src/checks/composition.ts` |
| `@config/store` | `src/config/store.ts` |
| `@internal/resolveRange` | `src/internal/resolveRange.ts` |
| `@loaders/phoneParser` | `src/loaders/phoneParser.ts` |

Use aliases in both `src/` and `tests/`. Keep relative `./` imports for same-directory files.

## Branching

- **`dev`** — active development branch. Open PRs against `dev`.
- **`main`** — stable releases only. Merged from `dev` when ready.

Always branch from `dev`:

```bash
git checkout dev
git pull origin dev
git checkout -b feat/my-feature
```

## Commits

This project uses **Conventional Commits**, enforced by a git hook.

```
feat(email): add disposable domain detection
fix(password): correct min-length off-by-one
docs: update README examples
test(phone): add property-based tests
refactor(checks): extract shared length logic
chore: bump dependencies
```

Valid prefixes: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `ci`, `build`, `style`, `revert`.

## Changesets

This monorepo uses [changesets](https://github.com/changesets/changesets) for versioning and release notes.

When your PR includes a user-facing change (new feature, bug fix, breaking change):

1. Run `pnpm changeset` and follow the prompts.
2. Select the affected packages and describe the change.
3. Commit the generated `.changeset/*.md` file with your code.

Releases are automated via GitHub Actions when changesets are merged to `main`.

## Adding a New Rule

1. **Create the rule file** — `packages/core/src/rules/yourRule.ts`. Use `createRule()` and follow an existing rule as a template (e.g., `email.ts` for simple rules, `password.ts` for rules with data loading).

2. **Define the options interface** — export `YourRuleOptions` extending `BaseRuleOptions` (or `FormatRuleOptions` if the rule supports regex override).

3. **Add error messages** — add entries to `packages/core/src/locales/en.json` under a new namespace matching your rule's `name`.

4. **Export from barrel files:**
   - Add the rule factory to `packages/core/src/rules/index.ts`
   - Add the options type to `packages/core/src/types.ts` (RuleDefaults)
   - Add re-exports to `packages/core/src/index.ts`

5. **Add defaults** — if the rule has non-trivial defaults, add them to `packages/core/src/config/defaults.ts`.

6. **Write tests** — create `packages/core/tests/unit/rules/yourRule.test.ts`. Include `testRuleContract()` to verify the standard contract:

```ts
import { testRuleContract } from '../../_support/helpers/testRule'
import { YourRule } from '@rules/yourRule'

testRuleContract(YourRule, {
  valid: ['good-input-1', 'good-input-2'],
  invalid: ['bad-input-1', 'bad-input-2'],
})
```

7. **Update documentation** — add the rule to the rules table in `README.md` and `docs/API.md`.

## Running Tests

| Command | Scope |
|---------|-------|
| `pnpm test` | All tests across all packages |
| `pnpm test:unit` | Unit tests only |
| `pnpm test:integration` | Integration tests only |
| `pnpm test:e2e` | End-to-end tests only |
| `pnpm test:property` | Property-based tests (fast-check) |
| `pnpm test:fuzz` | Fuzz tests |
| `pnpm test:smoke` | Consumer smoke test (npm pack + install) |
| `pnpm test:bundle-size` | Bundle size regression test |
| `pnpm test:coverage` | All tests with coverage report |

## Code Style

- **Strict TypeScript** — `strict: true` in tsconfig, zero `any` in source code.
- **ESLint enforced** — run `pnpm lint` to check, `pnpm lint:fix` to auto-fix.
- **JSDoc on exports** — every exported function, type, and interface must have a JSDoc comment.
- **Max 50 lines per function** — break large functions into smaller helpers.
- **Max 300 lines per file** — split into modules when a file grows beyond this.
- **No commented-out code** — delete unused code; git keeps history.
- **No empty catch blocks** — handle errors properly or re-throw.
- **Import sorting** — handled automatically by `pnpm lint:fix`. Blank lines between import groups.

## Pull Request Checklist

Before opening a PR, verify:

- [ ] `pnpm check:full` passes
- [ ] `pnpm test:smoke` passes
- [ ] Changeset added (if user-facing change): `pnpm changeset`
- [ ] New code has tests
- [ ] Exports have JSDoc comments
- [ ] Commit messages follow Conventional Commits
- [ ] Docs updated if needed (README, API.md, I18N.md)
