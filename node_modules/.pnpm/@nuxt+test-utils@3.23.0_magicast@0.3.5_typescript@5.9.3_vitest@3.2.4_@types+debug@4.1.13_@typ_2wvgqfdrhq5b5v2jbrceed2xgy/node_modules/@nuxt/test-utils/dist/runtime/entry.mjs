import { vi } from "vitest";
import { setupNuxt } from "./shared/nuxt.mjs";
if (typeof window !== "undefined" && window.__NUXT_VITEST_ENVIRONMENT__) {
  await setupNuxt();
  vi.resetModules();
}
export {};
