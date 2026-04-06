// ==============================================================================
// VALIDEX CONSUMER SMOKE TEST
// Tests the built package from a real consumer perspective.
// No test framework — uses console.log and process.exit(1) on failure.
// ==============================================================================

// ========================================
// Section 1: All imports resolve
// ========================================

import {
  // Config
  setup, getConfig, preloadData, resetConfig,
  // Core
  validate, getParams, createRule,
  // All 25 rules
  Email, PersonName, BusinessName, Password, PasswordConfirmation,
  Phone, Website, Url, Username, Slug,
  PostalCode, LicenseKey, Uuid, Jwt, DateTime,
  Token, Text, Country, Currency, Color,
  CreditCard, Iban, VatNumber, MacAddress, IpAddress,
  // Pure check functions
  hasUppercase, hasLowercase, hasDigits, hasSpecial,
  containsEmail, containsUrl, containsHtml, containsPhoneNumber,
  onlyAlpha, onlyNumeric, onlyAlphanumeric,
  onlyAlphaSpaceHyphen, onlyAlphanumericSpaceHyphen,
  maxWords, minWords, maxConsecutive, noSpaces,
  toTitleCase, toSlug, stripHtml, collapseWhitespace,
  emptyToUndefined,
  // Utilities
  sameAs, requiredWhen,
} from '@validex/core'
import { z } from 'zod'

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

let passed = 0
let failed = 0

function assert(condition: boolean, msg: string): void {
  if (!condition) {
    console.log(`  ❌ FAIL: ${msg}`)
    failed++
  } else {
    passed++
  }
}

function section(name: string): void {
  console.log(`\n📋 ${name}`)
}

// ========================================
// Section 1: Verify imports
// ========================================

section('Section 1: All imports resolve')

const exports = [
  setup, getConfig, preloadData, resetConfig,
  validate, getParams, createRule,
  Email, PersonName, BusinessName, Password, PasswordConfirmation,
  Phone, Website, Url, Username, Slug,
  PostalCode, LicenseKey, Uuid, Jwt, DateTime,
  Token, Text, Country, Currency, Color,
  CreditCard, Iban, VatNumber, MacAddress, IpAddress,
  hasUppercase, hasLowercase, hasDigits, hasSpecial,
  containsEmail, containsUrl, containsHtml, containsPhoneNumber,
  onlyAlpha, onlyNumeric, onlyAlphanumeric,
  onlyAlphaSpaceHyphen, onlyAlphanumericSpaceHyphen,
  maxWords, minWords, maxConsecutive, noSpaces,
  toTitleCase, toSlug, stripHtml, collapseWhitespace,
  emptyToUndefined,
  sameAs, requiredWhen,
]
assert(exports.length === 56, `All 56 exports defined (got ${exports.length})`)
assert(exports.every(e => e !== undefined), 'No undefined exports')

// ========================================
// Section 2: Rules with defaults
// ========================================

section('Section 2: All 25 rules with defaults')

const rulesWithDefaults = [
  Email(), PersonName(), BusinessName(), Password(), PasswordConfirmation(),
  Phone(), Website(), Url(), Username(), Slug(),
  PostalCode({ country: 'US' }), LicenseKey(), Uuid(), Jwt(), DateTime(),
  Token({ type: 'hex' }), Text(), Country(), Currency(), Color(),
  CreditCard(), Iban(), VatNumber(), MacAddress(), IpAddress(),
]
assert(rulesWithDefaults.length === 25, `25 rule schemas (got ${rulesWithDefaults.length})`)
for (const schema of rulesWithDefaults) {
  assert(typeof schema.safeParse === 'function', 'Schema has safeParse method')
}

// ========================================
// Section 3: Error messages are validex-owned
// ========================================

section('Section 3: Error messages are validex-owned')

const emailSchema = Email() as z.ZodType
const emailResult = emailSchema.safeParse('not-email')
assert(!emailResult.success, 'Invalid email rejected')
if (!emailResult.success) {
  const msg = emailResult.error.issues[0]?.message ?? ''
  assert(!msg.includes('Invalid input'), 'No raw Zod "Invalid input" message')
}

// ========================================
// Section 4: Chainable check methods
// ========================================

section('Section 4: Chainable check methods')

