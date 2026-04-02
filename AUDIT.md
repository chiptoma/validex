# FULL SYSTEM TRACE — All 25 Rules

## SYSTEMIC ISSUES (affecting multiple rules)

Before the per-rule tables, these cross-cutting problems affect many rules:

**S1. PARAM MISMATCH (18 instances)** — en.json messages contain `{{placeholder}}` parameters that are NOT passed in the `.refine()` params object. The placeholder will render literally as `{{domain}}` etc. in the output message.

**S2. `string` namespace is DEAD (8 codes)** — `string.minUppercase`, `string.minLowercase`, `string.minDigits`, `string.minSpecial`, `string.maxUppercase`, `string.maxConsecutive`, `string.maxWords`, `string.noSpaces` exist in en.json, I18N.md, and API.md but NO rule ever produces a code in the `string` namespace.

**S3. `{namespace}.custom` NOT IN EN.JSON or I18N.MD** — Every rule supports `customFn` via createRule, producing `{namespace}.custom` code. This code has no en.json template (message comes from customFn return value). API.md mentions it generically. I18N.md does not list it at all.

**S4. `customFn` UNTESTED per-rule** — No individual rule test file includes a test with `customFn` configured.

**S5. `label` UNTESTED per-rule** — Almost no rule test verifies that the `label` option appears in error messages.

**S6. I18N.md label mismatch** — JWT label is `"Token"` in I18N.md template but `"JWT"` in en.json.

---

### 1. Email

| # | Option | Type | Default | Iface? | Impl? | Failure code | en.json? | Msg specific? | Params match? | I18N.md? | API.md? | Valid tests | Invalid tests | Issues |
|---|--------|------|---------|--------|-------|-------------|----------|--------------|--------------|----------|---------|------------|--------------|--------|
| 1 | label | string | — | Y | Y(createRule) | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 2 | emptyToUndefined | boolean | true | Y | Y(createRule) | base.required | Y | Y | Y | Y | Y | 0 | 1 | — |
| 3 | normalize | boolean | true | Y | Y | — | — | — | — | — | — | 3 | 0 | — |
| 4 | customFn | function | — | Y | Y(createRule) | email.custom | N | — | — | N | Y* | 0 | 0 | NOT IN EN.JSON; NOT IN I18N.MD; UNTESTED |
| 5 | length | Range | {max:254} | Y | **Partial** | base.max | Y | Y | Y | Y | Y | 0 | 0 | **length.min UNIMPLEMENTED**; UNTESTED VALID; UNTESTED INVALID |
| 6 | blockPlusAlias | boolean | false | Y | Y | email.plusAliasBlocked | Y | Y | Y | Y | Y | 1 | 1 | — |
| 7 | blockDomains | string[] | [] | Y | Y | email.domainBlocked | Y | Y | **N** | Y | Y | 1 | 1 | **PARAM MISMATCH: `{{domain}}` not passed** |
| 8 | allowDomains | string[] | [] | Y | Y | email.domainNotAllowed | Y | Y | **N** | Y | Y | 2 | 1 | **PARAM MISMATCH: `{{domain}}` not passed** |
| 9 | blockDisposable | boolean | false | Y | Y | email.disposableBlocked | Y | Y | Y | Y | Y | 1 | 1 | — |
| 10 | allowSubdomains | boolean | true | Y | Y | email.subdomainNotAllowed | Y | Y | Y | Y | Y | 1 | 1 | — |

---

### 2. PersonName

| # | Option | Type | Default | Iface? | Impl? | Failure code | en.json? | Msg specific? | Params match? | I18N.md? | API.md? | Valid tests | Invalid tests | Issues |
|---|--------|------|---------|--------|-------|-------------|----------|--------------|--------------|----------|---------|------------|--------------|--------|
| 1 | label | string | — | Y | Y(createRule) | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 2 | emptyToUndefined | boolean | true | Y | Y(createRule) | base.required | Y | Y | Y | Y | Y | 0 | 0 | UNTESTED INVALID |
| 3 | normalize | boolean | true | Y | Y | — | — | — | — | — | — | 1 | 0 | — |
| 4 | customFn | function | — | Y | Y(createRule) | personName.custom | N | — | — | N | Y* | 0 | 0 | NOT IN EN.JSON; NOT IN I18N.MD; UNTESTED |
| 5 | regex | RegExp | — | Y | Y | personName.invalid | Y | Y | Y | Y | Y | 1 | 1 | — |
| 6 | length | Range | {min:2,max:50} | Y | Y | base.min/base.max | Y | Y | Y | Y | Y | 0 | 2 | — |
| 7 | words | Range | {max:5} | Y | Y | personName.maxWords | Y | Y | Y(maximum) | Y | Y | 1 | 1 | — |
| 8 | allowUnicode | boolean | true | Y | Y | personName.invalid | Y | Y | Y | Y | Y | 1 | 1 | — |
| 9 | extraChars | string | — | Y | Y | — | — | — | — | — | — | 0 | 0 | UNTESTED VALID; UNTESTED INVALID |
| 10 | disallowChars | string | — | Y | Y | — | — | — | — | — | — | 0 | 0 | UNTESTED VALID; UNTESTED INVALID |
| 11 | boundary | Boundary | 'alpha' | Y | Y | personName.boundary | Y | Y | Y | Y | Y | 1 | 2 | — |
| 12 | consecutive | Range | {max:3} | Y | Y | personName.maxConsecutive | Y | Y | Y(maximum) | Y | Y | 2 | 2 | — |
| 13 | titleCase | boolean | false | Y | Y | — | — | — | — | — | — | 1 | 0 | — |

---

### 3. BusinessName

