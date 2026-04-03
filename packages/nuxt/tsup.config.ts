import { defineConfig } from 'tsup'

export default defineConfig({
  entry: { index: 'src/index.ts' },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: false,
  external: ['@validex/core', '@nuxt/kit', '@nuxt/schema', 'nuxt'],
})
