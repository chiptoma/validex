import environmentOptions from "nuxt-vitest-environment-options";
import { setupNuxt } from "./shared/nuxt.mjs";
import { setupWindow } from "./shared/environment.mjs";
const el = document.querySelector(environmentOptions.nuxt.rootId || "nuxt-test");
if (!el) {
  await setupWindow(window, environmentOptions);
  await setupNuxt();
}