| # | Option | Type | Default | Iface? | Impl? | Failure code | en.json? | Msg specific? | Params match? | I18N.md? | API.md? | Valid tests | Invalid tests | Issues |
|---|--------|------|---------|--------|-------|-------------|----------|--------------|--------------|----------|---------|------------|--------------|--------|
| 1 | label | string | — | Y | Y(createRule) | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 2 | emptyToUndefined | boolean | true | Y | Y(createRule) | base.required | Y | Y | Y | Y | Y | 0 | 0 | UNTESTED INVALID |
| 3 | normalize | boolean | true | Y | Y | — | — | — | — | — | — | 1 | 0 | — |
| 4 | customFn | function | — | Y | Y(createRule) | businessName.custom | N | — | — | N | Y* | 0 | 0 | NOT IN EN.JSON; NOT IN I18N.MD; UNTESTED |
| 5 | regex | RegExp | — | Y | Y | businessName.invalid | Y | Y | Y | Y | Y | 1 | 1 | — |
| 6 | length | Range | {min:2,max:100} | Y | Y | base.min/base.max | Y | Y | Y | Y | Y | 0 | 2 | — |
| 7 | extraChars | string | — | Y | Y | — | — | — | — | — | — | 0 | 0 | UNTESTED VALID; UNTESTED INVALID |
| 8 | disallowChars | string | — | Y | Y | — | — | — | — | — | — | 0 | 0 | UNTESTED VALID; UNTESTED INVALID |
| 9 | boundary | Boundary | 'alphanumeric' | Y | Y | businessName.boundary | Y | Y | Y | Y | Y | 2 | 2 | — |
| 10 | consecutive | Range | {max:4} | Y | Y | businessName.maxConsecutive | Y | Y | Y(maximum) | Y | Y | 2 | 2 | — |
| 11 | titleCase | boolean | false | Y | Y | — | — | — | — | — | — | 1 | 0 | — |

---

### 4. Password

| # | Option | Type | Default | Iface? | Impl? | Failure code | en.json? | Msg specific? | Params match? | I18N.md? | API.md? | Valid tests | Invalid tests | Issues |
|---|--------|------|---------|--------|-------|-------------|----------|--------------|--------------|----------|---------|------------|--------------|--------|
| 1 | label | string | — | Y | Y(createRule) | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 2 | emptyToUndefined | boolean | true | Y | Y(createRule) | base.required | Y | Y | Y | Y | Y | 0 | 0 | UNTESTED INVALID |
| 3 | normalize | boolean | **false** | Y | Y | — | — | — | — | — | — | 2 | 0 | — |
| 4 | customFn | function | — | Y | Y(createRule) | password.custom | N | — | — | N | Y* | 0 | 0 | NOT IN EN.JSON; NOT IN I18N.MD; UNTESTED |
| 5 | length | Range | {min:8,max:128} | Y | Y | base.min/base.max | Y | Y | Y | Y | Y | 1 | 2 | — |
| 6 | uppercase | Range | {min:1} | Y | Y(min+max) | password.minUppercase / password.maxUppercase | Y | Y | Y(minimum/maximum) | Y | Y | 1 | 2 | — |
| 7 | lowercase | Range | {min:1} | Y | **Partial** | password.minLowercase | Y | Y | Y(minimum) | Y | Y | 0 | 1 | **lowercase.max UNIMPLEMENTED** |
| 8 | digits | Range | {min:1} | Y | **Partial** | password.minDigits | Y | Y | Y(minimum) | Y | Y | 0 | 1 | **digits.max UNIMPLEMENTED** |
| 9 | special | Range | {min:1} | Y | **Partial** | password.minSpecial | Y | Y | Y(minimum) | Y | Y | 0 | 1 | **special.max UNIMPLEMENTED** |
| 10 | consecutive | Range | {max:3} | Y | Y | password.maxConsecutive | Y | Y | Y(maximum) | Y | Y | 1 | 2 | — |
| 11 | blockCommon | boolean\|tier | false | Y | Y | password.commonBlocked | Y | Y | Y | Y | Y | 3 | 4 | — |

---

### 5. PasswordConfirmation

| # | Option | Type | Default | Iface? | Impl? | Failure code | en.json? | Msg specific? | Params match? | I18N.md? | API.md? | Valid tests | Invalid tests | Issues |
|---|--------|------|---------|--------|-------|-------------|----------|--------------|--------------|----------|---------|------------|--------------|--------|
| 1 | label | string | — | Y | Y(passthrough) | — | — | — | — | — | — | 1 | 0 | — |
| 2 | emptyToUndefined | boolean | true | Y | Y(passthrough) | base.required | Y | Y | Y | Y | Y | 0 | 1 | — |
| 3 | normalize | boolean | true | Y | Y(passthrough) | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 4 | customFn | function | — | Y | Y(passthrough) | confirmation.custom | N | — | — | N | Y* | 0 | 0 | NOT IN EN.JSON; NOT IN I18N.MD; UNTESTED |
| 5 | passwordField | string | 'password' | Y | **Metadata only** | — | — | — | — | — | — | 3 | 0 | Stored but not used by the rule itself; used by recipes/sameAs externally |

Note: `confirmation.mismatch` exists in en.json but is produced by the `sameAs` utility, not by this rule.

---

### 6. Phone

| # | Option | Type | Default | Iface? | Impl? | Failure code | en.json? | Msg specific? | Params match? | I18N.md? | API.md? | Valid tests | Invalid tests | Issues |
|---|--------|------|---------|--------|-------|-------------|----------|--------------|--------------|----------|---------|------------|--------------|--------|
| 1 | label | string | — | Y | Y(createRule) | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 2 | emptyToUndefined | boolean | true | Y | Y(createRule) | base.required | Y | Y | Y | Y | Y | 0 | 0 | UNTESTED INVALID |
| 3 | normalize | boolean | true | Y | **Partial** | — | — | — | — | — | — | 0 | 0 | **Always trims regardless**; normalize only controls output format |
| 4 | customFn | function | — | Y | Y(createRule) | phone.custom | N | — | — | N | Y* | 0 | 0 | NOT IN EN.JSON; NOT IN I18N.MD; UNTESTED |
| 5 | country | string | — | Y | Y | — | — | — | — | — | — | 1 | 0 | — |
| 6 | allowCountries | string[] | [] | Y | Y | phone.countryNotAllowed | Y | Y | **N** | Y | Y | 1 | 1 | **PARAM MISMATCH: `{{country}}` not passed** |
| 7 | blockCountries | string[] | [] | Y | Y | phone.countryBlocked | Y | Y | **N** | Y | Y | 1 | 1 | **PARAM MISMATCH: `{{country}}` not passed** |
| 8 | requireMobile | boolean | false | Y | Y | phone.requireMobile | Y | Y | Y | Y | Y | 0 | 0 | **UNTESTED VALID; UNTESTED INVALID** |
| 9 | requireCountryCode | boolean | false | Y | Y | phone.invalid | Y | N | Y | Y | Y | 1 | 1 | **GENERIC CODE**: uses `invalid` instead of a specific code |
| 10 | format | 'e164'\|'international'\|'national' | 'e164' | Y | Y | — | — | — | — | — | — | 3 | 0 | — |
| 11 | metadata | 'min'\|'mobile'\|'max'\|'custom' | — | Y | **N** | — | — | — | — | — | — | 0 | 0 | **UNIMPLEMENTED** |
| 12 | customMetadataPath | string | — | Y | **N** | — | — | — | — | — | — | 0 | 0 | **UNIMPLEMENTED** |

