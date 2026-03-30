import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'checks/index': 'src/checks/index.ts',
    'utilities/index': 'src/utilities/index.ts',
    'adapters/nuxt/index': 'src/adapters/nuxt/index.ts',
    'adapters/fastify/index': 'src/adapters/fastify/index.ts',
    'cli/index': 'src/cli/index.ts',
    'locales/en': 'src/locales/en.json',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: false,
  splitting: true,
})
