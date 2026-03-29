import type { Problem } from "../../types.js";
declare const _default: {
    name: string;
    enumerateFiles?: boolean | undefined;
    dependencies: (context: import("../defineCheck.js").CheckDependenciesContext<boolean>) => readonly [string, import("../../types.js").ResolutionKind];
    execute: (dependencies: readonly [string, import("../../types.js").ResolutionKind], context: import("../defineCheck.js").CheckExecutionContext) => Problem[] | Problem | undefined;
};
export default _default;
//# sourceMappingURL=entrypointResolutions.d.ts.map