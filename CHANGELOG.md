# Changelog

All notable changes documented here. Format: [Keep a Changelog](https://keepachangelog.com/). Versioning: [SemVer](https://semver.org/).

## [1.0.0-alpha.0] - 2026-03-30

### Added

- 25 validation rules: Email, Password, PersonName, BusinessName, Phone, Website, URL, Username, Slug, PostalCode, LicenseKey, UUID, JWT, DateTime, Token, Text, Country, Currency, Color, CreditCard, IBAN, VatNumber, MacAddress, IpAddress, PasswordConfirmation
- 23 pure check functions (composition, detection, restriction, limits, transforms)
- Schema utilities: sameAs, requiredWhen
- createRule() factory for custom rules
- validate() utility returning structured ValidationResult
- Global configuration via setup() with three-tier merge
- i18n support (key mode, t() function, label/message transforms)
- Nuxt adapter with useValidation composable and i18n auto-detection
- Fastify adapter with plugin, decorators, and route-level validation
- Full tree-shaking support: import 2 rules = 3.5 kB, all 25 = 13 kB (Brotli)
- Code splitting: data files (passwords, country codes) loaded on demand
- Pure annotations (@\_\_PURE\_\_) on all rule factories
- 7 bundled data files: common passwords (3 tiers), reserved usernames, country codes, currency codes, IBAN patterns, VAT patterns, credit card prefixes
- 3,700+ tests including property-based testing, external dataset hardening, ReDoS resistance
- TypeScript strict mode with zero any
