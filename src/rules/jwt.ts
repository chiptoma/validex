// ==============================================================================
// JWT RULE
// Validates JSON Web Token structure, claims, and temporal constraints.
// ------------------------------------------------------------------------------
// Decodes header and payload (without signature verification) to check
// algorithm, expiry, not-before, and required claims.
// ==============================================================================

import type { BaseRuleOptions } from '../types'
import { z } from 'zod'
import { createRule } from '../core/createRule'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * JWTOptions
 * Configuration options for the JWT validation rule.
 */
export interface JWTOptions extends BaseRuleOptions {
  /** Require the exp claim to be present. */
  readonly requireExpiry?: boolean | undefined
  /** Validate that the token has not expired. */
  readonly checkExpiry?: boolean | undefined
  /** Validate that the token nbf claim is satisfied. */
  readonly checkNotBefore?: boolean | undefined
  /** Clock tolerance in seconds for temporal checks. */
  readonly clockTolerance?: number | undefined
  /** Require specific claims to be present in the payload. */
  readonly requireClaims?: readonly string[] | undefined
  /** Restrict allowed signing algorithms. */
  readonly allowAlgorithms?: readonly string[] | undefined
}

/**
 * JwtParts
 * Decoded JWT header and payload.
 */
interface JwtParts {
  readonly header: Record<string, unknown>
  readonly payload: Record<string, unknown>
}

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

const BASE64URL_HYPHEN_RE = /-/g
const BASE64URL_UNDERSCORE_RE = /_/g

/**
 * Base64 URL Decode
 * Decodes a base64url-encoded string to a UTF-8 string.
 *
 * @param str - The base64url-encoded string.
 * @returns The decoded UTF-8 string.
 */
function base64UrlDecode(str: string): string {
  let base64 = str.replace(BASE64URL_HYPHEN_RE, '+').replace(BASE64URL_UNDERSCORE_RE, '/')
  const padding = base64.length % 4
  if (padding === 2)
    base64 += '=='
  else if (padding === 3)
    base64 += '='
  return atob(base64)
}

/**
 * Decode JWT Parts
 * Splits a JWT and decodes header and payload from base64url.
 *
 * @param value - The raw JWT string.
 * @returns Decoded header and payload, or null if decoding fails.
 */
function decodeJwtParts(value: string): JwtParts | null {
  const segments = value.split('.')
  if (segments.length !== 3)
    return null

  try {
    const headerStr = segments[0] ?? ''
    const payloadStr = segments[1] ?? ''
    const header = JSON.parse(base64UrlDecode(headerStr)) as Record<string, unknown>
    const payload = JSON.parse(base64UrlDecode(payloadStr)) as Record<string, unknown>
    return { header, payload }
  }
  catch {
    return null
  }
}

/**
 * Is Expired
 * Checks whether a JWT payload exp claim is in the past.
 *
 * @param payload   - The decoded JWT payload.
 * @param tolerance - Clock tolerance in seconds.
 * @returns True if the token has expired.
 */
function isExpired(
  payload: Record<string, unknown>,
  tolerance: number,
): boolean {
  const exp = payload['exp']
  if (typeof exp !== 'number')
    return true
  const now = Math.floor(Date.now() / 1000)
  return exp <= now - tolerance
}

/**
 * Is Not Yet Valid
 * Checks whether a JWT payload nbf claim is in the future.
 *
 * @param payload   - The decoded JWT payload.
 * @param tolerance - Clock tolerance in seconds.
 * @returns True if the token is not yet valid.
 */
function isNotYetValid(
  payload: Record<string, unknown>,
  tolerance: number,
): boolean {
  const nbf = payload['nbf']
  if (typeof nbf !== 'number')
    return false
  const now = Math.floor(Date.now() / 1000)
  return nbf > now + tolerance
}

/**
 * Validate Algorithm
 * Adds an issue if the JWT header algorithm is not in the allowed list.
 *
 * @param header     - The decoded JWT header.
 * @param algorithms - The allowed algorithm list.
 * @param ctx        - The Zod refinement context.
 */