---

### 7. Website

| # | Option | Type | Default | Iface? | Impl? | Failure code | en.json? | Msg specific? | Params match? | I18N.md? | API.md? | Valid tests | Invalid tests | Issues |
|---|--------|------|---------|--------|-------|-------------|----------|--------------|--------------|----------|---------|------------|--------------|--------|
| 1 | label | string | — | Y | Y(createRule) | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 2 | emptyToUndefined | boolean | true | Y | Y(createRule) | base.required | Y | Y | Y | Y | Y | 0 | 0 | UNTESTED INVALID |
| 3 | normalize | boolean | true | Y | **N** | — | — | — | — | — | — | 3 | 0 | **UNIMPLEMENTED: always normalizes regardless** |
| 4 | customFn | function | — | Y | Y(createRule) | website.custom | N | — | — | N | Y* | 0 | 0 | NOT IN EN.JSON; NOT IN I18N.MD; UNTESTED |
| 5 | length | Range | {max:255} | Y | **Partial** | base.max | Y | Y | Y | Y | Y | 0 | 0 | **length.min UNIMPLEMENTED**; UNTESTED |
| 6 | requireWww | boolean | false | Y | Y | website.invalid | Y | N | Y | Y | Y | 1 | 1 | **GENERIC CODE** |
| 7 | requireHttps | boolean | false | Y | Y | website.invalid | Y | N | Y | Y | Y | 1 | 1 | **GENERIC CODE** |
| 8 | allowDomains | string[] | [] | Y | Y | website.domainNotAllowed | Y | Y | **N** | Y | Y | 2 | 1 | **PARAM MISMATCH: `{{domain}}` not passed** |
| 9 | blockDomains | string[] | [] | Y | Y | website.domainBlocked | Y | Y | **N** | Y | Y | 1 | 2 | **PARAM MISMATCH: `{{domain}}` not passed** |
| 10 | allowSubdomains | boolean | true | Y | Y | website.subdomainNotAllowed | Y | Y | Y | Y | Y | 2 | 1 | — |
| 11 | allowPath | boolean | true | Y | Y | website.invalid | Y | N | Y | Y | Y | 1 | 1 | **GENERIC CODE** |
| 12 | allowQuery | boolean | false | Y | Y | website.invalid | Y | N | Y | Y | Y | 1 | 1 | **GENERIC CODE** |

---

### 8. URL

| # | Option | Type | Default | Iface? | Impl? | Failure code | en.json? | Msg specific? | Params match? | I18N.md? | API.md? | Valid tests | Invalid tests | Issues |
|---|--------|------|---------|--------|-------|-------------|----------|--------------|--------------|----------|---------|------------|--------------|--------|
| 1 | label | string | — | Y | Y(createRule) | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 2 | emptyToUndefined | boolean | true | Y | Y(createRule) | base.required | Y | Y | Y | Y | Y | 0 | 0 | UNTESTED INVALID |
| 3 | normalize | boolean | true | Y | Y | — | — | — | — | — | — | 1 | 0 | — |
| 4 | customFn | function | — | Y | Y(createRule) | url.custom | N | — | — | N | Y* | 0 | 0 | NOT IN EN.JSON; NOT IN I18N.MD; UNTESTED |
| 5 | protocols | string[] | ['http','https'] | Y | Y | url.protocolNotAllowed | Y | Y | **N** | Y | Y | 4 | 2 | **PARAM MISMATCH: `{{protocol}}` not passed** |
| 6 | requireTLD | boolean | true | Y | Y | url.invalid | Y | N | Y | Y | Y | 2 | 1 | **GENERIC CODE** |
| 7 | length | Range | {max:2048} | Y | **Partial** | base.max | Y | Y | Y | Y | Y | 0 | 0 | **length.min UNIMPLEMENTED**; UNTESTED |
| 8 | allowDomains | string[] | [] | Y | Y | url.domainNotAllowed | Y | Y | **N** | Y | Y | 1 | 1 | **PARAM MISMATCH: `{{domain}}` not passed** |
| 9 | blockDomains | string[] | [] | Y | Y | url.domainBlocked | Y | Y | **N** | Y | Y | 1 | 2 | **PARAM MISMATCH: `{{domain}}` not passed** |
| 10 | allowQuery | boolean | true | Y | Y | url.invalid | Y | N | Y | Y | Y | 1 | 1 | **GENERIC CODE** |
| 11 | allowAuth | boolean | false | Y | Y | url.invalid | Y | N | Y | Y | Y | 1 | 2 | **GENERIC CODE** |

---

### 9. Username

| # | Option | Type | Default | Iface? | Impl? | Failure code | en.json? | Msg specific? | Params match? | I18N.md? | API.md? | Valid tests | Invalid tests | Issues |
|---|--------|------|---------|--------|-------|-------------|----------|--------------|--------------|----------|---------|------------|--------------|--------|
| 1 | label | string | — | Y | Y(createRule) | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 2 | emptyToUndefined | boolean | true | Y | Y(createRule) | base.required | Y | Y | Y | Y | Y | 0 | 0 | UNTESTED INVALID |
| 3 | normalize | boolean | true | Y | Y | — | — | — | — | — | — | 1 | 0 | — |
| 4 | customFn | function | — | Y | Y(createRule) | username.custom | N | — | — | N | Y* | 0 | 0 | NOT IN EN.JSON; NOT IN I18N.MD; UNTESTED |
| 5 | regex | RegExp | — | Y | Y | username.invalid | Y | Y | Y | Y | Y | 0 | 0 | UNTESTED (regex override specifically) |
| 6 | length | Range | {min:3,max:20} | Y | Y | base.min/base.max | Y | Y | Y | Y | Y | 1 | 2 | — |
| 7 | pattern | preset string | 'alphanumeric-underscore' | Y | Y | username.invalid | Y | Y | Y | Y | Y | 3 | 2 | — |
| 8 | extraChars | string | — | Y | Y | — | — | — | — | — | — | 1 | 0 | — |
| 9 | disallowChars | string | — | Y | Y | — | — | — | — | — | — | 0 | 1 | — |
| 10 | boundary | Boundary | 'alphanumeric' | Y | Y | username.boundary | Y | Y | Y | Y | Y | 2 | 2 | — |
| 11 | consecutive | Range | — | Y | Y | username.maxConsecutive | Y | Y | Y(maximum) | Y | Y | 1 | 1 | — |
| 12 | reservedWords | string[] | [] | Y | Y | username.reservedBlocked | Y | Y | **N** | Y | Y | 0 | 1 | **PARAM MISMATCH: `{{value}}` not passed** |
| 13 | blockReserved | boolean | false | Y | Y | username.reservedBlocked | Y | Y | **N** | Y | Y | 2 | 4 | **PARAM MISMATCH: `{{value}}` not passed** |
| 14 | ignoreCase | boolean | true | Y | Y | — | — | — | — | — | — | 2 | 0 | — |

