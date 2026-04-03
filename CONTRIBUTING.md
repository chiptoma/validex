# Contributing to validex

Thanks for your interest in contributing. This guide covers setup, conventions, and the workflow for submitting changes.

## Development Setup

```bash
# Clone and install
git clone <repo-url>
cd validex
pnpm install

# Build
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
│       └── fuzz/         # Fuzz tests
├── nuxt/             # @validex/nuxt — Nuxt module adapter
└── fastify/          # @validex/fastify — Fastify plugin adapter
```

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

This monorepo uses [changesets](https://github.com/changesets/changesets) for versioning.

1. Make your changes on a feature branch.
2. Run `pnpm changeset` and follow the prompts to describe the change and select affected packages.
3. Commit the generated changeset file along with your code changes.
4. Open a PR. The changeset is consumed during the release process:

```bash
pnpm changeset        # create a changeset
pnpm changeset:version # bump versions (maintainers only)
pnpm release          # publish to npm (maintainers only)
```

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
import { testRuleContract } from '../helpers/ruleContract'
import { YourRule } from '../../../src/rules/yourRule'

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

## Pull Request Checklist

Before opening a PR, verify:

- [ ] `pnpm check:full` passes
- [ ] `pnpm test:bundle-size` passes
- [ ] `pnpm test:smoke` passes
- [ ] Changeset added (if user-facing change): `pnpm changeset`
- [ ] New code has tests
- [ ] Exports have JSDoc comments
- [ ] Commit messages follow Conventional Commits
- [ ] Docs updated if needed (README, API.md, I18N.md)
