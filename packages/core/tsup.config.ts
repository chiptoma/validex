import { resolve } from 'node:path'

import { defineConfig } from 'tsup'

const dir = (p: string): string => resolve(__dirname, `src/${p}`)

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'rules/index': 'src/rules/index.ts',
    'checks/index': 'src/checks/index.ts',
    'utilities/index': 'src/utilities/index.ts',
    'cli/index': 'src/cli/index.ts',
    'locales/en': 'src/locales/en.json',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: false,
  splitting: true,
  esbuildOptions(options) {
    options.alias = {
      '@checks': dir('checks'),
      '@rules': dir('rules'),
      '@core': dir('core'),
      '@config': dir('config'),
      '@internal': dir('internal'),
      '@loaders': dir('loaders'),
      '@utilities': dir('utilities'),
      '@augmentation': dir('augmentation'),
      '@cli': dir('cli'),
      '@validex-types': dir('types.ts'),
    }
  },
})
