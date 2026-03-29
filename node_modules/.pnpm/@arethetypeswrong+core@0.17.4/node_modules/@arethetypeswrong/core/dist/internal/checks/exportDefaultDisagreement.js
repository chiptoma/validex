import ts from "typescript";
import { defineCheck } from "../defineCheck.js";
import { getProbableExports } from "../getProbableExports.js";
import { getResolutionOption } from "../../utils.js";
const bindOptions = {
    target: ts.ScriptTarget.Latest,
    allowJs: true,
    checkJs: true,
};
export default defineCheck({
    name: "ExportDefaultDisagreement",
    dependencies: ({ entrypoints, subpath, resolutionKind, programInfo }) => {
        var _a, _b, _c, _d, _e, _f;
        const entrypoint = entrypoints[subpath].resolutions[resolutionKind];
        const typesFileName = (_a = entrypoint.resolution) === null || _a === void 0 ? void 0 : _a.fileName;
        const implementationFileName = (_b = entrypoint.implementationResolution) === null || _b === void 0 ? void 0 : _b.fileName;
        if ((typesFileName &&
            ((_d = (_c = programInfo[getResolutionOption(resolutionKind)].moduleKinds) === null || _c === void 0 ? void 0 : _c[typesFileName]) === null || _d === void 0 ? void 0 : _d.detectedKind) ===
                ts.ModuleKind.ESNext) ||
            (implementationFileName &&
                ((_f = (_e = programInfo[getResolutionOption(resolutionKind)].moduleKinds) === null || _e === void 0 ? void 0 : _e[implementationFileName]) === null || _f === void 0 ? void 0 : _f.detectedKind) ===
                    ts.ModuleKind.ESNext)) {
            return [];
        }
        return [typesFileName, implementationFileName];
    },
    execute: ([typesFileName, implementationFileName], context) => {
        var _a, _b;
        // Technically, much of this implementation should go in `dependencies`, since
        // different resolution modes can result in different program graphs, resulting
        // in different types, which are queried heavily here. However, it would be much
        // more expensive to run this type-heavy code in `dependencies`, where it would
        // reevaluate for every entrypoint/resolution matrix cell, when chances are
        // extremely high that a given pair of types/implementation files are intended
        // to act the same under all resolution modes.
        if (!typesFileName || !implementationFileName || !ts.hasTSFileExtension(typesFileName)) {
            return;
        }
        const host = context.hosts.findHostForFiles([typesFileName]);
        const typesSourceFile = host.getSourceFile(typesFileName);
        ts.bindSourceFile(typesSourceFile, bindOptions);
        if (!((_a = typesSourceFile.symbol) === null || _a === void 0 ? void 0 : _a.exports)) {
            return;
        }
        const implementationSourceFile = host.getSourceFile(implementationFileName);
        ts.bindSourceFile(implementationSourceFile, bindOptions);
        if (!((_b = implementationSourceFile.symbol) === null || _b === void 0 ? void 0 : _b.exports) || implementationSourceFile.externalModuleIndicator) {
            return;
        }
        // FalseExportDefault: types have a default, JS doesn't.
        // For this check, we're going to require the types to have a top-level
        // default export, which means we might miss something like:
        //
        // declare namespace foo {
        //   const _default: string;
        //   export { _default as default };
        // }
        // export = foo;
        //
        // But that's not a mistake people really make. If we don't need to
        // recognize that pattern, we can avoid creating a program and checker
        // for this error.
        const typesHaveSyntacticDefault = typesSourceFile.symbol.exports.has(ts.InternalSymbolName.Default);
        if (typesHaveSyntacticDefault && !getImplHasDefault() && implIsAnalyzable()) {
            return {
                kind: "FalseExportDefault",
                typesFileName,
                implementationFileName,
            };
        }
        // MissingExportEquals: types and JS have a default, but JS also has a
        // module.exports = not reflected in the types.
        // There are a few variations of this problem. The most straightforward
        // is when the types declare *only* a default export, and the JS declares
        // a module.exports and a module.exports.default in different declarations:
        //
        // module.exports = SomeClass;
        // module.exports.default = SomeClass;
        //
        // Then, there's the slight variation on this where the `default` property
        // is separately declared on `SomeClass`. This requires the type checker.
        // Finally, there's the case where the types declare a default export along
        // with other named exports. That *could* accurately represent a
        // `module.exports = { default, ... }` in JS, but only if the named exports
        // are values, not types. It also *couldn't* accurately represent a
        // `module.exports = SomeClass`, where the exported value is callable,
        // constructable, or a primitive.
        if (!getImplHasDefault() || !implIsAnalyzable()) {
            // The implementation not having a default doesn't necessarily mean the
            // following checks are irrelevant, but this rule is designed primarily
            // to catch cases where type definition authors correctly notice that
            // their implementation has a `module.exports.default`, but don't realize
            // that the same object is exposed as `module.exports`. We bail early
            // here primarily because these checks are expensive.
            return;
        }
        if (!typesSourceFile.symbol.exports.has(ts.InternalSymbolName.ExportEquals) &&
            implementationSourceFile.symbol.exports.has(ts.InternalSymbolName.ExportEquals) &&
            getTypesDefaultSymbol() &&
            ((getImplExportEqualsIsExportDefault() &&
                getTypesChecker().typeHasCallOrConstructSignatures(getTypesTypeOfDefault())) ||
                getImplChecker().typeHasCallOrConstructSignatures(getImplTypeOfModuleExports()))) {
            return {
                kind: "MissingExportEquals",
                typesFileName,
                implementationFileName,
            };
        }
        // TODO: does not account for export *
        const typesHaveNonDefaultValueExport = Array.from(typesSourceFile.symbol.exports.values()).some((s) => {
            if (s.escapedName === "default") {
                return false;
            }
            if (s.flags & ts.SymbolFlags.Value) {
                return true;
            }
            while (s.flags & ts.SymbolFlags.Alias) {
                s = getTypesChecker().getAliasedSymbol(s);
                if (s.flags & ts.SymbolFlags.Value) {
                    return true;
                }
            }
        });
        if (!typesHaveNonDefaultValueExport &&
            typeIsObjecty(getTypesTypeOfDefault(), getTypesChecker()) &&
            (Array.from(implementationSourceFile.symbol.exports.keys()).some((name) => isNotDefaultOrEsModule(ts.unescapeLeadingUnderscores(name))) ||
                getImplProbableExports().some(({ name }) => isNotDefaultOrEsModule(name))) &&
            getTypesDefaultSymbol()) {
            // Here, the types have a lone default export of a non-callable object,
            // and the implementation has multiple named exports along with `default`.
            // This is the biggest heuristic leap for this rule, but the assumption is
            // that the default export in the types was intended to represent the object
            // shape of `module.exports`, not `module.exports.default`. This may result
            // in false positives, but those false positives can be silenced by adding
            // exports in the types for other named exports in the JS. It's detecting
            // a definite problem; it's just not always accurate about the diagnosis.
            return {
                kind: "MissingExportEquals",
                typesFileName,
                implementationFileName,
            };
        }
        var implProbableExports, implChecker, implHasDefault, implTypeOfModuleExports, implExportEqualsIsExportDefault, typesChecker, typesDefaultSymbol, typesTypeOfDefault;
        function getImplProbableExports() {
            var _a;
            return ((_a = implProbableExports) !== null && _a !== void 0 ? _a : (implProbableExports = getProbableExports(implementationSourceFile)));
        }
        function getImplChecker() {
            var _a;
            return ((_a = implChecker) !== null && _a !== void 0 ? _a : (implChecker = host
                .createAuxiliaryProgram([implementationFileName])
                .getTypeChecker()));
        }
        function getImplHasDefault() {
            var _a, _b, _c, _d, _e, _f;
            return ((_a = implHasDefault) !== null && _a !== void 0 ? _a : (implHasDefault = ((_c = (_b = implementationSourceFile === null || implementationSourceFile === void 0 ? void 0 : implementationSourceFile.symbol) === null || _b === void 0 ? void 0 : _b.exports) === null || _c === void 0 ? void 0 : _c.has(ts.InternalSymbolName.Default)) ||
                ((_d = getImplProbableExports()) === null || _d === void 0 ? void 0 : _d.some((s) => s.name === "default")) ||
                (!!((_f = (_e = implementationSourceFile.symbol) === null || _e === void 0 ? void 0 : _e.exports) === null || _f === void 0 ? void 0 : _f.size) &&
                    getImplChecker()
                        .getExportsAndPropertiesOfModule(implementationSourceFile.symbol)
                        .some((s) => s.name === "default"))));
        }
        function getTypesChecker() {
            var _a;
            return ((_a = typesChecker) !== null && _a !== void 0 ? _a : (typesChecker = host.createAuxiliaryProgram([typesFileName]).getTypeChecker()));
        }
        function getTypesDefaultSymbol() {
            var _a, _b;
            return ((_a = typesDefaultSymbol) !== null && _a !== void 0 ? _a : (typesDefaultSymbol = (_b = typesSourceFile.symbol.exports.get(ts.InternalSymbolName.Default)) !== null && _b !== void 0 ? _b : getTypesChecker()
                .getExportsAndPropertiesOfModule(typesSourceFile.symbol)
                .find((s) => s.escapedName === "default")));
        }
        function getTypesTypeOfDefault() {
            var _a;
            const symbol = getTypesDefaultSymbol();
            return ((_a = typesTypeOfDefault) !== null && _a !== void 0 ? _a : (typesTypeOfDefault = symbol
                ? getTypesChecker().getTypeOfSymbol(symbol)
                : getTypesChecker().getAnyType()));
        }
        function getImplTypeOfModuleExports() {
            if (implTypeOfModuleExports) {
                return implTypeOfModuleExports;
            }
            const type = getImplChecker().getTypeOfSymbol(getImplChecker().resolveExternalModuleSymbol(implementationSourceFile.symbol));
            if (type.flags & ts.TypeFlags.Any && getImplExportEqualsIsExportDefault()) {
                return (implTypeOfModuleExports = getImplChecker().getTypeOfSymbol(implementationSourceFile.symbol.exports.get(ts.InternalSymbolName.Default)));
            }
            return (implTypeOfModuleExports = type);
        }
        function getImplExportEqualsIsExportDefault() {
            var _a;
            // TypeScript has a circularity error on `module.exports = exports.default`, so
            // detect that pattern syntactically.
            if (implExportEqualsIsExportDefault !== undefined) {
                return implExportEqualsIsExportDefault;
            }
            const exportEquals = implementationSourceFile.symbol.exports.get(ts.InternalSymbolName.ExportEquals);
            if (!exportEquals) {
                return (implExportEqualsIsExportDefault = false);
            }
            const exportDefault = implementationSourceFile.symbol.exports.get(ts.InternalSymbolName.Default);
            if (!exportDefault) {
                return (implExportEqualsIsExportDefault = false);
            }
            for (const assignment of [
                exportEquals.valueDeclaration,
                ts.findAncestor((_a = exportDefault.declarations) === null || _a === void 0 ? void 0 : _a[0], ts.isBinaryExpression),
            ]) {
                let seenModuleExports = false, seenExportsDefault = false;
                if (assignment &&
                    ts.isBinaryExpression(assignment) &&
                    assignment.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
                    const res = !!forEachAssignmentTarget(assignment, (target) => {
                        if (!seenExportsDefault && isExportsDefault(target)) {
                            seenExportsDefault = true;
                        }
                        else if (!seenModuleExports && isModuleExports(target)) {
                            seenModuleExports = true;
                        }
                        return seenExportsDefault && seenModuleExports;
                    });
                    if (res) {
                        return (implExportEqualsIsExportDefault = true);
                    }
                }
            }
            return (implExportEqualsIsExportDefault = false);
        }
        function implIsAnalyzable() {
            var _a, _b, _c;
            if (((_b = (_a = implementationSourceFile.symbol.exports.get(ts.InternalSymbolName.ExportEquals)) === null || _a === void 0 ? void 0 : _a.declarations) === null || _b === void 0 ? void 0 : _b.length) > 1) {
                // Multiple assignments in different function bodies is probably a bundle we can't analyze.
                // Multiple assignments in the same function body might just be an environment-conditional
                // module.exports inside an IIFE.
                let commonContainer;
                for (const decl of implementationSourceFile.symbol.exports.get(ts.InternalSymbolName.ExportEquals)
                    .declarations) {
                    const container = ts.findAncestor(decl, (node) => ts.isFunctionBlock(node) || ts.isSourceFile(node));
                    if (commonContainer === undefined) {
                        commonContainer = container;
                    }
                    else if (commonContainer !== container) {
                        return false;
                    }
                }
            }
            return !!(implementationSourceFile.symbol.exports.size || ((_c = getImplProbableExports()) === null || _c === void 0 ? void 0 : _c.length));
        }
    },
});
function typeIsObjecty(type, checker) {
    return (type.flags & ts.TypeFlags.Object &&
        !(type.flags & ts.TypeFlags.Primitive) &&
        !checker.typeHasCallOrConstructSignatures(type));
}
function isModuleExports(target) {
    return ((ts.isAccessExpression(target) &&
        ts.isIdentifier(target.expression) &&
        target.expression.text === "module" &&
        getNameOfAccessExpression(target) === "exports") ||
        (ts.isIdentifier(target) && target.text === "exports"));
}
function isExportsDefault(target) {
    return ((ts.isAccessExpression(target) &&
        ts.isIdentifier(target.expression) &&
        target.expression.text === "exports" &&
        getNameOfAccessExpression(target) === "default") ||
        (ts.isAccessExpression(target) &&
            ts.isAccessExpression(target.expression) &&
            ts.isIdentifier(target.expression.expression) &&
            target.expression.expression.text === "module" &&
            getNameOfAccessExpression(target.expression) === "exports" &&
            getNameOfAccessExpression(target) === "default"));
}
function isNotDefaultOrEsModule(name) {
    return name !== "default" && name !== "__esModule";
}
function forEachAssignmentTarget(assignment, cb) {
    // For `module.exports = exports = exports.default`, fires `cb` once for
    // `exports.default`, once for `exports`, and once for `module.exports`.
    const target = ts.skipParentheses(assignment.right);
    if (ts.isBinaryExpression(target) && target.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
        const res = forEachAssignmentTarget(target, cb);
        if (res) {
            return res;
        }
    }
    else {
        const res = cb(target);
        if (res) {
            return res;
        }
    }
    return cb(ts.skipParentheses(assignment.left));
}
function getNameOfAccessExpression(accessExpression) {
    const node = ts.getNameOfAccessExpression(accessExpression);
    if (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) {
        return node.text;
    }
}
//# sourceMappingURL=exportDefaultDisagreement.js.map