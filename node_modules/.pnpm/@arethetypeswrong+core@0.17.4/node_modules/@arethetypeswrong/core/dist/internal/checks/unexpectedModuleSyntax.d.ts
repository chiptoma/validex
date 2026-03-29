declare const _default: {
    name: string;
    enumerateFiles?: true | undefined;
    dependencies: (context: import("../defineCheck.js").CheckDependenciesContext<true>) => readonly [string, import("../../types.js").ModuleKind | undefined];
    execute: (dependencies: readonly [string, import("../../types.js").ModuleKind | undefined], context: import("../defineCheck.js").CheckExecutionContext) => import("../../types.js").Problem[] | import("../../types.js").Problem | undefined;
};
export default _default;
//# sourceMappingURL=unexpectedModuleSyntax.d.ts.map