/**
 * The pipeline operator is stuck in specification hell so this works as a replacement to unfold
 * sequential operations.
 * https://github.com/tc39/proposal-pipeline-operator/blob/main/HISTORY.md
 */
export function pipe(vv, ...fns) {
    return fns.reduce((vv, fn) => fn(vv), vv);
}
//# sourceMappingURL=pipe.js.map