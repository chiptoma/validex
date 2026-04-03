// ==============================================================================
// ERROR MAP
// English default messages for all validex error codes.
// ------------------------------------------------------------------------------
// NOTE: Messages are sourced from src/locales/en.json (single source of truth).
// ==============================================================================

import type { ErrorParams, PathTransform } from '../types'

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
 * Constructs the full i18n key for a given error. The pathMode controls
 * how the field path is encoded into the key.
 *
 * @param prefix    - Key prefix (e.g. 'validation').
 * @param separator - Separator between segments (e.g. '.').
 * @param namespace - Error namespace (e.g. 'email').
 * @param code      - Error code (e.g. 'disposableBlocked').
 * @param pathMode  - How field paths are embedded in the key.
 * @param path      - The field path segments.
 * @returns The full i18n key string.
 */
export function buildMessageKey(
  prefix: string,
  separator: string,
  namespace: string,
  code: string,
  pathMode: 'semantic' | 'key' | 'full' | PathTransform = 'semantic',
  path: ReadonlyArray<string | number> = [],
): string {
  if (typeof pathMode === 'function') {
    const transformed = pathMode(path)
    return [prefix, 'messages', transformed, namespace, code].join(separator)
  }
  if (pathMode === 'key' && path.length > 0) {
    const last = String(path.at(-1))
    return [prefix, 'messages', last, namespace, code].join(separator)
  }
  if (pathMode === 'full' && path.length > 0) {
    const pathSegments = path.map(String)
    return [prefix, 'messages', ...pathSegments, namespace, code].join(separator)
  }
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
