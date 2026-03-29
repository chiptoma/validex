import type { Package } from "./createPackage.js";
import type { CheckResult } from "./types.js";
export interface CheckPackageOptions {
    /**
     * Exhaustive list of entrypoints to check. The package root is `"."`.
     * Specifying this option disables automatic entrypoint discovery,
     * and overrides the `includeEntrypoints` and `excludeEntrypoints` options.
     */
    entrypoints?: string[];
    /**
     * Entrypoints to check in addition to automatically discovered ones.
     */
    includeEntrypoints?: string[];
    /**
     * Entrypoints to exclude from checking.
     */
    excludeEntrypoints?: (string | RegExp)[];
    /**
     * Whether to automatically consider all published files as entrypoints
     * in the absence of any other detected or configured entrypoints.
     */
    entrypointsLegacy?: boolean;
}
export declare function checkPackage(pkg: Package, options?: CheckPackageOptions): Promise<CheckResult>;
//# sourceMappingURL=checkPackage.d.ts.map