---

### 10. Slug

| # | Option | Type | Default | Iface? | Impl? | Failure code | en.json? | Msg specific? | Params match? | I18N.md? | API.md? | Valid tests | Invalid tests | Issues |
|---|--------|------|---------|--------|-------|-------------|----------|--------------|--------------|----------|---------|------------|--------------|--------|
| 1 | label | string | — | Y | Y(createRule) | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 2 | emptyToUndefined | boolean | true | Y | Y(createRule) | base.required | Y | Y | Y | Y | Y | 0 | 0 | UNTESTED INVALID |
| 3 | normalize | boolean | true | Y | Y | — | — | — | — | — | — | 2 | 0 | — |
| 4 | customFn | function | — | Y | Y(createRule) | slug.custom | N | — | — | N | Y* | 0 | 0 | NOT IN EN.JSON; NOT IN I18N.MD; UNTESTED |
| 5 | regex | RegExp | — | Y | Y | slug.invalid | Y | Y | Y | Y | Y | 1 | 1 | — |
| 6 | length | Range | {min:3,max:100} | Y | Y | base.min/base.max | Y | Y | Y | Y | Y | 1 | 2 | — |
| 7 | extraChars | string | — | Y | Y | — | — | — | — | — | — | 3 | 1 | — |

---

### 11. PostalCode

| # | Option | Type | Default | Iface? | Impl? | Failure code | en.json? | Msg specific? | Params match? | I18N.md? | API.md? | Valid tests | Invalid tests | Issues |
|---|--------|------|---------|--------|-------|-------------|----------|--------------|--------------|----------|---------|------------|--------------|--------|
| 1 | label | string | — | Y | Y(createRule) | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 2 | emptyToUndefined | boolean | true | Y | Y(createRule) | base.required | Y | Y | Y | Y | Y | 0 | 1 | — |
| 3 | normalize | boolean | true | Y | Y | — | — | — | — | — | — | 2 | 0 | — |
| 4 | customFn | function | — | Y | Y(createRule) | postalCode.custom | N | — | — | N | Y* | 0 | 0 | NOT IN EN.JSON; NOT IN I18N.MD; UNTESTED |
| 5 | regex | RegExp | — | Y | Y | postalCode.invalid | Y | Y | Y | Y | Y | 2 | 1 | — |
| 6 | country | string | — (**required**) | Y | Y | postalCode.invalid | Y | Y | Y | Y | Y | 12 | 8 | **Silently fails at parse time if unsupported country** (spec says creation-time error) |

---

### 12. LicenseKey

| # | Option | Type | Default | Iface? | Impl? | Failure code | en.json? | Msg specific? | Params match? | I18N.md? | API.md? | Valid tests | Invalid tests | Issues |
|---|--------|------|---------|--------|-------|-------------|----------|--------------|--------------|----------|---------|------------|--------------|--------|
| 1 | label | string | — | Y | Y(createRule) | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 2 | emptyToUndefined | boolean | true | Y | Y(createRule) | base.required | Y | Y | Y | Y | Y | 0 | 0 | UNTESTED INVALID |
| 3 | normalize | boolean | true | Y | Y | — | — | — | — | — | — | 1 | 0 | — |
| 4 | customFn | function | — | Y | Y(createRule) | licenseKey.custom | N | — | — | N | Y* | 0 | 0 | NOT IN EN.JSON; NOT IN I18N.MD; UNTESTED |
| 5 | regex | RegExp | — | Y | Y | licenseKey.invalid | Y | Y | Y | Y | Y | 0 | 0 | UNTESTED (regex override specifically) |
| 6 | type | 'windows'\|'uuid'\|'custom' | 'custom' | Y | Y | licenseKey.invalid | Y | Y | Y | Y | Y | 1 | 1 | — |
| 7 | segments | number | 5 | Y | Y | licenseKey.invalid | Y | Y | Y | Y | Y | 1 | 0 | — |
| 8 | segmentLength | number | 5 | Y | Y | licenseKey.invalid | Y | Y | Y | Y | Y | 1 | 0 | — |
| 9 | separator | string | '-' | Y | Y | licenseKey.invalid | Y | Y | Y | Y | Y | 1 | 1 | — |
| 10 | charset | preset | 'alphanumeric' | Y | Y | licenseKey.invalid | Y | Y | Y | Y | Y | 3 | 1 | — |

---

### 13. UUID

| # | Option | Type | Default | Iface? | Impl? | Failure code | en.json? | Msg specific? | Params match? | I18N.md? | API.md? | Valid tests | Invalid tests | Issues |
|---|--------|------|---------|--------|-------|-------------|----------|--------------|--------------|----------|---------|------------|--------------|--------|
| 1 | label | string | — | Y | Y(createRule) | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 2 | emptyToUndefined | boolean | true | Y | Y(createRule) | base.required | Y | Y | Y | Y | Y | 0 | 0 | UNTESTED INVALID |
| 3 | normalize | boolean | true | Y | Y | — | — | — | — | — | — | 3 | 0 | — |
| 4 | customFn | function | — | Y | Y(createRule) | uuid.custom | N | — | — | N | Y* | 0 | 0 | NOT IN EN.JSON; NOT IN I18N.MD; UNTESTED |
| 5 | version | 1-8\|'any' | 'any' | Y | Y | uuid.invalid | Y | Y | Y | Y | Y | 5 | 2 | — |

---

### 14. JWT

