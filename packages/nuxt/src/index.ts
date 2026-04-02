// ==============================================================================
// NUXT ADAPTER
// Public entry point for the validex Nuxt adapter.
// ==============================================================================

export { useValidation } from './composables'

export type { ValidationState } from './composables'

export { default } from './module'

export {
  detectNuxtI18n,
  setupValidex,
} from './module'

export type {
  ValidexNuxtI18nOptions,
  ValidexNuxtOptions,
} from './module'
