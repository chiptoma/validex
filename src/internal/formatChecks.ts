// ==============================================================================
// FORMAT CHECKS
// Cached Zod format-check schemas shared across multiple rules.
// ==============================================================================

import { z } from 'zod'

/** Cached Zod URL format check schema, shared by url and website rules. */
export const URL_FORMAT_CHECK = z.string().url()
