import ts from "typescript";
import { resolvedThroughFallback } from "../../utils.js";
import { defineCheck } from "../defineCheck.js";
export default defineCheck({
    name: "EntrypointResolutions",
    dependencies: ({ subpath, resolutionKind }) => [subpath, resolutionKind],
    execute: ([subpath, resolutionKind], context) => {
        var _a, _b;
        const problems = [];
        const entrypoint = context.entrypoints[subpath].resolutions[resolutionKind];
        if (entrypoint.isWildcard) {
            return;
        }
        if (!entrypoint.resolution) {
            problems.push({
                kind: "NoResolution",
                entrypoint: subpath,
                resolutionKind,
            });
        }
        else if (!entrypoint.resolution.isTypeScript && !entrypoint.resolution.isJson) {
            problems.push({
                kind: "UntypedResolution",
                entrypoint: subpath,
                resolutionKind,
            });
        }
        if (resolutionKind === "node16-cjs" &&
            ((!entrypoint.implementationResolution &&
                entrypoint.resolution &&
                ((_a = context.programInfo["node16"].moduleKinds[entrypoint.resolution.fileName]) === null || _a === void 0 ? void 0 : _a.detectedKind) ===
                    ts.ModuleKind.ESNext) ||
                (entrypoint.implementationResolution &&
                    ((_b = context.programInfo["node16"].moduleKinds[entrypoint.implementationResolution.fileName]) === null || _b === void 0 ? void 0 : _b.detectedKind) ===
                        ts.ModuleKind.ESNext))) {
            problems.push({
                kind: "CJSResolvesToESM",
                entrypoint: subpath,
                resolutionKind,
            });
        }
        if (entrypoint.resolution && resolvedThroughFallback(entrypoint.resolution.trace)) {
            problems.push({
                kind: "FallbackCondition",
                entrypoint: subpath,
                resolutionKind,
            });
        }
        return problems;
    },
});
//# sourceMappingURL=entrypointResolutions.js.map