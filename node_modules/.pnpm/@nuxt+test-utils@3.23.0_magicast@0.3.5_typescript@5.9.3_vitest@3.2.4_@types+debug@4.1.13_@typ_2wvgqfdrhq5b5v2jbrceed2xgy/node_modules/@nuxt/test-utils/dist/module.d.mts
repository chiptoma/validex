import * as _nuxt_schema from '@nuxt/schema';
import { UserConfig } from 'vitest/node';

interface NuxtVitestOptions {
    startOnBoot?: boolean;
    logToConsole?: boolean;
    vitestConfig?: UserConfig;
}
declare const _default: _nuxt_schema.NuxtModule<NuxtVitestOptions, NuxtVitestOptions, false>;

export { _default as default };
export type { NuxtVitestOptions };
