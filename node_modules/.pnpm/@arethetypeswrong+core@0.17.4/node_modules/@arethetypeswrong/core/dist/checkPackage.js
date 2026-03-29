import { init as initCjsLexer } from "cjs-module-lexer";
import checks from "./internal/checks/index.js";
import { createCompilerHosts } from "./internal/multiCompilerHost.js";
import { getResolutionOption, visitResolutions } from "./utils.js";
import { getEntrypointInfo, getModuleKinds, getBuildTools } from "./internal/getEntrypointInfo.js";
export async function checkPackage(pkg, options) {
    const types = pkg.typesPackage
        ? {
            kind: "@types",
            ...pkg.typesPackage,
            definitelyTypedUrl: JSON.parse(pkg.readFile(`/node_modules/${pkg.typesPackage.packageName}/package.json`))
                .homepage,
        }
        : pkg.containsTypes()
            ? { kind: "included" }
            : false;
    const { packageName, packageVersion } = pkg;
    if (!types) {
        return { packageName, packageVersion, types };
    }
    const hosts = createCompilerHosts(pkg);
    const entrypointResolutions = getEntrypointInfo(packageName, pkg, hosts, options);
    const programInfo = {
        node10: {},
        node16: { moduleKinds: getModuleKinds(entrypointResolutions, "node16", hosts) },
        bundler: {},
    };
    await initCjsLexer();
    const problems = [];
    const problemIdsToIndices = new Map();
    visitResolutions(entrypointResolutions, (analysis, info) => {
        var _a;
        for (const check of checks) {
            const context = {
                pkg,
                hosts,
                entrypoints: entrypointResolutions,
                programInfo,
                subpath: info.subpath,
                resolutionKind: analysis.resolutionKind,
                resolutionOption: getResolutionOption(analysis.resolutionKind),
                fileName: undefined,
            };
            if (check.enumerateFiles) {
                for (const fileName of (_a = analysis.files) !== null && _a !== void 0 ? _a : []) {
                    runCheck(check, { ...context, fileName }, analysis);
                }
                if (analysis.implementationResolution) {
                    runCheck(check, { ...context, fileName: analysis.implementationResolution.fileName }, analysis);
                }
            }
            else {
                runCheck(check, context, analysis);
            }
        }
    });
    return {
        packageName,
        packageVersion,
        types,
        buildTools: getBuildTools(JSON.parse(pkg.readFile(`/node_modules/${packageName}/package.json`))),
        entrypoints: entrypointResolutions,
        programInfo,
        problems,
    };
    function runCheck(check, context, analysis) {
        var _a, _b;
        const dependencies = check.dependencies(context);
        const id = check.name +
            JSON.stringify(dependencies, (_, value) => {
                if (typeof value === "function") {
                    throw new Error("Encountered unexpected function in check dependencies");
                }
                return value;
            });
        let indices = problemIdsToIndices.get(id);
        if (indices) {
            ((_a = analysis.visibleProblems) !== null && _a !== void 0 ? _a : (analysis.visibleProblems = [])).push(...indices);
        }
        else {
            indices = [];
            const checkProblems = check.execute(dependencies, context);
            for (const problem of Array.isArray(checkProblems) ? checkProblems : checkProblems ? [checkProblems] : []) {
                indices.push(problems.length);
                problems.push(problem);
            }
            problemIdsToIndices.set(id, indices);
            ((_b = analysis.visibleProblems) !== null && _b !== void 0 ? _b : (analysis.visibleProblems = [])).push(...indices);
        }
    }
}
//# sourceMappingURL=checkPackage.js.map