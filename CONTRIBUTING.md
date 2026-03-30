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

# Full check (lint + typecheck + test + build + publint + attw + knip + size)
pnpm check:full
```

Requires **Node.js 22+** and **pnpm 9+**.

## Project Structure

The codebase is organized around rules, checks, utilities, and adapters. For a detailed architecture walkthrough, see [`docs/BUILD.md`](./docs/BUILD.md).

```
src/
├── rules/          # 25 validation rule factories
├── checks/         # 23 pure check functions
├── utilities/      # validate(), setup(), createRule(), schema helpers
├── adapters/       # Framework adapters (Nuxt, Fastify)
├── data/           # Bundled data files (loaded on demand)
└── types/          # Shared type definitions
tests/
├── rules/          # One test file per rule
├── checks/         # Check function tests
├── integration/    # Cross-rule and schema composition tests
├── properties/     # Property-based tests (fast-check)
└── adapters/       # Adapter-specific tests
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

## Adding a New Rule

1. **Use `createRule()`** — every rule is a factory built with the `createRule` helper.
2. **Follow an existing rule as a template** — start from a similar rule (e.g., `src/rules/email.ts` for simple rules, `src/rules/password.ts` for rules with data loading).
3. **Define an options interface** — export `YourRuleOptions` alongside the factory.
4. **Add tests** — create `tests/rules/yourRule.test.ts`. Include `testRuleContract()` to verify the rule satisfies the standard contract (valid inputs pass, invalid inputs fail, options override behavior).
5. **Export from barrel** — add your rule to `src/rules/index.ts`.
6. **Update documentation** — add the rule to the rules table in `README.md`.

### Rule contract test

Every rule test file should include the shared contract:

```ts
import { testRuleContract } from '../helpers/ruleContract'
import { myRule } from '../../src/rules/myRule'

testRuleContract(myRule, {
  valid: ['good-input-1', 'good-input-2'],
  invalid: ['bad-input-1', 'bad-input-2'],
})
```

## Running Tests

| Command | Scope |
| --- | --- |
| `pnpm test` | All tests (single run) |
| `pnpm test:watch` | All tests (watch mode) |
| `pnpm test:coverage` | All tests with coverage report |
| `pnpm test:rules` | Rule tests only |
| `pnpm test:checks` | Check function tests only |
| `pnpm test:integration` | Integration tests only |
| `pnpm test:properties` | Property-based tests only |
| `pnpm test:adapters` | Adapter tests only |

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

- [ ] `pnpm lint` passes with no warnings
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes (all tests green)
- [ ] New code has tests
- [ ] Exports have JSDoc comments
- [ ] Commit messages follow Conventional Commits
