// ==============================================================================
// ERROR MAP
// English default messages for all validex error codes.
// ------------------------------------------------------------------------------
// NOTE: Messages are sourced from src/locales/en.json (single source of truth).
// ==============================================================================

import type { ErrorParams } from '../types'
import enLocale from '../locales/en.json'

// ----------------------------------------------------------
// CONSTANTS
// ----------------------------------------------------------

const TEMPLATE_PARAM_RE = /\{\{(\w+)\}\}/g

// ----------------------------------------------------------
// MESSAGE CATALOG
// ----------------------------------------------------------

/**
 * MESSAGE_MAP
 * Maps namespace to code to English template with {{param}} interpolation.
 * Built from en.json at import time.
 *
 * @type {Record<string, Record<string, string>>}
 */
// SAFETY: en.json messages are a two-level Record of namespace to code to template string
export const MESSAGE_MAP: Record<string, Record<string, string>>
  = enLocale.validation.messages as Record<string, Record<string, string>>

// ----------------------------------------------------------
// FUNCTIONS
// ----------------------------------------------------------

/**
 * Get Error Message
 * Looks up the message template and interpolates parameters.
 *
 * @param namespace - Error namespace (e.g. 'email').
 * @param code     - Error code (e.g. 'invalid').
 * @param params   - Interpolation parameters.
 * @returns The interpolated English message string.
 */
export function getErrorMessage(
  namespace: string,
  code: string,
  params: Partial<ErrorParams> & Record<string, unknown> = {},
): string {
  const nsMap = MESSAGE_MAP[namespace]
  const template = nsMap?.[code] ?? MESSAGE_MAP['base']?.['format'] ?? ''
  return template.replace(TEMPLATE_PARAM_RE, (_match, key: string) => {
    const value = params[key]
    return value !== undefined && value !== null ? String(value) : `{{${key}}}`
  })
}

/**
 * Build Message Key
 * Constructs the full i18n key for a given error.
 *
 * @param prefix    - Key prefix (e.g. 'validation').
 * @param separator - Separator between segments (e.g. '.').
 * @param namespace - Error namespace (e.g. 'email').
 * @param code      - Error code (e.g. 'disposableBlocked').
 * @returns The full i18n key string.
 */
export function buildMessageKey(
  prefix: string,
  separator: string,
  namespace: string,
  code: string,
): string {
  return [prefix, 'messages', namespace, code].join(separator)
}

/**
 * Register Messages
 * Adds or overrides messages for a namespace in the runtime catalog.
 *
 * @param namespace - The namespace to register messages under.
 * @param messages  - A record of code to message template strings.
 */
export function registerMessages(
  namespace: string,
  messages: Readonly<Record<string, string>>,
): void {
  const existing = MESSAGE_MAP[namespace]
  MESSAGE_MAP[namespace] = { ...existing, ...messages }
}
