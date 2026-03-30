// ==============================================================================
// IP ADDRESS RULE
// Validates IPv4 and IPv6 addresses with optional CIDR and privacy controls.
// ==============================================================================

import type { BaseRuleOptions } from '../types'
import { z } from 'zod'
import { createRule } from '../core/createRule'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * IpAddressOptions
 * Configuration options for the ipAddress validation rule.
 */
export interface IpAddressOptions extends BaseRuleOptions {
  /** IP version to accept: v4, v6, or any. */
  readonly version?: 'v4' | 'v6' | 'any' | undefined
  /** Whether CIDR notation (e.g., /24) is accepted. */
  readonly allowCidr?: boolean | undefined
  /** Whether private/reserved addresses are accepted. */
  readonly allowPrivate?: boolean | undefined
}

// ----------------------------------------------------------
// PRIVATE RANGE HELPERS
// ----------------------------------------------------------

/**
 * Is Private IPv4
 * Checks whether an IPv4 address falls within a private or reserved range.
 *
 * @param ip - The IPv4 address string (without CIDR suffix).
 * @returns True if the address is private or reserved.
 */
function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  const first = parts[0] ?? -1
  const second = parts[1] ?? -1
  if (first === 10)
    return true
  if (first === 172 && second >= 16 && second <= 31)
    return true
  if (first === 192 && second === 168)
    return true
  if (first === 127)
    return true
  if (first === 0)
    return true
  return false
}

/**
 * Is Private IPv6
 * Checks whether an IPv6 address falls within a private or reserved range.
 *
 * @param ip - The IPv6 address string (without CIDR suffix).
 * @returns True if the address is private or reserved.
 */
function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase()
  if (lower === '::1')
    return true
  if (lower.startsWith('fc') || lower.startsWith('fd'))
    return true
  if (lower.startsWith('fe80'))
    return true
  if (lower === '::')
    return true
  return false
}

/**
 * Strip CIDR Suffix
 * Removes the /prefix portion from an IP string if present.
 *
 * @param ip - The IP address string, possibly with CIDR notation.
 * @returns The IP address without the CIDR suffix.
 */
function stripCidr(ip: string): string {
  const slashIndex = ip.indexOf('/')
  return slashIndex === -1 ? ip : ip.slice(0, slashIndex)
}

// ----------------------------------------------------------
// SCHEMA BUILDERS
// ----------------------------------------------------------

/**
 * Build V4 Schema
 * Constructs a Zod schema for IPv4 with optional CIDR support.
 *
 * @param allowCidr  - Whether to accept CIDR notation.
 * @param normalize  - Whether to apply trim normalization.
 * @returns A Zod schema for IPv4 addresses.
 */
function buildV4Schema(allowCidr: boolean, normalize: boolean): z.ZodType {
  const base = normalize ? z.string().trim() : z.string()
  return allowCidr
    ? base.cidrv4()
    : base.ipv4()
}

/**
 * Build V6 Schema
 * Constructs a Zod schema for IPv6 with optional CIDR support.
 *
 * @param allowCidr  - Whether to accept CIDR notation.
 * @param normalize  - Whether to apply trim normalization.
 * @returns A Zod schema for IPv6 addresses.
 */
function buildV6Schema(allowCidr: boolean, normalize: boolean): z.ZodType {
  const base = normalize ? z.string().trim() : z.string()
  return allowCidr
    ? base.cidrv6()
    : base.ipv6()
}

/**
 * Build Any Version Schema
 * Constructs a string schema with a refine that accepts either IPv4 or IPv6.
 * Avoids z.union to preserve correct error codes for undefined/empty values.
 *
 * @param allowCidr  - Whether to accept CIDR notation.
 * @param normalize  - Whether to apply trim normalization.
 * @returns A Zod schema for any IP address version.
 */
function buildAnyVersionSchema(allowCidr: boolean, normalize: boolean): z.ZodType {
  const v4 = buildV4Schema(allowCidr, normalize)
  const v6 = buildV6Schema(allowCidr, normalize)
  const base = normalize ? z.string().trim() : z.string()

  return base.refine(
    (v: unknown): boolean => v4.safeParse(v).success || v6.safeParse(v).success,
    { params: { code: 'invalid', namespace: 'ipAddress' } },
  )
}

/**
 * Apply Private Refinement
 * Adds a refinement that rejects private/reserved IP addresses.
 *
 * @param schema  - The base Zod schema to refine.
 * @param version - The IP version constraint.
 * @returns The schema with the private-range refinement applied.
 */
function applyPrivateRefinement(
  schema: z.ZodType,
  version: 'v4' | 'v6' | 'any',
): z.ZodType {
  return schema.refine(
    (v: unknown): boolean => {
      const bare = stripCidr(v as string)
      if (version === 'v4')
        return !isPrivateIpv4(bare)
      if (version === 'v6')
        return !isPrivateIpv6(bare)
      // 'any': check based on whether it contains a colon (IPv6 indicator)
      return bare.includes(':')
        ? !isPrivateIpv6(bare)
        : !isPrivateIpv4(bare)
    },
    { params: { code: 'privateNotAllowed', namespace: 'ipAddress' } },
  )
}

// ----------------------------------------------------------
// RULE FACTORY
// ----------------------------------------------------------

/**
 * IP Address
 * Validates that a string is a valid IP address, with optional version
 * filtering, CIDR notation support, and private range restriction.
 *
 * @param options - Per-call ipAddress validation options.
 * @returns A Zod schema that validates IP address strings.
 */
export const ipAddress = /* @__PURE__ */ createRule<IpAddressOptions>({
  name: 'ipAddress',
  defaults: {},
  messages: {
    invalid: '{{label}} is not a valid IP address',
    privateNotAllowed: 'Private IP addresses are not allowed',
  },
  build: (opts: IpAddressOptions): unknown => {
    const version = opts.version ?? 'any'
    const allowCidr = opts.allowCidr === true
    const normalize = opts.normalize !== false

    let schema: z.ZodType

    switch (version) {
      case 'v4':
        schema = buildV4Schema(allowCidr, normalize)
        break
      case 'v6':
        schema = buildV6Schema(allowCidr, normalize)
        break
      case 'any':
        schema = buildAnyVersionSchema(allowCidr, normalize)
        break
    }

    if (opts.allowPrivate === false) {
      schema = applyPrivateRefinement(schema, version)
    }

    return schema
  },
})
