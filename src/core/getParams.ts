// ==============================================================================
// GET PARAMS
// Extracts validex ErrorParams from a Zod issue.
// ==============================================================================

import type { ErrorParams } from '../types'
import { getConfig } from '../config/store'
import { buildMessageKey } from './errorMap'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * ZodIssueInput
 * Minimal shape of a Zod issue used for parameter extraction.
 */
interface ZodIssueInput {
  readonly code?: string | undefined
  readonly path?: ReadonlyArray<string | number> | undefined
  readonly minimum?: unknown
  readonly maximum?: unknown
  readonly expected?: string | undefined
  readonly received?: string | undefined
  readonly input?: unknown
  readonly format?: string | undefined
  readonly params?: Readonly<Record<string, unknown>> | undefined
}

/**
 * NativeMapping
 * Result of mapping a Zod native error code to validex namespace and code.
 */
interface NativeMapping {
  readonly namespace: string
  readonly code: string
}

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

const CAMEL_SPLIT_RE = /([a-z])([A-Z])/g
const SEPARATOR_RE = /[_-]/g
const WORD_START_RE = /\b\w/g

/**
 * To Title Case
 * Converts a camelCase or snake_case field name to Title Case.
 *
 * @param str - The field name string.
 * @returns The title-cased label string.
 */
function toTitleCase(str: string): string {
  return str
    .replace(CAMEL_SPLIT_RE, '$1 $2')
    .replace(SEPARATOR_RE, ' ')
    .replace(WORD_START_RE, c => c.toUpperCase())
}

/**
 * Map Native Code
 * Maps a Zod native issue code to a validex namespace and code.
 *
 * @param issue - The Zod issue to map.
 * @returns The namespace and code mapping, or undefined if not mappable.
 */
function mapNativeCode(issue: ZodIssueInput): NativeMapping | undefined {
  const issueCode = issue.code
  if (issueCode === undefined)
    return undefined
  const ns = 'base'
  const mapping: Record<string, () => NativeMapping> = {
    too_small: () => issue.minimum === 1
      ? { namespace: ns, code: 'required' }
      : { namespace: ns, code: 'min' },
    too_big: () => ({ namespace: ns, code: 'max' }),
    invalid_type: () => issue.received === 'undefined' || issue.input === undefined
      ? { namespace: ns, code: 'required' }
      : { namespace: ns, code: 'type' },
    invalid_format: () => ({ namespace: ns, code: 'format' }),
    invalid_string: () => ({ namespace: ns, code: 'format' }),
  }
  const factory = mapping[issueCode]
  return factory !== undefined ? factory() : undefined
}

/**
 * Derive Label
 * Derives a human-readable label from the issue path.
 *
 * @param path          - The field path array.
 * @param explicitLabel - An explicitly provided label, if any.
 * @returns The resolved label string.
 */
function deriveLabel(
  path: ReadonlyArray<string | number>,
  explicitLabel?: string,
): string {
  if (explicitLabel !== undefined)
    return explicitLabel
  const config = getConfig()
  const fallback = config.label?.fallback ?? 'derived'
  if (fallback === 'none')
    return ''
  if (fallback === 'generic')
    return 'This field'
  const last = path.at(-1)
  if (last === undefined)
    return 'This field'
  return typeof last === 'string' ? toTitleCase(last) : `Item ${String(last)}`
}

// ----------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------

/**
 * Get Params
 * Extracts validex ErrorParams from a Zod issue object.
 *
 * @param issue - A Zod issue (typed loosely for forward compatibility).
 * @returns The normalized ErrorParams for the issue.
 */
export function getParams(issue: ZodIssueInput): ErrorParams {
  const path: ReadonlyArray<string | number> = issue.path ?? []
  const params = issue.params ?? {}

  const validexCode = params['code'] as string | undefined
  const validexNs = params['namespace'] as string | undefined

  const hasValidex = validexCode !== undefined && validexNs !== undefined
  const native = hasValidex ? undefined : mapNativeCode(issue)

  const namespace = validexNs ?? native?.namespace ?? 'base'
  const code = validexCode ?? native?.code ?? 'format'

  const explicitLabel = params['label'] as string | undefined
  const label = deriveLabel(path, explicitLabel)

  const config = getConfig()
  const i18n = config.i18n
  const prefix = i18n.prefix ?? 'validation'
  const separator = i18n.separator ?? '.'
  const key = buildMessageKey(prefix, separator, namespace, code)

  const extra: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(params)) {
    if (k !== 'code' && k !== 'namespace' && k !== 'label') {
      extra[k] = v
    }
  }

  if (issue.minimum !== undefined)
    extra['minimum'] = issue.minimum
  if (issue.maximum !== undefined)
    extra['maximum'] = issue.maximum
  if (issue.expected !== undefined)
    extra['expected'] = issue.expected

  const base = {
    code,
    namespace,
    label,
    key,
    path,
    ...extra,
  }

  if (i18n.enabled) {
    const labelKey = [prefix, 'fields', ...path.map(String)].join(separator)
    return { ...base, labelKey }
  }

  return base
}