| # | Option | Type | Default | Iface? | Impl? | Failure code | en.json? | Msg specific? | Params match? | I18N.md? | API.md? | Valid tests | Invalid tests | Issues |
|---|--------|------|---------|--------|-------|-------------|----------|--------------|--------------|----------|---------|------------|--------------|--------|
| 1 | label | string | — | Y | Y(createRule) | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 2 | emptyToUndefined | boolean | true | Y | Y(createRule) | base.required | Y | Y | Y | Y | Y | 0 | 1 | — |
| 3 | normalize | boolean | true | Y | Y | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 4 | customFn | function | — | Y | Y(createRule) | jwt.custom | N | — | — | N | Y* | 0 | 0 | NOT IN EN.JSON; NOT IN I18N.MD; UNTESTED |
| 5 | requireExpiry | boolean | false | Y | Y | jwt.invalid | Y | N | Y | Y | Y | 1 | 1 | **GENERIC CODE**: missing exp uses `invalid` not a specific code |
| 6 | checkExpiry | boolean | false | Y | Y | jwt.expired | Y | Y | Y | Y | Y | 1 | 1 | — |
| 7 | checkNotBefore | boolean | false | Y | Y | jwt.notYetValid | Y | Y | Y | Y | Y | 1 | 1 | — |
| 8 | clockTolerance | number | 0 | Y | Y | — | — | — | — | — | — | 1 | 1 | — |
| 9 | requireClaims | string[] | — | Y | Y | jwt.missingClaim | Y | Y | Y(claim) | Y | Y | 1 | 2 | — |
| 10 | allowAlgorithms | string[] | — | Y | Y | jwt.algorithmNotAllowed | Y | Y | Y(algorithm) | Y | Y | 1 | 1 | — |

---

### 15. DateTime

| # | Option | Type | Default | Iface? | Impl? | Failure code | en.json? | Msg specific? | Params match? | I18N.md? | API.md? | Valid tests | Invalid tests | Issues |
|---|--------|------|---------|--------|-------|-------------|----------|--------------|--------------|----------|---------|------------|--------------|--------|
| 1 | label | string | — | Y | Y(createRule) | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 2 | emptyToUndefined | boolean | true | Y | Y(createRule) | base.required | Y | Y | Y | Y | Y | 0 | 0 | UNTESTED INVALID |
| 3 | normalize | boolean | true | Y | Y | — | — | — | — | — | — | 1 | 0 | — |
| 4 | customFn | function | — | Y | Y(createRule) | dateTime.custom | N | — | — | N | Y* | 0 | 0 | NOT IN EN.JSON; NOT IN I18N.MD; UNTESTED |
| 5 | format | 'iso'\|'date'\|'time' | 'iso' | Y | Y | dateTime.invalid (via Zod) | Y | Y | Y | Y | Y | 7 | 9 | — |
| 6 | min | Date\|string | — | Y | Y | dateTime.tooEarly | Y | Y | Y(minimum) | Y | Y | 2 | 1 | — |
| 7 | max | Date\|string | — | Y | Y | dateTime.tooLate | Y | Y | Y(maximum) | Y | Y | 1 | 1 | — |
| 8 | allowFuture | boolean | true | Y | Y | dateTime.noFuture | Y | Y | Y | Y | Y | 1 | 1 | — |
| 9 | allowPast | boolean | true | Y | Y | dateTime.noPast | Y | Y | Y | Y | Y | 1 | 1 | — |
| 10 | allowOffset | boolean | true | Y | Y | — (Zod native) | — | — | — | — | — | 1 | 1 | — |
| 11 | allowLocal | boolean | false | Y | Y | — (Zod native) | — | — | — | — | — | 1 | 0 | — |
| 12 | precision | number | — | Y | Y | — (Zod native) | — | — | — | — | — | 2 | 1 | — |

---

### 16. Token

| # | Option | Type | Default | Iface? | Impl? | Failure code | en.json? | Msg specific? | Params match? | I18N.md? | API.md? | Valid tests | Invalid tests | Issues |
|---|--------|------|---------|--------|-------|-------------|----------|--------------|--------------|----------|---------|------------|--------------|--------|
| 1 | label | string | — | Y | Y(createRule) | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 2 | emptyToUndefined | boolean | true | Y | Y(createRule) | base.required | Y | Y | Y | Y | Y | 0 | 0 | UNTESTED INVALID |
| 3 | normalize | boolean | true | Y | Y | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 4 | customFn | function | — | Y | Y(createRule) | token.custom | N | — | — | N | Y* | 0 | 0 | NOT IN EN.JSON; NOT IN I18N.MD; UNTESTED |
| 5 | regex | RegExp | — | Y | Y | token.invalid | Y | Y | Y(type) | Y | Y | 0 | 0 | UNTESTED (regex override specifically) |
| 6 | type | TokenType | **required** | Y | Y | token.invalid | Y | Y | Y(type) | Y | Y | 6+ | 5+ | — |
| 7 | length | Range | varies by type | Y | Y | base.min/base.max | Y | Y | Y | Y | Y | 2 | 2 | — |

---

### 17. Text

| # | Option | Type | Default | Iface? | Impl? | Failure code | en.json? | Msg specific? | Params match? | I18N.md? | API.md? | Valid tests | Invalid tests | Issues |
|---|--------|------|---------|--------|-------|-------------|----------|--------------|--------------|----------|---------|------------|--------------|--------|
| 1 | label | string | — | Y | Y(createRule) | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 2 | emptyToUndefined | boolean | true | Y | Y(createRule) | base.required | Y | Y | Y | Y | Y | 0 | 0 | UNTESTED INVALID |
| 3 | normalize | boolean | true | Y | Y | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 4 | customFn | function | — | Y | Y(createRule) | text.custom | N | — | — | N | Y* | 0 | 0 | NOT IN EN.JSON; NOT IN I18N.MD; UNTESTED |
| 5 | regex | RegExp | — | Y | Y | text.invalid | Y | Y | Y | Y | Y | 2 | 2 | — |
| 6 | length | Range | — | Y | Y | base.min/base.max | Y | Y | Y | Y | Y | 2 | 2 | — |
| 7 | words | Range | — | Y | Y(max only) | text.maxWords | Y | Y | Y(maximum) | Y | Y | 1 | 1 | **words.min UNIMPLEMENTED** (only max wired) |
| 8 | consecutive | Range | — | Y | Y(max only) | text.maxConsecutive | Y | Y | Y(maximum) | Y | Y | 1 | 1 | — |
| 9 | noEmails | boolean | false | Y | Y | text.noEmails | Y | Y | Y | Y | Y | 1 | 1 | — |
| 10 | noUrls | boolean | false | Y | Y | text.noUrls | Y | Y | Y | Y | Y | 1 | 2 | — |
| 11 | noPhoneNumbers | boolean | false | Y | Y | text.noPhoneNumbers | Y | Y | Y | Y | Y | 1 | 1 | — |
| 12 | noHtml | boolean | false | Y | Y | text.noHtml | Y | Y | Y | Y | Y | 1 | 2 | — |

