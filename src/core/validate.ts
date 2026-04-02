// ==============================================================================
// VALIDATE
// Wraps Zod's safeParseAsync into a structured ValidationResult.
// Resolves cross-field constraints (sameAs, requiredWhen) after Zod parsing.
// ==============================================================================

import type { NestedErrors, ValidationResult } from '../types'
import { z } from 'zod'

import { getConfig } from '../config/store'
import { fieldNameToLabel } from '../internal/fieldLabel'
import { getCrossField } from './crossFieldRegistry'
import { ensureCustomError } from './customError'
import { getErrorMessage } from './errorMap'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * IssueRecord
 * Lightweight cross-field issue for merging into results.
 */
interface IssueRecord {
  readonly path: readonly (string | number)[]
  readonly message: string
}

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

/**
 * Build Dot Path
 * Joins a Zod issue path into a dot-separated string.
 *
 * @param path - Array of string or number path segments.
 * @returns A dot-separated path string (e.g. "billing.email").
 */
function buildDotPath(path: readonly (string | number)[]): string {
  return path.map(String).join('.')
}

/**
 * Build Nested Errors
 * Transforms a flat list of issues into a nested error object.
 *
 * @param issues - Array of issues with path and message.
 * @returns A recursively nested error object.
 */
function buildNestedErrors(
  issues: ReadonlyArray<{ readonly path: readonly (string | number)[], readonly message: string }>,
): NestedErrors {
  const root: Record<string, unknown> = {}

  for (const issue of issues) {
    const { path, message } = issue
    if (path.length === 0)
      continue

    let current: Record<string, unknown> = root
    for (let i = 0; i < path.length - 1; i++) {
      const segment = String(path[i])
      if (current[segment] === undefined)
        current[segment] = {}
      // SAFETY: nested object created above; always a Record at this point
      current = current[segment] as Record<string, unknown>
    }

    const lastSegment = String(path.at(-1))
    const existing = current[lastSegment]
    if (Array.isArray(existing))
      existing.push(message)
    else
      current[lastSegment] = [message]
  }

  // SAFETY: root is built to match NestedErrors shape; leaf values are string[] by construction
  return root as NestedErrors
}

/**
 * Derive Field Label
 * Derives a label for a field, mirroring the getParams logic.
 *
 * @param fieldName     - The field name in the schema shape.
 * @param explicitLabel - Explicit label from the schema's cross-field meta.
 * @param prefix        - Parent path prefix for nested schemas.
 * @returns The resolved label string.
 */
function deriveFieldLabel(fieldName: string, explicitLabel?: string, prefix?: ReadonlyArray<string>): string {
  if (explicitLabel !== undefined)
    return explicitLabel

  const config = getConfig()
  const fallback = config.label?.fallback ?? 'derived'

  let defaultLabel: string
  if (fallback === 'none')
    defaultLabel = ''
  else if (fallback === 'generic')
    defaultLabel = 'This field'
  else
    defaultLabel = fieldNameToLabel(fieldName)

  if (config.label?.transform !== undefined) {
    const path = [...(prefix ?? []), fieldName]
    return config.label.transform({ path, fieldName, defaultLabel })
  }

  return defaultLabel
}

/**
 * Resolve Cross Field Message
 * Builds the error message for a cross-field issue, respecting i18n mode.
 *
 * @param namespace - Error namespace (e.g. 'confirmation').
 * @param code      - Error code (e.g. 'mismatch').
 * @param params    - Interpolation params including label and targetLabel.
 * @returns The resolved message string.
 */
function resolveCrossFieldMessage(
  namespace: string,
  code: string,
  params: Record<string, unknown>,
): string {
  const config = getConfig()
  const i18n = config.i18n
  const pfx = i18n.prefix ?? 'validation'
  const sep = i18n.separator ?? '.'
  const key = [pfx, 'messages', namespace, code].join(sep)

  if (i18n.enabled && i18n.t !== undefined)
    return i18n.t(key, params)
  if (i18n.enabled)
    return key
  return getErrorMessage(namespace, code, params)
}

/**
 * Collect Issues Into Maps
 * Merges an array of issues into errors/firstErrors maps.
 *
 * @param issues      - Issues to collect.
 * @param errors      - Mutable errors map.
 * @param firstErrors - Mutable firstErrors map.
 */
function collectIssues(
  issues: ReadonlyArray<IssueRecord>,
  errors: Record<string, string[]>,
  firstErrors: Record<string, string>,
): void {
  for (const issue of issues) {
    const dotPath = buildDotPath(issue.path)
    if (errors[dotPath] === undefined) {
      errors[dotPath] = []
      firstErrors[dotPath] = issue.message
    }
    errors[dotPath].push(issue.message)
  }
}

// ----------------------------------------------------------
// SAME-AS RESOLUTION
// ----------------------------------------------------------

/**
 * Resolve Same As
 * Checks a single field's sameAs constraint against parsed data.
 *
 * @param fieldName  - The field with the sameAs constraint.
 * @param sameAs     - The target field name to match.
 * @param shape      - The z.object shape for target validation.
 * @param parsedData - The parsed data to compare.
 * @param meta       - Cross-field metadata for the source field.
 * @param meta.label
 * @param prefix     - Path prefix for nested schemas.
 * @returns An IssueRecord if mismatch, or undefined.
 */
