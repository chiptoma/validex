# DEFAULTS.md — validex Rule Defaults (Final)

> **Status:** All defaults locked. Consistent with SPEC.md and OPTIONS.md.
> **Types:** `Range = number | { min?, max? }` — number = exact, object = range
> **Types:** `Boundary = 'alpha' | 'alphanumeric' | 'any' | { start?, end? }`

---

## BaseRuleOptions (all rules)

| Option | Default | Rationale |
|---|---|---|
| `label` | `undefined` | Auto-derived from field path |
| `emptyToUndefined` | `true` | Empty form fields trigger "required" checks |
| `normalize` | `true` | Trim + format-appropriate casing per rule |
| `customFn` | `undefined` | No custom validation by default |

---

## FormatRuleOptions (extends Base — 8 rules)

| Option | Default | Rationale |
|---|---|---|
| `regex` | `undefined` | No format override by default |

---

## 1. Email

| Option | Default | Rationale |
|---|---|---|
| `length` | `{ max: 254 }` | RFC 5321 limit |
| `blockPlusAlias` | `false` | Legitimate Gmail users use plus aliases |
| `blockDomains` | `[]` | No domains blocked |
| `allowDomains` | `[]` | All domains allowed |
| `blockDisposable` | `false` | Async — opt-in |
| `allowSubdomains` | `true` | user@sub.domain.com is valid |

## 2. PersonName

| Option | Default | Rationale |
|---|---|---|
| `length` | `{ min: 2, max: 50 }` | Li (2) to long Indian names (50) |
| `words` | `{ max: 5 }` | Covers Spanish/Portuguese compound names |
| `allowUnicode` | `true` | International names are the norm |
| `extraChars` | `undefined` | Default charset is sufficient |
| `disallowChars` | `undefined` | Default charset is sufficient |
| `boundary` | `'alpha'` | Names start/end with letters |
| `consecutive` | `{ max: 3 }` | Blocks "Aaaa" keyboard spam |
| `titleCase` | `false` | Don't change user's data |

## 3. BusinessName

| Option | Default | Rationale |
|---|---|---|
| `length` | `{ min: 2, max: 100 }` | BP (2) to long legal names (100) |
| `extraChars` | `undefined` | Default charset covers most companies |
| `disallowChars` | `undefined` | Default charset covers most companies |
| `boundary` | `'alphanumeric'` | "3M" starts with digit |
| `consecutive` | `{ max: 4 }` | Slightly more permissive than PersonName |
| `titleCase` | `false` | Companies have specific casing |

## 4. Password

| Option | Default | Rationale |
|---|---|---|
| `length` | `{ min: 8, max: 128 }` | NIST minimum, generous upper bound |
| `uppercase` | `{ min: 1 }` | Standard requirement |
| `lowercase` | `{ min: 1 }` | Standard requirement |
| `digits` | `{ min: 1 }` | Standard requirement |
| `special` | `{ min: 1 }` | Consumer decision |
| `consecutive` | `{ max: 3 }` | Blocks "aaaa" patterns |
| `blockCommon` | `false` | Async — opt-in. `true`/`'basic'` = top 100, `'moderate'` = top 1k, `'strict'` = top 10k |

## 5. PasswordConfirmation

| Option | Default | Rationale |
|---|---|---|
| `passwordField` | `'password'` | Most common field name |

## 6. Phone

| Option | Default | Rationale |
|---|---|---|
| `metadata` | `'min'` | Smallest bundle |
| `customMetadataPath` | `undefined` | Advanced — no default |
| `country` | `undefined` | Consumer specifies market |
| `allowCountries` | `[]` | All countries |
| `blockCountries` | `[]` | No countries blocked |
| `requireMobile` | `false` | Landlines are valid |
| `requireCountryCode` | `false` | Prefix not mandatory by default |
| `format` | `'e164'` | Universal machine-readable format |

## 7. Website

| Option | Default | Rationale |
|---|---|---|
| `length` | `{ max: 255 }` | Standard domain + path limit |
| `requireWww` | `false` | Modern sites don't use www |
| `requireHttps` | `false` | HTTP still valid |
| `allowDomains` | `[]` | All domains |
| `blockDomains` | `[]` | No domains blocked |
| `allowSubdomains` | `true` | blog.company.com is valid |
| `allowPath` | `true` | company.com/page is valid |
| `allowQuery` | `false` | Query params not part of "website" |

## 8. URL

| Option | Default | Rationale |
|---|---|---|
| `protocols` | `['http', 'https']` | Safe default, blocks XSS vectors |
| `requireTLD` | `true` | User-facing forms need proper domains |
| `length` | `{ max: 2048 }` | Browser URL bar limit |
| `allowDomains` | `[]` | All domains |
| `blockDomains` | `[]` | No domains blocked |
| `allowQuery` | `true` | URLs commonly have query params |
| `allowAuth` | `false` | user:pass@host is a security risk |

