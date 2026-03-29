declare const _default: {
    name: string;
    enumerateFiles?: boolean | undefined;
    dependencies: (context: import("../defineCheck.js").CheckDependenciesContext<boolean>) => readonly [] | readonly [string | undefined, string | undefined];
    execute: (dependencies: readonly [] | readonly [string | undefined, string | undefined], context: import("../defineCheck.js").CheckExecutionContext) => import("../../types.js").Problem[] | import("../../types.js").Problem | undefined;
};
export default _default;
//# sourceMappingURL=exportDefaultDisagreement.d.ts.map