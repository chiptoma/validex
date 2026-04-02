# @validex/fastify

Fastify plugin for [validex](https://github.com/chiptoma/validex) — request validation via decorators and hooks.

## Prerequisites

`@validex/core` and `zod` must be installed.

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
})
```

## Instance Decorator

Validate any data against a Zod schema:

```ts
const result = await app.validate(schema, data)
```

## Request Decorator

Validate request body, query, or params in handlers:

```ts
app.post('/users', async (request) => {
  const result = await request.validate(schema)
  if (!result.success) {
    return { errors: result.firstErrors }
  }
  return { user: result.data }
})

// Validate query params
app.get('/search', async (request) => {
  const result = await request.validate(schema, { source: 'query' })
  // ...
})
```

## Route-Level PreValidation

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

Failed validation returns a 400 response with structured errors by default.

## Custom Error Handler

```ts
await app.register(validexPlugin, {
  errorHandler: (result, request, reply) => {
    reply.status(422).send({ errors: result.errors })
  },
})
```

## Documentation

See the [main validex docs](https://github.com/chiptoma/validex) for the full API reference and configuration guide.
