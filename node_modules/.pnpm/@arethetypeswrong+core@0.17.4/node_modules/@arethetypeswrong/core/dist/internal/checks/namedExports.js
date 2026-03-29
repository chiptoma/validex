import ts from "typescript";
import { defineCheck } from "../defineCheck.js";
import { getEsmModuleNamespace } from "../esm/esmNamespace.js";
import { getResolutionOption } from "../../utils.js";
export default defineCheck({
    name: "NamedExports",
    dependencies: ({ entrypoints, subpath, resolutionKind, programInfo }) => {
        var _a, _b, _c, _d;
        const entrypoint = entrypoints[subpath].resolutions[resolutionKind];
        const typesFileName = ((_a = entrypoint.resolution) === null || _a === void 0 ? void 0 : _a.isTypeScript) && entrypoint.resolution.fileName;
        const resolutionOption = getResolutionOption(resolutionKind);
        const typesModuleKind = typesFileName ? (_b = programInfo[resolutionOption].moduleKinds) === null || _b === void 0 ? void 0 : _b[typesFileName] : undefined;
        const implementationFileName = (_c = entrypoint.implementationResolution) === null || _c === void 0 ? void 0 : _c.fileName;
        const implementationModuleKind = implementationFileName
            ? (_d = programInfo[resolutionOption].moduleKinds) === null || _d === void 0 ? void 0 : _d[implementationFileName]
            : undefined;
        return [implementationFileName, implementationModuleKind, typesFileName, typesModuleKind, resolutionKind];
    },
    execute: ([implementationFileName, implementationModuleKind, typesFileName, typesModuleKind, resolutionKind], context) => {
        if (!implementationFileName ||
            !typesFileName ||
            resolutionKind !== "node16-esm" ||
            (typesModuleKind === null || typesModuleKind === void 0 ? void 0 : typesModuleKind.detectedKind) !== ts.ModuleKind.CommonJS ||
            (implementationModuleKind === null || implementationModuleKind === void 0 ? void 0 : implementationModuleKind.detectedKind) !== ts.ModuleKind.CommonJS) {
            return;
        }
        // Get declared exported names from TypeScript
        const host = context.hosts.findHostForFiles([typesFileName]);
        const typesSourceFile = host.getSourceFile(typesFileName);
        if (typesSourceFile.scriptKind === ts.ScriptKind.JSON || !typesSourceFile.symbol) {
            return;
        }
        const typeChecker = host.createAuxiliaryProgram([typesFileName]).getTypeChecker();
        const moduleType = typeChecker.getTypeOfSymbol(typeChecker.resolveExternalModuleSymbol(typesSourceFile.symbol));
        if (typeChecker.isArrayLikeType(moduleType) || typeChecker.getPropertyOfType(moduleType, "0")) {
            return;
        }
        const expectedNames = Array.from(new Set(typeChecker
            .getExportsAndPropertiesOfModule(typesSourceFile.symbol)
            .filter((symbol) => {
            return (
            // TS treats `prototype` and other static class members as exports. There's possibly
            // a fix to be done in TS itself, since these show up as auto-imports.
            symbol.name !== "prototype" &&
                // @ts-expect-error `getSymbolFlags` extra arguments are not declared on TypeChecker
                typeChecker.getSymbolFlags(symbol, /*excludeTypeOnlyMeanings*/ true) & ts.SymbolFlags.Value);
        })
            .map((symbol) => symbol.name)));
        // Get actual exported names as seen by nodejs
        let exports;
        try {
            exports = getEsmModuleNamespace(context.pkg, implementationFileName);
        }
        catch {
            // If this fails then the result is indeterminate. This could happen in many cases, but
            // a common one would be for packages which re-export from another another package.
            return;
        }
        const missing = expectedNames.filter((name) => !exports.includes(name));
        if (missing.length > 0) {
            const lengthWithoutDefault = (names) => names.length - (names.includes("default") ? 1 : 0);
            return {
                kind: "NamedExports",
                implementationFileName,
                typesFileName,
                isMissingAllNamed: lengthWithoutDefault(missing) === lengthWithoutDefault(expectedNames),
                missing,
            };
        }
    },
});
//# sourceMappingURL=namedExports.js.map