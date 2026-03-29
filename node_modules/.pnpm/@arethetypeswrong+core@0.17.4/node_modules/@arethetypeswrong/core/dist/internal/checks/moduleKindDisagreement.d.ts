declare const _default: {
    name: string;
    enumerateFiles?: boolean | undefined;
    dependencies: (context: import("../defineCheck.js").CheckDependenciesContext<boolean>) => readonly [string | undefined, string | undefined, import("../../types.js").ModuleKind | undefined, import("../../types.js").ModuleKind | undefined];
    execute: (dependencies: readonly [string | undefined, string | undefined, import("../../types.js").ModuleKind | undefined, import("../../types.js").ModuleKind | undefined], context: import("../defineCheck.js").CheckExecutionContext) => import("../../types.js").Problem[] | import("../../types.js").Problem | undefined;
};
export default _default;
//# sourceMappingURL=moduleKindDisagreement.d.ts.map