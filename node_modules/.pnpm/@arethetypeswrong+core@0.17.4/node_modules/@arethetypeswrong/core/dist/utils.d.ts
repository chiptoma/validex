import type { BuildTool, EntrypointInfo, EntrypointResolutionAnalysis, Failable, ParsedPackageSpec, Problem, ProblemKind, ResolutionKind, ResolutionOption } from "./types.js";
export declare const allResolutionOptions: ResolutionOption[];
export declare const allResolutionKinds: ResolutionKind[];
export declare function getResolutionOption(resolutionKind: ResolutionKind): ResolutionOption;
export declare function getResolutionKinds(resolutionOption: ResolutionOption): ResolutionKind[];
export declare function isDefined<T>(value: T | undefined): value is T;
export declare function resolvedThroughFallback(traces: string[]): boolean | undefined;
export declare function visitResolutions(entrypoints: Record<string, EntrypointInfo>, visitor: (analysis: EntrypointResolutionAnalysis, info: EntrypointInfo) => unknown): void;
export declare function groupProblemsByKind<K extends ProblemKind>(problems: (Problem & {
    kind: K;
})[]): Partial<Record<K, (Problem & {
    kind: K;
})[]>>;
export type { ParsedPackageSpec };
export declare function parsePackageSpec(input: string): Failable<ParsedPackageSpec>;
export declare const allBuildTools: BuildTool[];
//# sourceMappingURL=utils.d.ts.map