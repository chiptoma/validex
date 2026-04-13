# @validex/nuxt

## 1.0.3

### Patch Changes

- [#16](https://github.com/chiptoma/validex/pull/16) [`da524da`](https://github.com/chiptoma/validex/commit/da524da070521520dcee8ead0c3421bb3128eb56) Thanks [@chiptoma](https://github.com/chiptoma)! - Align adapter packages with Nuxt Module and Fastify plugin directory conventions.

  **@validex/nuxt**

  - Move `@nuxt/kit` from `peerDependencies` to `dependencies` so module resolution works without relying on a hoisted `@nuxt/kit`.
  - Declare `nuxt: ">=3.0.0"` as a real peer dependency (previously only referenced by an orphaned `peerDependenciesMeta` entry).
  - Add `nuxt-module` to `keywords` for discovery on nuxt.com/modules.

  **@validex/fastify**

  - Move `fastify-plugin` from `peerDependencies` to `dependencies`, matching the convention used by `@fastify/*` plugins so consumers don't need to install it separately.
  - Drop the `optional: true` flag on the `fastify` peer — Fastify is required, not optional.
  - Add `fastify-plugin` to `keywords` for Fastify ecosystem indexing.

- Updated dependencies []:
  - @validex/core@1.0.3

## 1.0.2

### Patch Changes

- Updated dependencies [[`fa64bf2`](https://github.com/chiptoma/validex/commit/fa64bf2e4ed90de63ba22fc9ee7d16524d5e9c36)]:
  - @validex/core@1.0.2

## 1.0.1

### Patch Changes

- Updated dependencies [[`f39612e`](https://github.com/chiptoma/validex/commit/f39612e3030de830bed3786a89075b64999f2d53)]:
  - @validex/core@1.0.1