function resolveSameAs(
  fieldName: string,
  sameAs: string,
  shape: Record<string, z.ZodType>,
  parsedData: Record<string, unknown> | undefined,
  meta: { readonly label?: string | undefined },
  prefix: ReadonlyArray<string>,
): IssueRecord | undefined {
  if (!(sameAs in shape)) {
    throw new Error(
      `validex: sameAs("${sameAs}") on field "${fieldName}" — target field "${sameAs}" does not exist in the schema`,
    )
  }

  const sourceValue = parsedData?.[fieldName]
  const targetValue = parsedData?.[sameAs]
  if (sourceValue === targetValue)
    return undefined

  const targetSchema = shape[sameAs]
  const targetMeta = targetSchema !== undefined ? getCrossField(targetSchema) : undefined
  const label = deriveFieldLabel(fieldName, meta.label, prefix)
  const targetLabel = deriveFieldLabel(sameAs, targetMeta?.label, prefix)

  return {
    path: [...prefix, fieldName],
    message: resolveCrossFieldMessage('confirmation', 'mismatch', {
      label,
      targetLabel,
      code: 'mismatch',
      namespace: 'confirmation',
    }),
  }
}

// ----------------------------------------------------------
// REQUIRED-WHEN RESOLUTION
// ----------------------------------------------------------

/**
 * Resolve Required When
 * Checks a single field's requiredWhen constraint.
 *
 * @param fieldName    - The field with the requiredWhen constraint.
 * @param targetName   - The field that triggers requirement.
 * @param parsedData   - Parsed data for checking target value.
 * @param rawObj       - Raw input for checking source value.
 * @param fieldErrors  - Set of dot-paths with errors.
 * @param meta         - Cross-field metadata for the source field.
 * @param meta.label
 * @param prefix       - Path prefix for nested schemas.
 * @returns An IssueRecord if requirement unmet, or undefined.
 */
function resolveRequiredWhen(
  fieldName: string,
  targetName: string,
  parsedData: Record<string, unknown> | undefined,
  rawObj: Record<string, unknown>,
  fieldErrors: ReadonlySet<string>,
  meta: { readonly label?: string | undefined },
  prefix: ReadonlyArray<string>,
): IssueRecord | undefined {
  const targetDotPath = [...prefix, targetName].join('.')
  if (fieldErrors.has(targetDotPath))
    return undefined

  const targetValue = parsedData?.[targetName]
  if (targetValue === undefined || targetValue === null || targetValue === '')
    return undefined

  const rawValue = rawObj[fieldName]
  if (rawValue !== undefined && rawValue !== null && rawValue !== '')
    return undefined

  const label = deriveFieldLabel(fieldName, meta.label, prefix)
  return {
    path: [...prefix, fieldName],
    message: resolveCrossFieldMessage('base', 'required', {
      label,
      code: 'required',
      namespace: 'base',
    }),
  }
}

// ----------------------------------------------------------
// CROSS-FIELD RESOLUTION
// ----------------------------------------------------------

/**
 * Resolve Field Constraint
 * Checks a single field for sameAs or requiredWhen constraints.
 *
 * @param fieldName   - The field name to check.
 * @param shape       - The z.object shape.
 * @param parsedData  - Parsed data.
 * @param rawObj      - Raw input object.
 * @param fieldErrors - Set of dot-paths with errors.
 * @param prefix      - Path prefix.
 * @returns Array of issues for this field.
 */
function resolveFieldConstraint(
  fieldName: string,
  shape: Record<string, z.ZodType>,
  parsedData: Record<string, unknown> | undefined,
  rawObj: Record<string, unknown>,
  fieldErrors: ReadonlySet<string>,
  prefix: ReadonlyArray<string>,
): IssueRecord[] {
  const fieldSchema = shape[fieldName]
  if (fieldSchema === undefined)
    return []
  const meta = getCrossField(fieldSchema)
  if (meta === undefined)
    return []

  const issues: IssueRecord[] = []
  const dotPath = [...prefix, fieldName].join('.')

  if (meta.sameAs !== undefined && !fieldErrors.has(dotPath)) {
    const issue = resolveSameAs(fieldName, meta.sameAs, shape, parsedData, meta, prefix)
    if (issue !== undefined)
      issues.push(issue)
  }

  if (meta.requiredWhen !== undefined) {
    const issue = resolveRequiredWhen(fieldName, meta.requiredWhen, parsedData, rawObj, fieldErrors, meta, prefix)
    if (issue !== undefined)
      issues.push(issue)
  }

  return issues
}

/**
 * Resolve Cross Field Constraints
 * Inspects z.object shape fields for sameAs/requiredWhen metadata.
 *
 * @param schema      - The Zod object schema.
 * @param parsedData  - Successfully parsed data (may be partial).
 * @param fieldErrors - Set of dot-paths that already have errors.
 * @param rawData     - The original raw input data.
 * @param prefix      - Parent path prefix for nested schemas.
 * @returns Array of additional cross-field issues.
 */
