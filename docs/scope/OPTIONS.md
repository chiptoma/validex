# OPTIONS.md — validex Complete Options Reference (Final)

> **Status:** All options, defaults, error codes, and naming locked.
> **Types:** `Range = number | { min?, max? }` — number = exact, object = range
> **Types:** `Boundary = 'alpha' | 'alphanumeric' | 'any' | { start?, end? }` — string = both sides, object = per-side

---

## Base Interfaces

```typescript
interface BaseRuleOptions {
  label?: string;                    // Default: undefined (auto-derived)
  emptyToUndefined?: boolean;        // Default: true
  normalize?: boolean;               // Default: true
  customFn?: (value: string) => true | string | Promise<true | string>;
  // Runs AFTER all built-in validations. true = pass, string = error message.
  // i18n disabled: string shown directly. i18n enabled: string treated as i18n key.
  // Async supported — triggers parseAsync requirement.
  // Error registered under {namespace}.custom
  sameAs?: string;                   // Cross-field equality check (field name)
  requiredWhen?: string | ((fields: Record<string, unknown>) => boolean);
  // Conditional required: field name (truthy check) or predicate function
}

interface FormatRuleOptions extends BaseRuleOptions {
  regex?: RegExp;
  // Overrides format/character validation only.
  // Still applies: length, words, consecutive, titleCase, block*/allow*, customFn.
}
```

**FormatRuleOptions rules (support `regex`):** PersonName, BusinessName, Username, Slug, PostalCode, LicenseKey, Token, Text

**BaseRuleOptions only (no `regex`):** Email, Password, PasswordConfirmation, Phone, Website, URL, UUID, JWT, DateTime, Country, Currency, Color, CreditCard, IBAN, VatNumber, MacAddress, IpAddress

---

## Universal Semantics

**`allow*` / `block*`:** Mutually exclusive. If both provided, `allow*` takes precedence. Empty array `[]` = no filtering (not "block all"). `undefined` and `[]` behave identically.

**`regex` override scope:** Replaces format/character validation. Does NOT replace `length`, `words`, `consecutive`, `titleCase`, `block*`/`allow*`, `customFn`.

**`customFn` i18n:** i18n disabled → returned string is the message. i18n enabled → returned string is treated as i18n key, passed through `t()`.

**`normalize` order:** Normalize runs BEFORE `regex` and all other validations. Input is cleaned first, then validated.

**Website bare domains:** When `normalize: true`, bare domains (`google.com`) are auto-prepended with `https://`.

**`consecutive` semantics:** Counts identical characters in sequence after normalize. "aaaa" = 4 consecutive. Case-sensitive after normalize (if normalize lowercases, "aA" → "aa" = 2).

---

## 1. Email — extends BaseRuleOptions

| Option | Type | Default |
|---|---|---|
| `length` | `Range` | `{ max: 254 }` |
| `blockPlusAlias` | `boolean` | `false` |
| `blockDomains` | `string[]` | `[]` |
| `allowDomains` | `string[]` | `[]` |
| `blockDisposable` | `boolean` | `false` (async) |
| `allowSubdomains` | `boolean` | `true` |

**Dep:** `disposable-email-domains` (dynamic import for `blockDisposable`)
**Normalize:** lowercase + trim
**Errors:** `invalid`, `plusAliasBlocked`, `disposableBlocked`, `domainBlocked`, `domainNotAllowed`, `subdomainNotAllowed`

---

## 2. PersonName — extends FormatRuleOptions

| Option | Type | Default |
|---|---|---|
| `length` | `Range` | `{ min: 2, max: 50 }` |
| `words` | `Range` | `{ max: 5 }` |
| `allowUnicode` | `boolean` | `true` |
| `extraChars` | `string` | `undefined` |
| `disallowChars` | `string` | `undefined` |
| `boundary` | `Boundary` | `'alpha'` |
| `consecutive` | `Range` | `{ max: 3 }` |
| `titleCase` | `boolean` | `false` |

**Default chars:** Letters (+ unicode), spaces, hyphens, apostrophes
**Normalize:** trim only
**Errors:** `invalid`, `maxWords`, `boundary`, `maxConsecutive`

---

## 3. BusinessName — extends FormatRuleOptions

