import type { Analysis, Problem, ProblemKind, ResolutionKind, ResolutionOption } from "./types.js";
export interface ProblemKindInfo {
    title: string;
    emoji: string;
    shortDescription: string;
    description: string;
    details?: string;
    docsUrl: string;
}
export declare const problemKindInfo: Record<ProblemKind, ProblemKindInfo>;
export declare const allProblemKinds: ProblemKind[];
export interface ProblemFilter {
    kind?: readonly ProblemKind[];
    entrypoint?: string;
    resolutionKind?: ResolutionKind;
    resolutionOption?: ResolutionOption;
}
export declare function filterProblems(analysis: Analysis, filter: ProblemFilter): Problem[];
export declare function filterProblems(problems: readonly Problem[], analysis: Analysis, filter: ProblemFilter): Problem[];
export declare function problemAffectsResolutionKind(problem: Problem, resolutionKind: ResolutionKind, analysis: Analysis): boolean;
export declare function problemAffectsEntrypoint(problem: Problem, entrypoint: string, analysis: Analysis): boolean;
export declare function problemAffectsEntrypointResolution(problem: Problem, entrypoint: string, resolutionKind: ResolutionKind, analysis: Analysis): boolean;
//# sourceMappingURL=problems.d.ts.map