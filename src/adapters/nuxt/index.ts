// ==============================================================================
// NUXT ADAPTER
// Public entry point for the validex Nuxt adapter.
// ==============================================================================

export { useValidation } from './composables'

export type { ValidationState } from './composables'

export {
  createNuxtModule,
  detectNuxtI18n,
  setupValidex,
} from './module'

export type {
  NuxtModuleDefinition,
  ValidexNuxtI18nOptions,
  ValidexNuxtOptions,
} from './module'