## 9. Username

| Option | Default | Rationale |
|---|---|---|
| `length` | `{ min: 3, max: 20 }` | Standard social media range |
| `pattern` | `'alphanumeric-underscore'` | Dominant platform convention |
| `extraChars` | `undefined` | Pattern covers common cases |
| `disallowChars` | `undefined` | Pattern covers common cases |
| `boundary` | `'alphanumeric'` | No _ or - at start/end |
| `consecutive` | `undefined` | Opt-in |
| `reservedWords` | `[]` | Additional words merged with built-in list |
| `blockReserved` | `false` | Async — consistent with other async defaults |
| `ignoreCase` | `true` | "Admin" = "admin" |

## 10. Slug

| Option | Default | Rationale |
|---|---|---|
| `length` | `{ min: 3, max: 100 }` | URL-friendly bounds |
| `extraChars` | `undefined` | Slug pattern covers standard format |

## 11. PostalCode

| Option | Default | Rationale |
|---|---|---|
| `country` | **REQUIRED** | No sensible default |

## 12. LicenseKey

| Option | Default | Rationale |
|---|---|---|
| `type` | `'custom'` | Default segments produce standard format |
| `segments` | `5` | Standard 5×5 format |
| `segmentLength` | `5` | Standard 5×5 format |
| `separator` | `'-'` | Universal separator |
| `charset` | `'alphanumeric'` | Standard for license keys |

## 13. UUID

| Option | Default | Rationale |
|---|---|---|
| `version` | `'any'` | Accept all UUID versions |

## 14. JWT

| Option | Default | Rationale |
|---|---|---|
| `requireExpiry` | `false` | Not all JWTs have exp |
| `checkExpiry` | `false` | Opt-in business logic |
| `checkNotBefore` | `false` | Opt-in business logic |
| `clockTolerance` | `0` | No tolerance — strict by default |
| `requireClaims` | `undefined` | No required claims |
| `allowAlgorithms` | `undefined` | Accept any algorithm |

## 15. DateTime

| Option | Default | Rationale |
|---|---|---|
| `format` | `'iso'` | Full ISO 8601 datetime |
| `min` | `undefined` | No minimum |
| `max` | `undefined` | No maximum |
| `allowFuture` | `true` | Permissive — consumer constrains |
| `allowPast` | `true` | Permissive — consumer constrains |
| `allowOffset` | `true` | Accept timezone offsets |
| `allowLocal` | `false` | Require timezone indicator |
| `precision` | `undefined` | Accept any precision |

## 16. Token

| Option | Default | Rationale |
|---|---|---|
| `type` | **REQUIRED** | No sensible default |
| `length` | type-specific | nanoid:21, cuid:25, cuid2:24, ulid:26, hex/base64:undefined |

## 17. Text

| Option | Default | Rationale |
|---|---|---|
| `length` | `undefined` | Text fields are too variable |
| `words` | `undefined` | No word limit |
| `consecutive` | `undefined` | Opt-in |
| `noEmails` | `false` | All blocking off by default |
| `noUrls` | `false` | All blocking off by default |
| `noPhoneNumbers` | `false` | All blocking off by default |
| `noHtml` | `false` | All blocking off by default |

## 18. Country

| Option | Default | Rationale |
|---|---|---|
| `format` | `'alpha2'` | Standard for web forms |
| `allowCountries` | `[]` | All countries |
| `blockCountries` | `[]` | No countries blocked |

## 19. Currency

| Option | Default | Rationale |
|---|---|---|
| `allowCurrencies` | `[]` | All currencies |
| `blockCurrencies` | `[]` | No currencies blocked |

## 20. Color

| Option | Default | Rationale |
|---|---|---|
| `format` | `'hex'` | Most common in web dev |
| `alpha` | `true` | Permissive — no valid color rejected |

## 21. CreditCard

| Option | Default | Rationale |
|---|---|---|
| `allowIssuers` | `undefined` | Accept all issuers |
| `blockIssuers` | `undefined` | No issuers blocked |

## 22. IBAN

| Option | Default | Rationale |
|---|---|---|
| `allowCountries` | `[]` | All countries |
| `blockCountries` | `[]` | No countries blocked |

## 23. VatNumber

| Option | Default | Rationale |
|---|---|---|
| `country` | `undefined` | Auto-detect from prefix |
| `requirePrefix` | `false` | Prefix optional when country set |

## 24. MacAddress

| Option | Default | Rationale |
|---|---|---|
| `delimiter` | `':'` | Industry standard (Linux, network tools) |

## 25. IpAddress

| Option | Default | Rationale |
|---|---|---|
| `version` | `'any'` | Accept both IPv4 and IPv6 |
| `allowCidr` | `false` | CIDR is for network admins |
| `allowPrivate` | `true` | Private IPs are valid addresses |
