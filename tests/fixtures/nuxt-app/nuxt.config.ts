// Minimal Nuxt fixture config for future @nuxt/test-utils e2e tests.
// Uses a plain export to avoid requiring nuxt type resolution.
export default {
  // We test the validex module functions directly, not via module registration
  // since our module doesn't use defineNuxtModule from @nuxt/kit
}