---

### 18. Country

| # | Option | Type | Default | Iface? | Impl? | Failure code | en.json? | Msg specific? | Params match? | I18N.md? | API.md? | Valid tests | Invalid tests | Issues |
|---|--------|------|---------|--------|-------|-------------|----------|--------------|--------------|----------|---------|------------|--------------|--------|
| 1 | label | string | — | Y | Y(createRule) | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 2 | emptyToUndefined | boolean | true | Y | Y(createRule) | base.required | Y | Y | Y | Y | Y | 0 | 1 | — |
| 3 | normalize | boolean | true | Y | Y | — | — | — | — | — | — | 2 | 1 | — |
| 4 | customFn | function | — | Y | Y(createRule) | country.custom | N | — | — | N | Y* | 0 | 0 | NOT IN EN.JSON; NOT IN I18N.MD; UNTESTED |
| 5 | format | 'alpha2'\|'alpha3' | 'alpha2' | Y | Y | country.invalid | Y | Y | Y | Y | Y | 12 | 11 | — |
| 6 | allowCountries | string[] | [] | Y | Y | country.notAllowed | Y | Y | **N** | Y | Y | 2 | 1 | **PARAM MISMATCH: `{{country}}` not passed** |
| 7 | blockCountries | string[] | [] | Y | Y | country.blocked | Y | Y | **N** | Y | Y | 1 | 1 | **PARAM MISMATCH: `{{country}}` not passed** |

---

### 19. Currency

| # | Option | Type | Default | Iface? | Impl? | Failure code | en.json? | Msg specific? | Params match? | I18N.md? | API.md? | Valid tests | Invalid tests | Issues |
|---|--------|------|---------|--------|-------|-------------|----------|--------------|--------------|----------|---------|------------|--------------|--------|
| 1 | label | string | — | Y | Y(createRule) | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 2 | emptyToUndefined | boolean | true | Y | Y(createRule) | base.required | Y | Y | Y | Y | Y | 0 | 1 | — |
| 3 | normalize | boolean | true | Y | Y | — | — | — | — | — | — | 2 | 1 | — |
| 4 | customFn | function | — | Y | Y(createRule) | currency.custom | N | — | — | N | Y* | 0 | 0 | NOT IN EN.JSON; NOT IN I18N.MD; UNTESTED |
| 5 | allowCurrencies | string[] | [] | Y | Y | currency.notAllowed | Y | Y | **N** | Y | Y | 2 | 1 | **PARAM MISMATCH: `{{currency}}` not passed** |
| 6 | blockCurrencies | string[] | [] | Y | Y | currency.blocked | Y | Y | **N** | Y | Y | 1 | 1 | **PARAM MISMATCH: `{{currency}}` not passed** |

---

### 20. Color

| # | Option | Type | Default | Iface? | Impl? | Failure code | en.json? | Msg specific? | Params match? | I18N.md? | API.md? | Valid tests | Invalid tests | Issues |
|---|--------|------|---------|--------|-------|-------------|----------|--------------|--------------|----------|---------|------------|--------------|--------|
| 1 | label | string | — | Y | Y(createRule) | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 2 | emptyToUndefined | boolean | true | Y | Y(createRule) | base.required | Y | Y | Y | Y | Y | 0 | 0 | UNTESTED INVALID |
| 3 | normalize | boolean | true | Y | Y | — | — | — | — | — | — | 1 | 0 | — |
| 4 | customFn | function | — | Y | Y(createRule) | color.custom | N | — | — | N | Y* | 0 | 0 | NOT IN EN.JSON; NOT IN I18N.MD; UNTESTED |
| 5 | format | 'hex'\|'rgb'\|'hsl'\|'any' | 'hex' | Y | Y | color.invalid | Y | Y | Y | Y | Y | 10+ | 10+ | — |
| 6 | alpha | boolean | true | Y | Y | color.invalid | Y | Y | Y | Y | Y | 4 | 4 | — |

---

### 21. CreditCard

| # | Option | Type | Default | Iface? | Impl? | Failure code | en.json? | Msg specific? | Params match? | I18N.md? | API.md? | Valid tests | Invalid tests | Issues |
|---|--------|------|---------|--------|-------|-------------|----------|--------------|--------------|----------|---------|------------|--------------|--------|
| 1 | label | string | — | Y | Y(createRule) | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 2 | emptyToUndefined | boolean | true | Y | Y(createRule) | base.required | Y | Y | Y | Y | Y | 0 | 1 | — |
| 3 | normalize | boolean | true | Y | Y | — | — | — | — | — | — | 3 | 0 | — |
| 4 | customFn | function | — | Y | Y(createRule) | creditCard.custom | N | — | — | N | Y* | 0 | 0 | NOT IN EN.JSON; NOT IN I18N.MD; UNTESTED |
| 5 | allowIssuers | IssuerType[] | — | Y | Y | creditCard.issuerNotAllowed | Y | Y | **N** | Y | Y | 1 | 2 | **PARAM MISMATCH: `{{issuer}}` not passed** |
| 6 | blockIssuers | IssuerType[] | — | Y | Y | creditCard.issuerBlocked | Y | Y | **N** | Y | Y | 2 | 1 | **PARAM MISMATCH: `{{issuer}}` not passed** |

---

### 22. IBAN

| # | Option | Type | Default | Iface? | Impl? | Failure code | en.json? | Msg specific? | Params match? | I18N.md? | API.md? | Valid tests | Invalid tests | Issues |
|---|--------|------|---------|--------|-------|-------------|----------|--------------|--------------|----------|---------|------------|--------------|--------|
| 1 | label | string | — | Y | Y(createRule) | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 2 | emptyToUndefined | boolean | true | Y | Y(createRule) | base.required | Y | Y | Y | Y | Y | 0 | 1 | — |
| 3 | normalize | boolean | true | Y | Y | — | — | — | — | — | — | 3 | 0 | — |
| 4 | customFn | function | — | Y | Y(createRule) | iban.custom | N | — | — | N | Y* | 0 | 0 | NOT IN EN.JSON; NOT IN I18N.MD; UNTESTED |
| 5 | allowCountries | string[] | [] | Y | Y | iban.countryNotAllowed | Y | Y | **N** | Y | Y | 2 | 1 | **PARAM MISMATCH: `{{country}}` not passed** |
| 6 | blockCountries | string[] | [] | Y | Y | iban.countryBlocked | Y | Y | **N** | Y | Y | 1 | 1 | **PARAM MISMATCH: `{{country}}` not passed** |

