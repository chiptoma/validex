# CLAUDE.md — Development Rules for validex

> **This file is read by Claude Code before writing any implementation code.**
> **These rules are non-negotiable. Do not modify them without explicit approval.**

---

## Code Quality Rules

### Zod

- **Zod Classic only.** Import from `zod` or `zod/v4`. Never import from `zod/v4/core` or `zod/mini`.
- Use Zod 4 APIs: `z.email()`, `z.uuid()`, `z.iso.datetime()`, `z.config()`.
- Use `.refine()` and `.superRefine()` for custom validation — these are method-chain APIs only available in Classic.
- Use `error` param not `message` in schema definitions (Zod 4 change).
- Refer to https://zod.dev/v4 for current API docs if unsure.

### TypeScript

- `any` is forbidden. Use `unknown` with type narrowing instead.
- Every function must have an explicit return type annotation.
- Every exported function, interface, and type must have a JSDoc comment with `@param` and `@returns`.
- Prefer `interface` over `type` for object shapes. Use `type` only for unions, intersections, and mapped types.
- No type assertions (`as`) without a `// SAFETY:` comment explaining why it's necessary.
- No non-null assertions (`!`) without a `// SAFETY:` comment.
- Use `readonly` for arrays and objects that should not be mutated.
- Use `const` assertions for literal types where appropriate.
- No `enum` — use `as const` objects or union types instead.

### Functions

- Maximum function length: 50 lines. If longer, decompose.
- Maximum file length: 300 lines. If longer, split into modules.
- One function per concern. A function that validates AND transforms should be two functions.
- Pure functions where possible. Side effects only in config store and data loaders.
- No nested functions deeper than 2 levels. Extract to named functions.
- Early returns over nested conditionals.

### Naming

- Functions: `camelCase` verbs — `resolveRange`, `buildCharset`, `loadCountryCodes`
- Interfaces: `PascalCase` nouns — `EmailOptions`, `ValidationResult`
- Types: `PascalCase` — `Range`, `Boundary`, `IssuerType`
- Constants: `UPPER_SNAKE_CASE` for true constants, `camelCase` for configuration defaults
- Files: `camelCase.ts` — `personName.ts`, `resolveRange.ts`, `creditCard.ts`
- Test files: `{name}.test.ts` — `personName.test.ts`, `resolveRange.test.ts`
- No abbreviations except universally understood ones: `opts`, `config`, `params`, `fn`

### Imports

- Absolute imports within the package (no `../../..` chains)
- Group: external deps → internal modules → types
- Type-only imports use `import type { ... }`
- Never import from `index.ts` within the package — import from the specific file

### Error Handling

- Config errors (developer mistakes) → `throw new Error('validex: ...')`
- Validation errors (user input) → Zod issues with `params: { code, namespace }`
- Never swallow errors silently
- Never use `try/catch` for control flow

---

## Testing Rules

### TDD Approach

Write tests BEFORE implementation when possible. The sequence for each function:

1. Write the interface/type
2. Write test cases (what should pass, what should fail)
3. Implement the function until tests pass
4. Add edge case tests
5. Refactor if needed

### Test Structure

```typescript
describe('RuleName', () => {
  // 1. Universal contract (via testRuleContract helper)
  testRuleContract('RuleName', RuleName, 'namespace')

  // 2. Default behavior
  describe('defaults', () => { ... })

  // 3. Each option in isolation
  describe('option: length', () => { ... })
  describe('option: boundary', () => { ... })

  // 4. Option combinations
  describe('combined options', () => { ... })

  // 5. Curated fixtures
  describe('curated valid inputs', () => { ... })
  describe('curated invalid inputs', () => { ... })

  // 6. Faker fuzz
  describe('fuzz testing', () => { ... })

  // 7. Error codes
  describe('error codes', () => { ... })
})
```

### Test Quality

- Every test must have a descriptive name that explains the scenario, not the implementation
- Good: `'should accept Vietnamese names with diacritics'`
- Bad: `'test case 1'`, `'works correctly'`, `'handles edge case'`
- One assertion per test unless testing a single logical outcome
- No test should depend on another test's state
- No `console.log` in tests
- No `.only` or `.skip` without a `// TODO:` comment

---

## Architecture Rules

### createRule Pattern

Every rule MUST use `createRule`. No rule builds its own schema pipeline manually.

```typescript
// CORRECT
export const Email = createRule<EmailOptions>({
  name: 'email',
  defaults: { ... },
  build: (opts, z) => { ... },
  messages: { ... },
})

// WRONG — never do this
export function Email(opts?: EmailOptions) {
  return z.string().email().refine(...)
}
```

### Data Loading Pattern

Every data file follows the same async loader pattern:

```typescript
let cache: DataType | undefined

export async function loadData(): Promise<DataType> {
  if (cache) return cache
  const data = await import('./data.json')
  cache = processData(data)
  return cache
}

export function getData(): DataType {
  if (!cache) {
    throw new Error('validex: Data not loaded. Use parseAsync() or call preloadData() first.')
  }
  return cache
}
```

No exceptions to this pattern. Even small data files (country codes, currency codes) use lazy loading.

### Normalization Pattern

Every rule applies normalization in this order:

1. `emptyToUndefined` — convert `""` and `null` to `undefined`
2. Rule-specific normalize (trim, lowercase, etc.) — only if `normalize: true`
3. Format validation (Zod native or regex)
4. Business logic checks (blocking lists, length, boundary, consecutive)
5. `customFn` — runs last, only if all above pass

### Error Code Pattern

Error codes are always set via `.refine()` or `.superRefine()` params:

```typescript
.refine(v => someCheck(v), {
  params: {
    code: 'disposableBlocked',
    namespace: 'email',
  },
})
```

Never use `message` directly in `.refine()` — the error message system handles it.

---

## ESLint Rules

- **Zero errors, zero warnings.** Not negotiable.
- **Do not modify `eslint.config.ts`** to suppress errors. Fix the code instead.
- **Do not add `// eslint-disable` comments** without a `// REASON:` comment explaining why the disable is necessary and why the code cannot be refactored to comply.
- If a lint rule seems genuinely wrong for this project, document the case and request approval.

---

## Git Rules

- **Never commit to `main` directly.** Always PR from `dev`.
- **Conventional commits required.** Enforced by git hook. Format: `feat|fix|docs|refactor|test|chore: message`
- **Every commit must pass lint + typecheck.** Enforced by pre-commit hook.
- **No `--no-verify` on commits.** The hooks exist for a reason.

---

## What NOT to Do

- Don't use `Object.assign` or spread to merge options — use the three-tier merge system
- Don't import from `node:` builtins unless absolutely necessary (browser compatibility)
- Don't add dependencies without approval — each dep is a maintenance commitment
- Don't use `class` — use factory functions and closures
- Don't use `this` — it's a functional library
- Don't use `async/await` in hot paths where sync is possible
- Don't catch errors to return default values — let them propagate
- Don't use `console.log` for debugging — remove before commit (enforced by `no-console: warn`)
- Don't write clever code — write obvious code. The next reader should understand it in 10 seconds.