| Option | Type | Default |
|---|---|---|
| `length` | `Range` | `{ min: 2, max: 100 }` |
| `extraChars` | `string` | `undefined` |
| `disallowChars` | `string` | `undefined` |
| `boundary` | `Boundary` | `'alphanumeric'` |
| `consecutive` | `Range` | `{ max: 4 }` |
| `titleCase` | `boolean` | `false` |

**Default chars:** Letters, digits, spaces, `&`, `.`, `,`, `-`, `'`, `()`
**Normalize:** trim only
**Errors:** `invalid`, `boundary`, `maxConsecutive`

---

## 4. Password — extends BaseRuleOptions

| Option | Type | Default |
|---|---|---|
| `length` | `Range` | `{ min: 8, max: 128 }` |
| `uppercase` | `Range` | `{ min: 1 }` |
| `lowercase` | `Range` | `{ min: 1 }` |
| `digits` | `Range` | `{ min: 1 }` |
| `special` | `Range` | `{ min: 1 }` |
| `consecutive` | `Range` | `{ max: 3 }` |
| `blockCommon` | `boolean \| 'basic' \| 'moderate' \| 'strict'` | `false` (async) |

**`blockCommon` tiers:** `true` or `'basic'` = top 100 passwords, `'moderate'` = top 1,000, `'strict'` = top 10,000.
**Normalize:** trim only
**Errors:** `minUppercase`, `minLowercase`, `minDigits`, `minSpecial`, `maxUppercase`, `maxConsecutive`, `commonBlocked`

---

## 5. PasswordConfirmation — extends BaseRuleOptions

| Option | Type | Default |
|---|---|---|
| `passwordField` | `string` | `'password'` |

**Errors:** `mismatch` (namespace: `confirmation`)

---

## 6. Phone — extends BaseRuleOptions

| Option | Type | Default |
|---|---|---|
| `metadata` | `'min' \| 'mobile' \| 'max' \| 'custom'` | `'min'` |
| `customMetadataPath` | `string` | `undefined` |
| `country` | `string` | `undefined` |
| `allowCountries` | `string[]` | `[]` |
| `blockCountries` | `string[]` | `[]` |
| `requireMobile` | `boolean` | `false` |
| `requireCountryCode` | `boolean` | `false` |
| `format` | `'e164' \| 'international' \| 'national'` | `'e164'` |

**Dep:** `libphonenumber-js/core` + bundled metadata
**Config:** `requireMobile: true` with `metadata: 'min'` → throws config error
**Normalize:** trim + strip formatting (libphonenumber handles)
**Errors:** `invalid`, `requireMobile`, `countryBlocked`, `countryNotAllowed`

---

## 7. Website — extends BaseRuleOptions

| Option | Type | Default |
|---|---|---|
| `length` | `Range` | `{ max: 255 }` |
| `requireWww` | `boolean` | `false` |
| `requireHttps` | `boolean` | `false` |
| `allowDomains` | `string[]` | `[]` |
| `blockDomains` | `string[]` | `[]` |
| `allowSubdomains` | `boolean` | `true` |
| `allowPath` | `boolean` | `true` |
| `allowQuery` | `boolean` | `false` |

**Normalize:** lowercase + trim + auto-prepend `https://` to bare domains
**Errors:** `invalid`, `domainBlocked`, `domainNotAllowed`, `subdomainNotAllowed`

---

## 8. Url — extends BaseRuleOptions

| Option | Type | Default |
|---|---|---|
| `protocols` | `string[]` | `['http', 'https']` |
| `requireTLD` | `boolean` | `true` |
| `length` | `Range` | `{ max: 2048 }` |
| `allowDomains` | `string[]` | `[]` |
| `blockDomains` | `string[]` | `[]` |
| `allowQuery` | `boolean` | `true` |
| `allowAuth` | `boolean` | `false` |

**Normalize:** trim (preserve case in path/query)
**Errors:** `invalid`, `protocolNotAllowed`, `domainBlocked`, `domainNotAllowed`

---

## 9. Username — extends FormatRuleOptions

| Option | Type | Default |
|---|---|---|
| `length` | `Range` | `{ min: 3, max: 20 }` |
| `pattern` | `'alphanumeric' \| 'alphanumeric-dash' \| 'alphanumeric-underscore'` | `'alphanumeric-underscore'` |
| `extraChars` | `string` | `undefined` |
| `disallowChars` | `string` | `undefined` |
| `boundary` | `Boundary` | `'alphanumeric'` |
| `consecutive` | `Range` | `undefined` |
| `reservedWords` | `string[]` | `[]` |
| `blockReserved` | `boolean` | `false` (async) |
| `ignoreCase` | `boolean` | `true` |

