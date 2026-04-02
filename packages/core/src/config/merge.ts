// ==============================================================================
// THREE-TIER MERGE
// Deep merge logic for defaults → globals → per-call options.
// ==============================================================================

/**
 * Is Plain Object
 * Checks if a value is a plain object (not array, null, or other type).
 *
 * @param value - The value to check.
 * @returns True if the value is a plain object.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value)
    && !(value instanceof RegExp)
    && !(value instanceof Date)
}

/**
 * Deep Merge Two
 * Merges two objects with three-tier semantics.
 * - Absent key: inherits from base
 * - Key present with value: overrides base
 * - Key present with undefined: intentionally removes (does not inherit)
 * - Arrays: replaced entirely (not concatenated)
 * - Nested objects: merged recursively
 *
 * @param base      - The base object (lower priority).
 * @param override  - The override object (higher priority).
 * @returns The deeply merged result.
 */
export function deepMergeTwo(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...base }

  for (const key of Object.keys(override)) {
    const overrideValue = override[key]

    if (overrideValue === undefined) {
      delete result[key] // intentional removal per three-tier merge semantics
      continue
    }

    const baseValue = base[key]

    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      result[key] = deepMergeTwo(baseValue, overrideValue)
    }
    else {
      result[key] = overrideValue
    }
  }

  return result
}

/**
 * Merge Three Tiers
 * Merges defaults → globals → per-call options using three-tier semantics.
 *
 * @param defaults - Tier 1: built-in defaults.
 * @param globals  - Tier 2: global config from setup().
 * @param perCall  - Tier 3: per-call overrides.
 * @returns The fully merged options.
 */
export function mergeThreeTiers(
  defaults: Record<string, unknown>,
  globals: Record<string, unknown>,
  perCall: Record<string, unknown>,
): Record<string, unknown> {
  const afterGlobals = deepMergeTwo(defaults, globals)
  return deepMergeTwo(afterGlobals, perCall)
}
