---
"@validex/core": major
"@validex/nuxt": major
"@validex/fastify": major
---

Initial v1.0.0 release.

- 25 type-safe validation rules built on Zod 4
- 22 chainable check methods via Zod augmentation
- 22 standalone pure check functions
- 141 error codes with full i18n support and CLI locale generator
- Cross-field validation (sameAs, requiredWhen)
- Three-tier config merge (defaults → global → per-call)
- Nuxt module with auto-imports and useValidation composable
- Fastify plugin with decorators and preValidation hooks
- Tree-shakeable, dual CJS/ESM, full TypeScript declarations