**Normalize:** lowercase + trim
**Errors:** `invalid`, `reservedBlocked`, `boundary`, `maxConsecutive`

---

## 10. Slug — extends FormatRuleOptions

| Option | Type | Default |
|---|---|---|
| `length` | `Range` | `{ min: 3, max: 100 }` |
| `extraChars` | `string` | `undefined` |

**Pattern:** `[a-z0-9]+(-[a-z0-9]+)*` — boundaries enforced by pattern
**Normalize:** lowercase + trim
**Errors:** `invalid`

---

## 11. PostalCode — extends FormatRuleOptions

| Option | Type | Default |
|---|---|---|
| `country` | `string` | **REQUIRED** |

**Dep:** `postcode-validator` (200+ countries, dynamic import)
**Unsupported country:** Throws config error. Use `regex` or `customFn` as escape hatch.
**Normalize:** uppercase + trim
**Errors:** `invalid`

---

## 12. LicenseKey — extends FormatRuleOptions

| Option | Type | Default |
|---|---|---|
| `type` | `'windows' \| 'uuid' \| 'custom'` | `'custom'` |
| `segments` | `number` | `5` |
| `segmentLength` | `number` | `5` |
| `separator` | `string` | `'-'` |
| `charset` | `'alphanumeric' \| 'alpha' \| 'numeric' \| 'hex'` | `'alphanumeric'` |

**Normalize:** uppercase + trim
**Errors:** `invalid`

---

## 13. Uuid — extends BaseRuleOptions

| Option | Type | Default |
|---|---|---|
| `version` | `1 \| 2 \| 3 \| 4 \| 5 \| 6 \| 7 \| 8 \| 'any'` | `'any'` |

**Normalize:** lowercase + trim
**Errors:** `invalid`

---

## 14. Jwt — extends BaseRuleOptions

| Option | Type | Default |
|---|---|---|
| `requireExpiry` | `boolean` | `false` |
| `checkExpiry` | `boolean` | `false` |
| `checkNotBefore` | `boolean` | `false` |
| `clockTolerance` | `number` | `0` (seconds) |
| `requireClaims` | `string[]` | `undefined` |
| `allowAlgorithms` | `string[]` | `undefined` |

**Note:** `clockTolerance` only applies when `checkExpiry` or `checkNotBefore` is `true`.
**Normalize:** trim
**Errors:** `invalid`, `expired`, `notYetValid`, `missingClaim`, `algorithmNotAllowed`

---

## 15. DateTime — extends BaseRuleOptions

| Option | Type | Default |
|---|---|---|
| `format` | `'iso' \| 'date' \| 'time'` | `'iso'` |
| `min` | `Date \| string` | `undefined` |
| `max` | `Date \| string` | `undefined` |
| `allowFuture` | `boolean` | `true` |
| `allowPast` | `boolean` | `true` |
| `allowOffset` | `boolean` | `true` |
| `allowLocal` | `boolean` | `false` |
| `precision` | `number` | `undefined` |

**`precision`:** `0` = seconds, `3` = milliseconds, `6` = microseconds, `undefined` = any
**Normalize:** trim
**Errors:** `invalid`, `tooEarly`, `tooLate`, `noFuture`, `noPast`

---

## 16. Token — extends FormatRuleOptions

| Option | Type | Default |
|---|---|---|
| `type` | `'nanoid' \| 'hex' \| 'base64' \| 'cuid' \| 'cuid2' \| 'ulid'` | **REQUIRED** |
| `length` | `Range` | type-specific |

**Type-specific lengths:** nanoid: `21`, cuid: `25`, cuid2: `24`, ulid: `26`, hex: `undefined`, base64: `undefined`
**Normalize:** trim
**Errors:** `invalid`

---

## 17. Text — extends FormatRuleOptions

| Option | Type | Default |
|---|---|---|
| `length` | `Range` | `undefined` |
| `words` | `Range` | `undefined` |
| `consecutive` | `Range` | `undefined` |
| `noEmails` | `boolean` | `false` |
| `noUrls` | `boolean` | `false` |
| `noPhoneNumbers` | `boolean` | `false` |
| `noHtml` | `boolean` | `false` |

