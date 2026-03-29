import ts from "typescript";
import { defineCheck } from "../defineCheck.js";
export default defineCheck({
    name: "UnexpectedModuleSyntax",
    enumerateFiles: true,
    dependencies: ({ fileName, resolutionOption, programInfo }) => {
        var _a;
        return [fileName, (_a = programInfo[resolutionOption].moduleKinds) === null || _a === void 0 ? void 0 : _a[fileName]];
    },
    execute: ([fileName, expectedModuleKind], context) => {
        var _a, _b;
        if (!expectedModuleKind || !ts.hasJSFileExtension(fileName)) {
            return;
        }
        const host = (_a = context.hosts.findHostForFiles([fileName])) !== null && _a !== void 0 ? _a : context.hosts.bundler;
        const sourceFile = host.getSourceFile(fileName);
        const syntaxImpliedModuleKind = sourceFile.externalModuleIndicator
            ? ts.ModuleKind.ESNext
            : sourceFile.commonJsModuleIndicator
                ? ts.ModuleKind.CommonJS
                : undefined;
        if (syntaxImpliedModuleKind !== undefined && expectedModuleKind.detectedKind !== syntaxImpliedModuleKind) {
            // Value cannot be `true` because we set `moduleDetection: "legacy"`
            const syntax = ((_b = sourceFile.externalModuleIndicator) !== null && _b !== void 0 ? _b : sourceFile.commonJsModuleIndicator);
            return {
                kind: "UnexpectedModuleSyntax",
                fileName,
                moduleKind: expectedModuleKind,
                syntax: syntaxImpliedModuleKind,
                pos: syntax.getStart(sourceFile),
                end: syntax.end,
            };
        }
    },
});
//# sourceMappingURL=unexpectedModuleSyntax.js.map