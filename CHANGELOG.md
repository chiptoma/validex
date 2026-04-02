# Changelog

All notable changes documented here. Format: [Keep a Changelog](https://keepachangelog.com/). Versioning: [SemVer](https://semver.org/).

## [1.0.0] - 2026-04-02

### Added

- 25 validation rules with full option coverage
- 22 chainable Zod methods via module augmentation
- 23 pure check functions (composition, detection, restriction, limits, transforms)
- Cross-field validation: sameAs, requiredWhen via validate()
- Global configuration via setup() with three-tier merge
- Full i18n support (key mode, t() function, label/message transforms)
- 141 error codes across 27 namespaces with full error ownership
- Monorepo: @validex/core, @validex/nuxt, @validex/fastify
- Nuxt adapter: module, useValidation composable, auto-imports
- Fastify adapter: plugin, decorators, route-level validation
- createRule() factory for custom rules
- CLI: npx validex init-locale <lang>
- Tree-shaking: import 2 rules = ~3.5 kB Brotli
- 7687 tests, 97.5% branch coverage, 100% statement coverage
- Consumer smoke test (npm pack + install + 65 assertions)
- Property-based tests (fast-check, 1000+ iterations)