**Note:** `noPhoneNumbers` uses `libphonenumber-js` `findPhoneNumbersInText()` — pulls in libphonenumber dependency.
**Normalize:** trim
**Errors:** `noEmails`, `noUrls`, `noPhoneNumbers`, `noHtml`, `maxWords`, `maxConsecutive`

---

## 18. Country — extends BaseRuleOptions

| Option | Type | Default |
|---|---|---|
| `format` | `'alpha2' \| 'alpha3'` | `'alpha2'` |
| `allowCountries` | `string[]` | `[]` |
| `blockCountries` | `string[]` | `[]` |

**Normalize:** uppercase + trim
**Errors:** `invalid`, `blocked`, `notAllowed`

---

## 19. Currency — extends BaseRuleOptions

| Option | Type | Default |
|---|---|---|
| `allowCurrencies` | `string[]` | `[]` |
| `blockCurrencies` | `string[]` | `[]` |

**Normalize:** uppercase + trim
**Errors:** `invalid`, `blocked`, `notAllowed`

---

## 20. Color — extends BaseRuleOptions

| Option | Type | Default |
|---|---|---|
| `format` | `'hex' \| 'rgb' \| 'hsl' \| 'any'` | `'hex'` |
| `alpha` | `boolean` | `true` |

**Normalize:** lowercase + trim
**Errors:** `invalid`

---

## 21. CreditCard — extends BaseRuleOptions

| Option | Type | Default |
|---|---|---|
| `allowIssuers` | `IssuerType[]` | `undefined` (all) |
| `blockIssuers` | `IssuerType[]` | `undefined` |

**`IssuerType`:** `'visa' | 'mastercard' | 'amex' | 'discover' | 'diners' | 'jcb' | 'unionpay'`
**Note:** `allowIssuers` takes precedence over `blockIssuers` if both provided.
**Normalize:** trim + strip spaces/dashes
**Errors:** `invalid`, `issuerNotAllowed`, `issuerBlocked`

---

## 22. Iban — extends BaseRuleOptions

| Option | Type | Default |
|---|---|---|
| `allowCountries` | `string[]` | `[]` |
| `blockCountries` | `string[]` | `[]` |

**Normalize:** uppercase + trim + strip spaces
**Errors:** `invalid`, `countryBlocked`, `countryNotAllowed`

---

## 23. VatNumber — extends BaseRuleOptions

| Option | Type | Default |
|---|---|---|
| `country` | `string` | `undefined` (auto-detect) |
| `requirePrefix` | `boolean` | `false` |

**Behavior:** `country` set + no prefix → validates against country format. `country` undefined → auto-detect from prefix, fails if no recognizable prefix.
**Normalize:** uppercase + trim + strip spaces
**Errors:** `invalid`

---

## 24. MacAddress — extends BaseRuleOptions

| Option | Type | Default |
|---|---|---|
| `delimiter` | `':' \| '-' \| 'none'` | `':'` |

**Normalize:** trim
**Errors:** `invalid`

---

## 25. IpAddress — extends BaseRuleOptions

| Option | Type | Default |
|---|---|---|
| `version` | `'v4' \| 'v6' \| 'any'` | `'any'` |
| `allowCidr` | `boolean` | `false` |
| `allowPrivate` | `boolean` | `true` |

**Normalize:** trim
**Errors:** `invalid`, `privateNotAllowed`

---

## Complete Error Code Registry

**27 namespaces, 141 error codes (including `{namespace}.custom` for customFn)**