function resolveCrossFieldConstraints(
  schema: z.ZodObject,
  parsedData: Record<string, unknown> | undefined,
  fieldErrors: ReadonlySet<string>,
  rawData: unknown,
  prefix: ReadonlyArray<string> = [],
): IssueRecord[] {
  // SAFETY: Zod 4 z.object().shape is always a Record<string, ZodType>
  const shape = schema.shape as Record<string, z.ZodType>
  const rawObj = (typeof rawData === 'object' && rawData !== null) ? rawData as Record<string, unknown> : {}
  const issues: IssueRecord[] = []

  for (const fieldName of Object.keys(shape)) {
    issues.push(...resolveFieldConstraint(fieldName, shape, parsedData, rawObj, fieldErrors, prefix))
  }

  for (const [fieldName, fieldSchema] of Object.entries(shape)) {
    if (fieldSchema instanceof z.ZodObject) {
      const nestedParsed = parsedData?.[fieldName] as Record<string, unknown> | undefined
      issues.push(...resolveCrossFieldConstraints(
        fieldSchema,
        nestedParsed,
        fieldErrors,
        rawObj[fieldName],
        [...prefix, fieldName],
      ))
    }
  }

  return issues
}

// ----------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------

/**
 * Validate
 * Runs Zod's safeParseAsync, resolves cross-field constraints (sameAs,
 * requiredWhen), and returns a structured ValidationResult.
 *
 * @param schema - The Zod schema to validate against.
 * @param data   - The unknown data to validate.
 * @returns A promise resolving to a typed ValidationResult.
 */
export async function validate<T extends z.ZodType>(
  schema: T,
  data: unknown,
): Promise<ValidationResult<z.output<T>>> {
  ensureCustomError()
  const result = await schema.safeParseAsync(data)

  if (result.success)
    return handleSuccess(schema, result.data, data)

  return handleFailure(schema, result.error, data)
}

/**
 * Handle Success
 * Handles the success path, including cross-field checks.
 *
 * @param schema - The Zod schema.
 * @param parsed - The parsed data.
 * @param raw    - The raw input data.
 * @returns A ValidationResult (success or failure from cross-field checks).
 */
function handleSuccess<T extends z.ZodType>(
  schema: T,
  parsed: unknown,
  raw: unknown,
): ValidationResult<z.output<T>> {
  if (schema instanceof z.ZodObject) {
    // SAFETY: result.data is the parsed output of a z.object schema
    const crossIssues = resolveCrossFieldConstraints(schema, parsed as Record<string, unknown>, new Set(), raw)
    if (crossIssues.length > 0) {
      const errors: Record<string, string[]> = {}
      const firstErrors: Record<string, string> = {}
      collectIssues(crossIssues, errors, firstErrors)
      return { success: false, errors, firstErrors, nestedErrors: buildNestedErrors(crossIssues), issues: crossIssues }
    }
  }

  return {
    success: true,
    data: parsed as z.output<T>, // SAFETY: Zod safeParseAsync returns inferred output type on success
    errors: {},
    firstErrors: {},
    nestedErrors: {},
    issues: [],
  }
}

/**
 * Handle Failure
 * Handles the failure path, including cross-field checks on partial data.
 *
 * @param schema - The Zod schema.
 * @param error  - The Zod error.
 * @param raw    - The raw input data.
 * @returns A failure ValidationResult.
 */
function handleFailure<T extends z.ZodType>(
  schema: T,
  error: z.ZodError,
  raw: unknown,
): ValidationResult<z.output<T>> {
  // SAFETY: Zod issues always carry path and message; cast narrows the opaque issue type
  const rawIssues = error.issues as ReadonlyArray<{
    readonly path: readonly (string | number)[]
    readonly message: string
  }>

  const errors: Record<string, string[]> = {}
  const firstErrors: Record<string, string> = {}
  const fieldErrors = new Set<string>()

  for (const issue of rawIssues) {
    const dotPath = buildDotPath(issue.path)
    fieldErrors.add(dotPath)
    if (errors[dotPath] === undefined) {
      errors[dotPath] = []
      firstErrors[dotPath] = issue.message
    }
    errors[dotPath].push(issue.message)
  }

  if (schema instanceof z.ZodObject) {
    // SAFETY: raw input cast to Record for field access; non-object inputs produce empty parsed
    const rawObj = (typeof raw === 'object' && raw !== null) ? raw as Record<string, unknown> : {}
    const crossIssues = resolveCrossFieldConstraints(schema, rawObj, fieldErrors, raw)
    collectIssues(crossIssues, errors, firstErrors)

    if (crossIssues.length > 0) {
      const allIssues = [...rawIssues, ...crossIssues]
      return { success: false, errors, firstErrors, nestedErrors: buildNestedErrors(allIssues), issues: allIssues }
    }
  }

  return {
    success: false,
    errors,
    firstErrors,
    nestedErrors: buildNestedErrors(rawIssues),
    // SAFETY: issues escape hatch exposes raw Zod issues as ReadonlyArray<unknown> for consumers
    issues: error.issues as ReadonlyArray<unknown>,
  }
}