---

### 23. VatNumber

| # | Option | Type | Default | Iface? | Impl? | Failure code | en.json? | Msg specific? | Params match? | I18N.md? | API.md? | Valid tests | Invalid tests | Issues |
|---|--------|------|---------|--------|-------|-------------|----------|--------------|--------------|----------|---------|------------|--------------|--------|
| 1 | label | string | — | Y | Y(createRule) | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 2 | emptyToUndefined | boolean | true | Y | Y(createRule) | base.required | Y | Y | Y | Y | Y | 0 | 1 | — |
| 3 | normalize | boolean | true | Y | Y | — | — | — | — | — | — | 3 | 0 | — |
| 4 | customFn | function | — | Y | Y(createRule) | vatNumber.custom | N | — | — | N | Y* | 0 | 0 | NOT IN EN.JSON; NOT IN I18N.MD; UNTESTED |
| 5 | country | string | — | Y | Y | vatNumber.invalid | Y | Y | Y | Y | Y | 3 | 1 | — |
| 6 | requirePrefix | boolean | false | Y | Y | vatNumber.invalid | Y | N | Y | Y | Y | 1 | 1 | — |

---

### 24. MacAddress

| # | Option | Type | Default | Iface? | Impl? | Failure code | en.json? | Msg specific? | Params match? | I18N.md? | API.md? | Valid tests | Invalid tests | Issues |
|---|--------|------|---------|--------|-------|-------------|----------|--------------|--------------|----------|---------|------------|--------------|--------|
| 1 | label | string | — | Y | Y(createRule) | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 2 | emptyToUndefined | boolean | true | Y | Y(createRule) | base.required | Y | Y | Y | Y | Y | 0 | 0 | UNTESTED INVALID |
| 3 | normalize | boolean | true | Y | Y | — | — | — | — | — | — | 1 | 1 | — |
| 4 | customFn | function | — | Y | Y(createRule) | macAddress.custom | N | — | — | N | Y* | 0 | 0 | NOT IN EN.JSON; NOT IN I18N.MD; UNTESTED |
| 5 | delimiter | ':'\|'-'\|'none' | ':' | Y | Y | macAddress.invalid | Y | Y | Y | Y | Y | 4 | 3 | — |

---

### 25. IpAddress

| # | Option | Type | Default | Iface? | Impl? | Failure code | en.json? | Msg specific? | Params match? | I18N.md? | API.md? | Valid tests | Invalid tests | Issues |
|---|--------|------|---------|--------|-------|-------------|----------|--------------|--------------|----------|---------|------------|--------------|--------|
| 1 | label | string | — | Y | Y(createRule) | — | — | — | — | — | — | 0 | 0 | UNTESTED |
| 2 | emptyToUndefined | boolean | true | Y | Y(createRule) | base.required | Y | Y | Y | Y | Y | 0 | 0 | UNTESTED INVALID |
| 3 | normalize | boolean | true | Y | Y | — | — | — | — | — | — | 1 | 0 | — |
| 4 | customFn | function | — | Y | Y(createRule) | ipAddress.custom | N | — | — | N | Y* | 0 | 0 | NOT IN EN.JSON; NOT IN I18N.MD; UNTESTED |
| 5 | version | 'v4'\|'v6'\|'any' | 'any' | Y | Y | ipAddress.invalid | Y | Y | Y | Y | Y | 4 | 2 | — |
| 6 | allowCidr | boolean | false | Y | Y | — (uses Zod cidrv4/cidrv6) | — | — | — | — | — | 2 | 2 | — |
| 7 | allowPrivate | boolean | true | Y | Y | ipAddress.privateNotAllowed | Y | Y | Y | Y | Y | 3 | 5 | — |

---

## Summary Table

| Rule | Total options | Fully traced | Issues found |
|------|-------------|-------------|-------------|
| Email | 10 | 10 | 5 |
| PersonName | 13 | 13 | 3 |
| BusinessName | 11 | 11 | 3 |
| Password | 11 | 11 | 4 |
| PasswordConfirmation | 5 | 5 | 1 |
| Phone | 12 | 12 | 6 |
| Website | 12 | 12 | 8 |
| URL | 11 | 11 | 8 |
| Username | 14 | 14 | 2 |
| Slug | 7 | 7 | 1 |
| PostalCode | 6 | 6 | 2 |
| LicenseKey | 10 | 10 | 1 |
| UUID | 5 | 5 | 1 |
| JWT | 10 | 10 | 2 |
| DateTime | 12 | 12 | 1 |
| Token | 7 | 7 | 1 |
| Text | 12 | 12 | 2 |
| Country | 7 | 7 | 3 |
| Currency | 6 | 6 | 3 |
| Color | 6 | 6 | 1 |
| CreditCard | 6 | 6 | 3 |
| IBAN | 6 | 6 | 3 |
| VatNumber | 6 | 6 | 1 |
| MacAddress | 5 | 5 | 1 |
| IpAddress | 7 | 7 | 1 |
| **TOTAL** | **211** | **211** | **66** |

---

## Complete Issues List