| Namespace | Codes |
|---|---|
| `base` | `required`, `min`, `max`, `type`, `format` |
| `string` | `minUppercase`, `maxUppercase`, `minLowercase`, `maxLowercase`, `minDigits`, `maxDigits`, `minSpecial`, `maxSpecial`, `noEmails`, `noUrls`, `noPhoneNumbers`, `noHtml`, `noSpaces`, `onlyAlpha`, `onlyNumeric`, `onlyAlphanumeric`, `onlyAlphaSpaceHyphen`, `onlyAlphanumericSpaceHyphen`, `minWords`, `maxWords`, `maxConsecutive` |
| `email` | `invalid`, `plusAliasBlocked`, `disposableBlocked`, `domainBlocked`, `domainNotAllowed`, `subdomainNotAllowed` |
| `personName` | `invalid`, `maxWords`, `boundary`, `maxConsecutive` |
| `businessName` | `invalid`, `boundary`, `maxConsecutive` |
| `password` | `minUppercase`, `minLowercase`, `minDigits`, `minSpecial`, `maxUppercase`, `maxLowercase`, `maxDigits`, `maxSpecial`, `maxConsecutive`, `commonBlocked` |
| `confirmation` | `mismatch`, `custom` |
| `phone` | `invalid`, `requireMobile`, `countryCodeRequired`, `countryBlocked`, `countryNotAllowed` |
| `website` | `invalid`, `httpsRequired`, `wwwRequired`, `pathNotAllowed`, `queryNotAllowed`, `domainBlocked`, `domainNotAllowed`, `subdomainNotAllowed` |
| `url` | `invalid`, `protocolNotAllowed`, `tldRequired`, `queryNotAllowed`, `authNotAllowed`, `domainBlocked`, `domainNotAllowed` |
| `username` | `invalid`, `reservedBlocked`, `boundary`, `maxConsecutive` |
| `slug` | `invalid` |
| `postalCode` | `invalid` |
| `licenseKey` | `invalid` |
| `uuid` | `invalid` |
| `jwt` | `invalid`, `expired`, `notYetValid`, `expiryRequired`, `missingClaim`, `algorithmNotAllowed` |
| `dateTime` | `invalid`, `tooEarly`, `tooLate`, `noFuture`, `noPast` |
| `token` | `invalid` |
| `text` | `invalid`, `minWords`, `noEmails`, `noUrls`, `noPhoneNumbers`, `noHtml`, `maxWords`, `maxConsecutive` |
| `country` | `invalid`, `blocked`, `notAllowed` |
| `currency` | `invalid`, `blocked`, `notAllowed` |
| `color` | `invalid` |
| `creditCard` | `invalid`, `issuerNotAllowed`, `issuerBlocked` |
| `iban` | `invalid`, `countryBlocked`, `countryNotAllowed` |
| `vatNumber` | `invalid` |
| `macAddress` | `invalid` |
| `ipAddress` | `invalid`, `privateNotAllowed` |

> Every namespace supports `{namespace}.custom` when `customFn` is configured.

---

## Dependencies

| Dependency | Type | Used by | Loaded when |
|---|---|---|---|
| `zod` ^3.25.0 || ^4.0.0 | peer | Everything | Always |
| `libphonenumber-js/core` | regular | Phone, Text (`noPhoneNumbers`) | Bundle if Phone/Text imported |
| `postcode-validator` | regular | PostalCode | Dynamic import on first use |
| `disposable-email-domains` | regular | Email (`blockDisposable`) | Dynamic import on first use |

---

## Naming Conventions

| Convention | Pattern | Examples |
|---|---|---|
| Numeric constraints | `Range` type | `length`, `words`, `uppercase`, `consecutive` |
| Character boundaries | `Boundary` type | `boundary: 'alpha'`, `boundary: { start: 'alpha', end: 'alphanumeric' }` |
| Blocking (boolean) | `block{Category}` | `blockDisposable`, `blockCommon`, `blockReserved` |
| Blocking (list) | `block{Noun}` | `blockDomains`, `blockCountries`, `blockCurrencies`, `blockIssuers` |
| Whitelisting (list) | `allow{Noun}` | `allowDomains`, `allowCountries`, `allowIssuers`, `allowCurrencies` |
| Requiring | `require{Thing}` | `requireMobile`, `requireWww`, `requireTLD`, `requireHttps`, `requireExpiry`, `requireCountryCode`, `requirePrefix` |
| Allowing (boolean) | `allow{Thing}` | `allowUnicode`, `allowSubdomains`, `allowPath`, `allowQuery`, `allowAuth`, `allowCidr`, `allowPrivate`, `allowFuture`, `allowPast`, `allowOffset`, `allowLocal` |
| Format selection | `format`, `type`, `pattern` | `format: 'hex'`, `type: 'nanoid'`, `pattern: 'alphanumeric-underscore'` |
| Custom function | `customFn` | Available on all rules (BaseRuleOptions) |
| Regex override | `regex` | Available on FormatRuleOptions rules only |
| Error namespaces | camelCase | `personName`, `creditCard`, `ipAddress` |
| Error codes | camelCase | `disposableBlocked`, `domainNotAllowed`, `minUppercase` |
| Format error | `invalid` (universal) | `email.invalid`, `phone.invalid`, `uuid.invalid` |
