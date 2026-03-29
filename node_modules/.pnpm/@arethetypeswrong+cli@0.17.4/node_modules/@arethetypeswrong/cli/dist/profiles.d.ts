import type { RenderOptions } from "./render/index.js";
export declare const profiles: {
    strict: {
        ignoreResolutions: never[];
    };
    node16: {
        ignoreResolutions: "node10"[];
    };
    "esm-only": {
        ignoreResolutions: ("node10" | "node16-cjs")[];
    };
};
/**
 * Merges the profile with the provided options
 *
 * @param profileKey - name of the profile to apply
 * @param opts - options to apply the profile to
 */
export declare function applyProfile(profileKey: keyof typeof profiles, opts: RenderOptions): void;
//# sourceMappingURL=profiles.d.ts.map