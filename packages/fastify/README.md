# @validex/fastify

[![npm version](https://img.shields.io/npm/v/@validex/fastify)](https://www.npmjs.com/package/@validex/fastify)
[![license MIT](https://img.shields.io/npm/l/@validex/fastify)](https://github.com/chiptoma/validex/blob/main/LICENSE)

Fastify 5 plugin for [validex](https://github.com/chiptoma/validex) — request validation via decorators and hooks.

## Prerequisites

`@validex/core`, `zod`, and `fastify` must be installed.

## Install

```bash
pnpm add @validex/core @validex/fastify zod
```

## Plugin Registration

```ts
import Fastify from 'fastify'
import { validexPlugin } from '@validex/fastify'

const app = Fastify()

await app.register(validexPlugin, {
  rules: {
    email: { blockDisposable: true },
    password: { length: { min: 10 } },
  },
  preload: {
    disposable: true,
    passwords: 'basic',
  },
})
```

### Plugin Options

```ts
interface ValidexFastifyOptions {
  rules?: GlobalConfig['rules']       // Per-rule defaults (same as setup({ rules }))
  preload?: PreloadOptions            // Data files to preload at registration
  errorHandler?: (                    // Custom validation error handler
    result: ValidationResult<unknown>,
    request: FastifyRequest,
    reply: FastifyReply,
  ) => void | Promise<void>
}
```

## Request Validation

### In-handler validation

Validate request body, query, or params inside route handlers:

```ts
import { z } from 'zod'
import { Email } from '@validex/core'

const schema = z.object({ email: Email() })

app.post('/users', async (request) => {
  const result = await request.validate(schema)
  if (!result.success) {
    return { errors: result.firstErrors }
  }
  return { user: result.data }
})

// Validate query params
app.get('/search', async (request) => {
  const result = await request.validate(querySchema, { source: 'query' })
  // ...
})

// Validate route params
app.get('/users/:id', async (request) => {
  const result = await request.validate(paramsSchema, { source: 'params' })
  // ...
})
```

### Route-level preValidation

Automatically validate request body before the handler runs:

```ts
app.post('/users', {
  config: { validex: { body: userSchema } },
  handler: async (request) => {
    // Body is already validated — handler only runs on success
    return { created: true }
  },
})
```

Failed validation returns a 400 response with structured errors by default:

```json
{
  "statusCode": 400,
  "error": "Validation Error",
  "errors": { "email": "Email is not a valid email address" },
  "allErrors": { "email": ["Email is not a valid email address"] }
}
```

## Decorators

The plugin adds the following to the Fastify instance:

| Decorator | Scope | Signature |
|-----------|-------|-----------|
| `app.validate` | Instance | `(schema, data) => Promise<ValidationResult>` |
| `request.validate` | Request | `(schema, opts?) => Promise<ValidationResult>` |

`app.validate` validates arbitrary data. `request.validate` validates from request body (default), query, or params.

## Error Handling

Override the default 400 response with a custom error handler:

```ts
await app.register(validexPlugin, {
  errorHandler: (result, request, reply) => {
    reply.status(422).send({
      message: 'Validation failed',
      errors: result.errors,
    })
  },
})
```

## Documentation

- [Full API Reference](https://github.com/chiptoma/validex/blob/main/docs/API.md)
- [Translation Guide](https://github.com/chiptoma/validex/blob/main/docs/I18N.md)
- [Core Documentation](https://github.com/chiptoma/validex)

## License

[MIT](https://github.com/chiptoma/validex/blob/main/LICENSE)
