# CLAUDE.md — validex Project Rules

> **Project-specific rules. Generic rules are in ~/.claude/CLAUDE.md (global).**
> **These are non-negotiable. Do not modify without explicit approval.**

@~/.claude/rules/lang/typescript.md

---

## Spec Documents

These are the source of truth. Implementation must match them:
- `docs/scope/SPEC.md` — Full specification
- `docs/scope/BUILD.md` — Implementation playbook
- `docs/scope/OPTIONS.md` — All options per rule
- `docs/scope/DEFAULTS.md` — All defaults with rationale

---

## Zod Rules

- **Zod 4 Classic only.** Import from `zod` or `zod/v4`. Never `zod/v4/core` or `zod/mini`.
- Use `.superRefine()` for custom validation that may emit multiple issues. `.refine()` with `params` is acceptable for single-issue validation — every error must carry `params: { code, namespace, label }`.
- Do NOT use Zod native validators (`.email()`, `.url()`, `.uuid()`, `.min()`, `.max()`, `.datetime()`) directly in the build pipeline. Wrap them inside `.superRefine()` so every error carries validex params.
- Cache wrapped Zod check schemas outside the closure for performance.

---

## Error Ownership

validex owns EVERY error message. No Zod default messages reach the consumer.

- All format validation wrapped in `.superRefine()` with validex params.
- All length validation wrapped with validex params.
- `emptyToUndefined` produces errors with validex params.
- In i18n mode, ALL messages go through the consumer's `t()` function.
- The consumer never sees "Invalid input", "Expected string", or any raw Zod message.

---

## createRule Pattern

Every rule MUST use `createRule`:

```typescript
export const Email = createRule<EmailOptions>({
  name: 'email',
  defaults: {},  // reads from RULE_DEFAULTS
  build: (opts) => { ... },
  messages: {},  // reads from en.json
})
```

- `defaults: {}` — tier-1 defaults from `src/config/defaults.ts`
- `messages: {}` — messages from `src/locales/en.json`
- No inline defaults or English strings in rule files.
- en.json is the SINGLE source of truth for messages.

**Approved exception:** `PasswordConfirmation` does not use `createRule` because
`confirmation` is a reserved namespace. It wraps `Password()` directly and registers
sameAs metadata manually. Do not refactor to createRule.

---

## Three-Tier Config Merge

```
RULE_DEFAULTS[name]  →  getConfig().rules[name]  →  per-call options
```

`undefined` in per-call removes a global setting (not same as absent).

---

## Data / Loaders Separation

- `src/data/` — pure JSON files only (no code).
- `src/loaders/` — thin .ts loader files only (load/get/clear pattern).
- All data lazy-loaded via `dynamic import()`. No exceptions.

---

## Normalization Order

1. `emptyToUndefined` → `base.required` with label
2. Normalize (trim, lowercase) — only if `normalize !== false`
3. Format validation (wrapped Zod or regex)
4. Business checks (blocking, length, boundary, consecutive)
5. `customFn` — last, only if all above pass

---

## Error Code Pattern

```typescript
ctx.addIssue({
  code: 'custom',
  params: {
    code: 'disposableBlocked',
    namespace: 'email',
    label: opts.label,
    domain: extractDomain(v),
  },
})
```

- Every `ctx.addIssue` includes `label: opts.label`.
- Every `{{placeholder}}` in en.json has a matching param.
- Every option violation uses a specific code (not generic `.invalid`).

---

## Naming

- Rule factories: `PascalCase` — `Email()`, `PersonName()`
- Error codes: `camelCase` — `disposableBlocked`, `maxConsecutive`
- Namespaces: `camelCase` — `email`, `personName`

---

## Git

- Never commit to `main` directly. PR from `dev`.
- Conventional commits: `feat|fix|docs|refactor|test|chore: message`
- Pre-commit hook: lint + typecheck must pass.

---

## Project-Specific Don'ts

- Don't use `Object.create()` to patch Zod schemas.
- Don't use `.meta()` through Zod pipelines (doesn't survive `.transform()`/`.pipe()`).
- Don't wrap Zod schemas with proxy objects to intercept `safeParse`.
- Don't use `Object.assign` for options — use three-tier merge.
- Don't import from `node:` builtins unless absolutely necessary.
