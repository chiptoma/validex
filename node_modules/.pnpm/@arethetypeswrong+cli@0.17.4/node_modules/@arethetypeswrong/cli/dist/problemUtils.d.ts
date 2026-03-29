import * as core from "@arethetypeswrong/core";
export declare const problemFlags: {
    readonly NoResolution: "no-resolution";
    readonly UntypedResolution: "untyped-resolution";
    readonly FalseCJS: "false-cjs";
    readonly FalseESM: "false-esm";
    readonly CJSResolvesToESM: "cjs-resolves-to-esm";
    readonly FallbackCondition: "fallback-condition";
    readonly CJSOnlyExportsDefault: "cjs-only-exports-default";
    readonly NamedExports: "named-exports";
    readonly FalseExportDefault: "false-export-default";
    readonly MissingExportEquals: "missing-export-equals";
    readonly UnexpectedModuleSyntax: "unexpected-module-syntax";
    readonly InternalResolutionError: "internal-resolution-error";
};
export declare const resolutionKinds: Record<core.ResolutionKind, string>;
export declare const moduleKinds: {
    1: string;
    99: string;
    "": string;
};
//# sourceMappingURL=problemUtils.d.ts.map