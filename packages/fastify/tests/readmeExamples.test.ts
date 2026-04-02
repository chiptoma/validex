// ==============================================================================
// README EXAMPLES — FASTIFY ADAPTER VERIFICATION TESTS
// Ensures Fastify adapter code examples in README.md use the real validex API.
// ==============================================================================

import { describe, expect, it } from 'vitest'

// ----------------------------------------------------------
// SUBPATH EXPORTS — FASTIFY
// ----------------------------------------------------------

describe('rEADME — Subpath exports (fastify)', () => {
  it('@validex/fastify exports work', async () => {
    const { validexPlugin, validateData } = await import('../src')
    expect(typeof validexPlugin).toBe('function')
    expect(typeof validateData).toBe('function')
  })
})