assert(hasUppercase('Hello', 1) === true, 'hasUppercase works')
assert(hasLowercase('Hello', 1) === true, 'hasLowercase works')
assert(hasDigits('abc123', 2) === true, 'hasDigits works')
assert(containsEmail('test@example.com') === true, 'containsEmail works')
assert(maxConsecutive('aab', 2) === true, 'maxConsecutive works')
assert(maxConsecutive('aaab', 2) === false, 'maxConsecutive rejects')
assert(noSpaces('hello') === true, 'noSpaces works')
assert(onlyAlpha('abc') === true, 'onlyAlpha works')
assert(onlyNumeric('123') === true, 'onlyNumeric works')

// ========================================
// Section 5: Config
// ========================================

section('Section 5: Config')

setup({ rules: { email: { blockPlusAlias: true } } })
const config = getConfig()
assert(config !== undefined, 'getConfig returns config')
resetConfig()

// ========================================
// Section 6: Pure check functions
// ========================================

section('Section 6: Pure check functions')

assert(toTitleCase('hello world') === 'Hello World', 'toTitleCase works')
assert(toSlug('Hello World') === 'hello-world', 'toSlug works')
assert(stripHtml('<b>bold</b>') === 'bold', 'stripHtml works')
assert(collapseWhitespace('a  b') === 'a b', 'collapseWhitespace works')

// ========================================
// Section 7: Validate function
// ========================================

section('Section 7: Validate function')

const schema = z.object({
  email: Email() as z.ZodType,
})

const valid = await validate(schema, { email: 'user@example.com' })
assert(valid.success === true, 'Valid data passes')
assert(valid.data !== undefined, 'Valid result has data')

const invalid = await validate(schema, { email: 'bad' })
assert(invalid.success === false, 'Invalid data fails')
assert(Object.keys(invalid.errors).length > 0, 'Invalid result has errors')

// ========================================
// Section 8: Subpath imports
// ========================================

section('Section 8: Subpath imports')

const checks = await import('@validex/core/checks')
assert(typeof checks.hasUppercase === 'function', '@validex/core/checks works')

const utilities = await import('@validex/core/utilities')
assert(typeof utilities.sameAs === 'function', '@validex/core/utilities works')

// ========================================
// Section 9: getParams
// ========================================

section('Section 9: getParams')

const params = getParams({
  code: 'custom',
  path: ['email'],
  params: { code: 'invalid', namespace: 'email' },
})
assert(params.key === 'validation.messages.email.invalid', 'getParams key correct')
assert(params.namespace === 'email', 'getParams namespace correct')

// ========================================
// Section 10: createRule
// ========================================

section('Section 10: createRule')

interface TestOptions {
  label?: string
  emptyToUndefined?: boolean
  normalize?: boolean
  customFn?: (value: string) => true | string | Promise<true | string>
}

const TestRule = createRule<TestOptions>({
  name: 'test',
  defaults: {},
  build: () => z.string().min(3),
  messages: { invalid: '{{label}} is not valid' },
})
const testSchema = TestRule() as z.ZodType
assert(testSchema.safeParse('abc').success === true, 'createRule schema works')
assert(testSchema.safeParse('ab').success === false, 'createRule validation works')

// ========================================
// Section 11: Type compilation
// ========================================

section('Section 11: Type compilation')

assert(typeof Email === 'function', 'Email is callable')
assert(typeof validate === 'function', 'validate is callable')
assert(typeof sameAs === 'function', 'sameAs is callable')
assert(typeof requiredWhen === 'function', 'requiredWhen is callable')

// ========================================
// Section 12: emptyToUndefined
// ========================================

section('Section 12: emptyToUndefined')

assert(emptyToUndefined('hello') === 'hello', 'Non-empty passes through')
assert(emptyToUndefined('') === undefined, 'Empty becomes undefined')
assert(emptyToUndefined('  ') === '  ', 'Whitespace-only passes through (not empty)')

// ========================================
// Section 13: @validex/nuxt imports
// ========================================

section('Section 13: @validex/nuxt imports')

const nuxt = await import('@validex/nuxt')
assert(typeof nuxt.useValidation === 'function', 'useValidation is a function')
assert(typeof nuxt.setupValidex === 'function', 'setupValidex is a function')

// ========================================
// Section 14: @validex/fastify imports
// ========================================

section('Section 14: @validex/fastify imports')

const fastify = await import('@validex/fastify')
assert(typeof fastify.validexPlugin === 'function', 'validexPlugin is a function')
assert(typeof fastify.validateData === 'function', 'validateData is a function')

// ========================================
// SUMMARY
// ========================================

console.log('\n' + '='.repeat(50))
console.log(`✅ Passed: ${passed}`)
console.log(`❌ Failed: ${failed}`)
console.log('='.repeat(50))

if (failed > 0) {
  process.exit(1)
}
