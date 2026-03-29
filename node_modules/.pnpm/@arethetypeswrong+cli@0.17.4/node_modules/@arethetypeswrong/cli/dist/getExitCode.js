import { problemFlags } from "./problemUtils.js";
export function getExitCode(analysis, opts) {
    var _a, _b;
    if (!analysis.types) {
        return 0;
    }
    const ignoreRules = (_a = opts === null || opts === void 0 ? void 0 : opts.ignoreRules) !== null && _a !== void 0 ? _a : [];
    const ignoreResolutions = (_b = opts === null || opts === void 0 ? void 0 : opts.ignoreResolutions) !== null && _b !== void 0 ? _b : [];
    return analysis.problems.some((problem) => {
        const notRuleIgnored = !ignoreRules.includes(problemFlags[problem.kind]);
        const notResolutionIgnored = "resolutionKind" in problem ? !ignoreResolutions.includes(problem.resolutionKind) : true;
        return notRuleIgnored && notResolutionIgnored;
    })
        ? 1
        : 0;
}
//# sourceMappingURL=getExitCode.js.map