// ==============================================================================
// CROSS-FIELD REGISTRY
// WeakMap-based metadata store for cross-field validation (sameAs, requiredWhen).
// ==============================================================================

// ----------------------------------------------------------
// TYPES
// ----------------------------------------------------------

/**
 * CrossFieldMeta
 * Metadata attached to a schema for cross-field resolution in validate().
 */
interface CrossFieldMeta {
  /** Field name that this schema's value must match. */
  readonly sameAs?: string | undefined
  /** Field name — when that field has a value, this field becomes required. */
  readonly requiredWhen?: string | undefined
  /** Explicit label from rule options, used for targetLabel derivation. */
  readonly label?: string | undefined
}

// ----------------------------------------------------------
// REGISTRY
// ----------------------------------------------------------

const registry = new WeakMap<object, CrossFieldMeta>()

// ----------------------------------------------------------
// PUBLIC API
// ----------------------------------------------------------

/**
 * Register Cross Field
 * Stores cross-field metadata on a schema object.
 *
 * @param schema - The Zod schema to annotate.
 * @param meta   - The cross-field metadata.
 */
export function registerCrossField(schema: object, meta: CrossFieldMeta): void {
  registry.set(schema, meta)
}

/**
 * Get Cross Field
 * Retrieves cross-field metadata from a schema object.
 *
 * @param schema - The Zod schema to query.
 * @returns The cross-field metadata, or undefined if none registered.
 */
export function getCrossField(schema: object): CrossFieldMeta | undefined {
  return registry.get(schema)
}
