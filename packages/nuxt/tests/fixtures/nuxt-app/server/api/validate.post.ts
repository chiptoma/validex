// ==============================================================================
// VALIDATE API ROUTE
// Test endpoint that validates request body with validex + Zod.
// ==============================================================================

import { z } from 'zod'
import { Email, validate } from '@validex/core'

const schema = z.object({
  name: z.string().min(2),
  email: Email() as z.ZodType,
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = await validate(schema, body)
  return result
})
