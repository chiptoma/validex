declare const _default: ({
    name: string;
    enumerateFiles?: boolean | undefined;
    dependencies: (context: import("../defineCheck.js").CheckDependenciesContext<boolean>) => readonly [string | undefined, import("../../types.js").ResolutionKind];
    execute: (dependencies: readonly [string | undefined, import("../../types.js").ResolutionKind], context: import("../defineCheck.js").CheckExecutionContext) => import("../../types.js").Problem[] | import("../../types.js").Problem | undefined;
} | {
    name: string;
    enumerateFiles?: boolean | undefined;
    dependencies: (context: import("../defineCheck.js").CheckDependenciesContext<boolean>) => readonly [string | undefined, import("../../types.js").ModuleKind | undefined, string | false | undefined, import("../../types.js").ModuleKind | undefined, import("../../types.js").ResolutionKind];
    execute: (dependencies: readonly [string | undefined, import("../../types.js").ModuleKind | undefined, string | false | undefined, import("../../types.js").ModuleKind | undefined, import("../../types.js").ResolutionKind], context: import("../defineCheck.js").CheckExecutionContext) => import("../../types.js").Problem[] | import("../../types.js").Problem | undefined;
} | {
    name: string;
    enumerateFiles?: boolean | undefined;
    dependencies: (context: import("../defineCheck.js").CheckDependenciesContext<boolean>) => readonly [string, import("../../types.js").ResolutionKind];
    execute: (dependencies: readonly [string, import("../../types.js").ResolutionKind], context: import("../defineCheck.js").CheckExecutionContext) => import("../../types.js").Problem[] | import("../../types.js").Problem | undefined;
} | {
    name: string;
    enumerateFiles?: boolean | undefined;
    dependencies: (context: import("../defineCheck.js").CheckDependenciesContext<boolean>) => readonly [] | readonly [string | undefined, string | undefined];
    execute: (dependencies: readonly [] | readonly [string | undefined, string | undefined], context: import("../defineCheck.js").CheckExecutionContext) => import("../../types.js").Problem[] | import("../../types.js").Problem | undefined;
} | {
    name: string;
    enumerateFiles?: true | undefined;
    dependencies: (context: import("../defineCheck.js").CheckDependenciesContext<true>) => readonly [import("../../types.js").ResolutionOption, string];
    execute: (dependencies: readonly [import("../../types.js").ResolutionOption, string], context: import("../defineCheck.js").CheckExecutionContext) => import("../../types.js").Problem[] | import("../../types.js").Problem | undefined;
} | {
    name: string;
    enumerateFiles?: boolean | undefined;
    dependencies: (context: import("../defineCheck.js").CheckDependenciesContext<boolean>) => readonly [string | undefined, string | undefined, import("../../types.js").ModuleKind | undefined, import("../../types.js").ModuleKind | undefined];
    execute: (dependencies: readonly [string | undefined, string | undefined, import("../../types.js").ModuleKind | undefined, import("../../types.js").ModuleKind | undefined], context: import("../defineCheck.js").CheckExecutionContext) => import("../../types.js").Problem[] | import("../../types.js").Problem | undefined;
} | {
    name: string;
    enumerateFiles?: true | undefined;
    dependencies: (context: import("../defineCheck.js").CheckDependenciesContext<true>) => readonly [string, import("../../types.js").ModuleKind | undefined];
    execute: (dependencies: readonly [string, import("../../types.js").ModuleKind | undefined], context: import("../defineCheck.js").CheckExecutionContext) => import("../../types.js").Problem[] | import("../../types.js").Problem | undefined;
})[];
export default _default;
//# sourceMappingURL=index.d.ts.map