import ts from "typescript";
import { defineCheck } from "../defineCheck.js";
export default defineCheck({
    name: "CJSOnlyExportsDefault",
    dependencies: ({ entrypoints, subpath, resolutionKind }) => {
        var _a;
        const entrypoint = entrypoints[subpath].resolutions[resolutionKind];
        const implementationFileName = (_a = entrypoint.implementationResolution) === null || _a === void 0 ? void 0 : _a.fileName;
        return [implementationFileName, resolutionKind];
    },
    execute: ([implementationFileName, resolutionKind], context) => {
        var _a, _b, _c;
        if (!implementationFileName) {
            return;
        }
        if (resolutionKind === "node10" || resolutionKind === "node16-cjs") {
            // Here, we have a CJS file (most likely transpiled ESM) resolving to a
            // CJS transpiled ESM file. This is fine when considered in isolation.
            // The pattern of having `module.exports.default = ...` is a problem
            // primarily because ESM-detected files in Node (and the same files in
            // Webpack/esbuild) will treat `module.exports` as the default export,
            // which is both unexpected and different from Babel-style interop seen
            // in transpiled default imports and most bundler scenarios. But if Node,
            // Webpack, and esbuild never see this file, then it's fine. So, while
            // the problematic pattern is a feature of the file alone, the bad outcome
            // comes from a combination of the file and the module system that imports
            // it. For dual packages that point Node imports and bundlers to a true
            // ESM default export, while pointing requires to this CJS "default export,"
            // we don't want to report a problem.
            //
            // TODO: It would be nice to report this information *somehow*, as neutral
            // metadata attached to the file (c.f. `Analysis["programInfo"]`).
            return;
        }
        const host = (_a = context.hosts.findHostForFiles([implementationFileName])) !== null && _a !== void 0 ? _a : context.hosts.bundler;
        const sourceFile = host.getSourceFile(implementationFileName);
        if (!sourceFile.externalModuleIndicator &&
            sourceFile.commonJsModuleIndicator &&
            ((_c = (_b = sourceFile.symbol) === null || _b === void 0 ? void 0 : _b.exports) === null || _c === void 0 ? void 0 : _c.has(ts.InternalSymbolName.Default)) &&
            sourceFile.symbol.exports.has(ts.escapeLeadingUnderscores("__esModule")) &&
            !sourceFile.symbol.exports.has(ts.InternalSymbolName.ExportEquals)) {
            const decl = sourceFile.symbol.exports.get(ts.InternalSymbolName.Default).declarations[0];
            return {
                kind: "CJSOnlyExportsDefault",
                fileName: implementationFileName,
                pos: decl.getStart(sourceFile),
                end: decl.end,
            };
        }
    },
});
//# sourceMappingURL=cjsOnlyExportsDefault.js.map