| # | Rule | Option | Issue type | Description |
|---|------|--------|-----------|-------------|
| 1 | Email | length | UNIMPLEMENTED | `length.min` silently ignored — only `max` is wired |
| 2 | Email | length | UNTESTED VALID | Zero test cases for length option |
| 3 | Email | length | UNTESTED INVALID | Zero test cases for length option |
| 4 | Email | blockDomains | PARAM MISMATCH | en.json `{{domain}}` not passed in .refine() params |
| 5 | Email | allowDomains | PARAM MISMATCH | en.json `{{domain}}` not passed in .refine() params |
| 6 | PersonName | extraChars | UNTESTED VALID | Zero test cases |
| 7 | PersonName | extraChars | UNTESTED INVALID | Zero test cases |
| 8 | PersonName | disallowChars | UNTESTED VALID | Zero test cases |
| 9 | PersonName | disallowChars | UNTESTED INVALID | Zero test cases |
| 10 | BusinessName | extraChars | UNTESTED VALID | Zero test cases |
| 11 | BusinessName | extraChars | UNTESTED INVALID | Zero test cases |
| 12 | BusinessName | disallowChars | UNTESTED VALID | Zero test cases |
| 13 | BusinessName | disallowChars | UNTESTED INVALID | Zero test cases |
| 14 | Password | lowercase | UNIMPLEMENTED | `lowercase.max` silently ignored — only `min` is wired, no `applyMaxRefine` call |
| 15 | Password | digits | UNIMPLEMENTED | `digits.max` silently ignored — only `min` is wired |
| 16 | Password | special | UNIMPLEMENTED | `special.max` silently ignored — only `min` is wired |
| 17 | Phone | metadata | UNIMPLEMENTED | In interface, never read in build function; always uses min metadata |
| 18 | Phone | customMetadataPath | UNIMPLEMENTED | In interface, never read in build function |
| 19 | Phone | requireMobile | UNTESTED VALID | Zero test cases for this option |
| 20 | Phone | requireMobile | UNTESTED INVALID | Zero test cases for this option |
| 21 | Phone | requireCountryCode | GENERIC CODE | Uses `phone.invalid` instead of a specific code |
| 22 | Phone | allowCountries | PARAM MISMATCH | en.json `{{country}}` not passed in .refine() params |
| 23 | Phone | blockCountries | PARAM MISMATCH | en.json `{{country}}` not passed in .refine() params |
| 24 | Phone | normalize | UNIMPLEMENTED | Always trims via `z.string().trim()` regardless of `normalize` value |
| 25 | Website | normalize | UNIMPLEMENTED | `normalizeWebsiteInput()` always runs (trim+lowercase+prepend) regardless of `normalize` option |
| 26 | Website | length | UNIMPLEMENTED | `length.min` silently ignored — only `max` is wired |
| 27 | Website | length | UNTESTED VALID | Zero test cases for length option |
| 28 | Website | length | UNTESTED INVALID | Zero test cases for length option |
| 29 | Website | requireWww | GENERIC CODE | Uses `website.invalid` instead of a specific code |
| 30 | Website | requireHttps | GENERIC CODE | Uses `website.invalid` instead of a specific code |
| 31 | Website | allowPath | GENERIC CODE | Uses `website.invalid` instead of a specific code |
| 32 | Website | allowQuery | GENERIC CODE | Uses `website.invalid` instead of a specific code |
| 33 | Website | blockDomains | PARAM MISMATCH | en.json `{{domain}}` not passed in .refine() params |
| 34 | Website | allowDomains | PARAM MISMATCH | en.json `{{domain}}` not passed in .refine() params |
| 35 | URL | protocols | PARAM MISMATCH | en.json `{{protocol}}` not passed in .refine() params |
| 36 | URL | requireTLD | GENERIC CODE | Uses `url.invalid` instead of a specific code |
| 37 | URL | length | UNIMPLEMENTED | `length.min` silently ignored — only `max` is wired |
| 38 | URL | length | UNTESTED VALID | Zero test cases for length option |
| 39 | URL | length | UNTESTED INVALID | Zero test cases for length option |
| 40 | URL | allowDomains | PARAM MISMATCH | en.json `{{domain}}` not passed in .refine() params |
| 41 | URL | blockDomains | PARAM MISMATCH | en.json `{{domain}}` not passed in .refine() params |
| 42 | URL | allowQuery | GENERIC CODE | Uses `url.invalid` instead of a specific code |
| 43 | URL | allowAuth | GENERIC CODE | Uses `url.invalid` instead of a specific code |
| 44 | Username | reservedBlocked/reservedWords | PARAM MISMATCH | en.json `{{value}}` not passed in .refine() params |
| 45 | PostalCode | country | WRONG BEHAVIOR | Unsupported country fails at parse time, spec says creation-time error |
| 46 | JWT | requireExpiry | GENERIC CODE | Missing `exp` uses `jwt.invalid` instead of a specific code like `jwt.missingExpiry` |
| 47 | Text | words | UNIMPLEMENTED | `words.min` silently ignored — only `max` is wired |
| 48 | Country | allowCountries | PARAM MISMATCH | en.json `{{country}}` not passed in .refine() params |
| 49 | Country | blockCountries | PARAM MISMATCH | en.json `{{country}}` not passed in .refine() params |
| 50 | Currency | allowCurrencies | PARAM MISMATCH | en.json `{{currency}}` not passed in .refine() params |
| 51 | Currency | blockCurrencies | PARAM MISMATCH | en.json `{{currency}}` not passed in .refine() params |
| 52 | CreditCard | allowIssuers | PARAM MISMATCH | en.json `{{issuer}}` not passed in .refine() params |
| 53 | CreditCard | blockIssuers | PARAM MISMATCH | en.json `{{issuer}}` not passed in .refine() params |
| 54 | IBAN | allowCountries | PARAM MISMATCH | en.json `{{country}}` not passed in .refine() params |
| 55 | IBAN | blockCountries | PARAM MISMATCH | en.json `{{country}}` not passed in .refine() params |
| 56 | (all 25) | customFn | NOT IN EN.JSON | `{namespace}.custom` code has no en.json template |
| 57 | (all 25) | customFn | NOT IN I18N.MD | `{namespace}.custom` code not in I18N.md parameter table |
| 58 | (all 25) | customFn | UNTESTED | No rule test file has a customFn test case |
| 59 | (all 25) | label | UNTESTED | Almost no rule test verifies label appears in error messages |
| 60 | (global) | string namespace | DEAD CODE | 8 codes in en.json/I18N.md/API.md never produced by any rule |
| 61 | (docs) | I18N.md | DOC MISMATCH | JWT label is "Token" in I18N.md template, "JWT" in en.json |

### Issue breakdown by type

| Issue type | Count |
|-----------|-------|
| PARAM MISMATCH | 18 |
| UNIMPLEMENTED (option in interface, partially or fully ignored) | 10 |
| GENERIC CODE (uses `invalid` instead of specific code) | 9 |
| UNTESTED VALID/INVALID (zero test cases for specific option) | 14 |
| NOT IN EN.JSON / NOT IN I18N.MD (customFn systemic) | 2 (x25 rules) |
| DEAD CODE (string namespace) | 8 codes |
| DOC MISMATCH | 1 |
| WRONG BEHAVIOR | 1 |
