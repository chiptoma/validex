---
'@validex/nuxt': patch
'@validex/fastify': patch
---

Align adapter packages with Nuxt Module and Fastify plugin directory conventions.

**@validex/nuxt**
- Move `@nuxt/kit` from `peerDependencies` to `dependencies` so module resolution works without relying on a hoisted `@nuxt/kit`.
- Declare `nuxt: ">=3.0.0"` as a real peer dependency (previously only referenced by an orphaned `peerDependenciesMeta` entry).
- Add `nuxt-module` to `keywords` for discovery on nuxt.com/modules.

**@validex/fastify**
- Move `fastify-plugin` from `peerDependencies` to `dependencies`, matching the convention used by `@fastify/*` plugins so consumers don't need to install it separately.
- Drop the `optional: true` flag on the `fastify` peer — Fastify is required, not optional.
- Add `fastify-plugin` to `keywords` for Fastify ecosystem indexing.
