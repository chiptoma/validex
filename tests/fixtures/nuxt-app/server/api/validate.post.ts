// ==============================================================================
// VALIDATE API ROUTE
// Test endpoint that validates request body with validex + Zod.
// ==============================================================================

import { z } from 'zod'
import { validate } from '~validex/core/validate'
import { email } from '~validex/rules/email'

const schema = z.object({
  name: z.string().min(2),
  email: email() as z.ZodType,
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const result = await validate(schema, body)
  return result
})
