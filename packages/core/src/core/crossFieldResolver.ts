// ==============================================================================
// CROSS-FIELD RESOLVER
// Resolves sameAs and requiredWhen constraints after Zod parsing.
// ==============================================================================

import { z } from 'zod'

import { getConfig } from '../config/store'
import { fieldNameToLabel } from '../internal/fieldLabel'
import { getCrossField } from './crossFieldRegistry'
import { getErrorMessage } from './errorMap'

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * IssueRecord
 * Lightweight cross-field issue for merging into results.
 */
export interface IssueRecord {
  readonly path: readonly (string | number)[]
  readonly message: string
}

// ----------------------------------------------------------
// HELPERS
// ----------------------------------------------------------

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
export function resolveCrossFieldConstraints(
  schema: z.ZodObject,
  parsedData: Record<string, unknown> | undefined,
  fieldErrors: ReadonlySet<string>,
  rawData: unknown,
  prefix: ReadonlyArray<string> = [],
): IssueRecord[] {
  // SAFETY: Zod 4 z.object().shape is always a Record<string, ZodType>
  const shape = schema.shape as Record<string, z.ZodType>
  // SAFETY: type-checked above; non-object inputs produce empty Record
  const rawObj = (typeof rawData === 'object' && rawData !== null) ? rawData as Record<string, unknown> : {}
  const issues: IssueRecord[] = []

  for (const fieldName of Object.keys(shape)) {
    issues.push(...resolveFieldConstraint(fieldName, shape, parsedData, rawObj, fieldErrors, prefix))
  }

  for (const [fieldName, fieldSchema] of Object.entries(shape)) {
    if (fieldSchema instanceof z.ZodObject) {
      // SAFETY: nested parsed data mirrors schema shape; ZodObject children produce Record
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