function validateAlgorithm(
  header: Record<string, unknown>,
  algorithms: readonly string[],
  ctx: z.RefinementCtx,
): void {
  const alg = header['alg']
  if (typeof alg !== 'string' || !algorithms.includes(alg)) {
    ctx.addIssue({
      code: 'custom',
      params: {
        code: 'algorithmNotAllowed',
        namespace: 'jwt',
        algorithm: String(alg ?? 'unknown'),
      },
    })
  }
}

/**
 * Validate Claims
 * Adds an issue for each required claim missing from the payload.
 *
 * @param payload - The decoded JWT payload.
 * @param claims  - The required claim names.
 * @param ctx     - The Zod refinement context.
 */
function validateClaims(
  payload: Record<string, unknown>,
  claims: readonly string[],
  ctx: z.RefinementCtx,
): void {
  for (const claim of claims) {
    if (payload[claim] === undefined) {
      ctx.addIssue({
        code: 'custom',
        params: { code: 'missingClaim', namespace: 'jwt', claim },
      })
    }
  }
}

/**
 * Validate Temporal
 * Checks expiry, not-before, and requireExpiry constraints on a payload.
 *
 * @param payload - The decoded JWT payload.
 * @param opts    - The JWT validation options.
 * @param ctx     - The Zod refinement context.
 */
function validateTemporal(
  payload: Record<string, unknown>,
  opts: Pick<JWTOptions, 'requireExpiry' | 'checkExpiry' | 'checkNotBefore' | 'clockTolerance'>,
  ctx: z.RefinementCtx,
): void {
  const tolerance = opts.clockTolerance ?? 0

  if (opts.requireExpiry === true && payload['exp'] === undefined) {
    ctx.addIssue({
      code: 'custom',
      params: { code: 'invalid', namespace: 'jwt' },
    })
  }

  if (opts.checkExpiry === true && isExpired(payload, tolerance)) {
    ctx.addIssue({
      code: 'custom',
      params: { code: 'expired', namespace: 'jwt' },
    })
  }

  if (opts.checkNotBefore === true && isNotYetValid(payload, tolerance)) {
    ctx.addIssue({
      code: 'custom',
      params: { code: 'notYetValid', namespace: 'jwt' },
    })
  }
}

// ----------------------------------------------------------
// RULE FACTORY
// ----------------------------------------------------------

/**
 * JWT
 * Validates that a string is a structurally valid JWT and optionally
 * checks expiry, not-before, required claims, and allowed algorithms.
 *
 * @param options - Per-call JWT validation options.
 * @returns A Zod schema that validates JWT strings.
 */
export const jwt = /* @__PURE__ */ createRule<JWTOptions>({
  name: 'jwt',
  defaults: {},
  messages: {
    invalid: '{{label}} is not a valid JWT',
    expired: 'This token has expired',
    notYetValid: 'This token is not yet valid',
    missingClaim: 'Required claim \'{{claim}}\' is missing',
    algorithmNotAllowed: 'Algorithm \'{{algorithm}}\' is not allowed',
  },
  build: (opts: JWTOptions): z.ZodType => {
    const schema = opts.normalize !== false ? z.string().trim() : z.string()

    return schema.superRefine((value: string, ctx) => {
      const parts = decodeJwtParts(value)
      if (!parts) {
        ctx.addIssue({
          code: 'custom',
          params: { code: 'invalid', namespace: 'jwt' },
        })
        return
      }

      const { header, payload } = parts

      if (opts.allowAlgorithms && opts.allowAlgorithms.length > 0) {
        validateAlgorithm(header, opts.allowAlgorithms, ctx)
      }

      validateTemporal(payload, opts, ctx)

      if (opts.requireClaims && opts.requireClaims.length > 0) {
        validateClaims(payload, opts.requireClaims, ctx)
      }
    })
  },
})
