import ts from "typescript";
const minifiedVariableAssignmentPattern = /[^\s];(?:var|let|const) [a-zA-Z0-9_]=[^\s]/;
export function getProbableExports(sourceFile) {
    var _a;
    return (_a = getEsbuildBabelSwcExports(sourceFile)) !== null && _a !== void 0 ? _a : [];
}
function getEsbuildBabelSwcExports(sourceFile) {
    var _a, _b;
    let possibleIndex = sourceFile.text.indexOf("\n__export(");
    if (possibleIndex === -1) {
        possibleIndex = sourceFile.text.indexOf("\n_export(");
    }
    if (possibleIndex === -1 && !isProbablyMinified(sourceFile.text)) {
        return undefined;
    }
    for (const statement of sourceFile.statements) {
        if (possibleIndex !== -1 && statement.end < possibleIndex) {
            continue;
        }
        if (possibleIndex !== -1 && statement.pos > possibleIndex) {
            break;
        }
        if (ts.isExpressionStatement(statement) &&
            ts.isCallExpression(statement.expression) &&
            ts.isIdentifier(statement.expression.expression) &&
            statement.expression.arguments.length === 2 &&
            ts.isIdentifier(statement.expression.arguments[0]) &&
            ts.isObjectLiteralExpression(statement.expression.arguments[1])) {
            const callTarget = statement.expression.expression;
            const isExport = ts.unescapeLeadingUnderscores(callTarget.escapedText) === "__export" ||
                callTarget.escapedText === "_export" ||
                isEsbuildExportFunction((_b = (_a = sourceFile.locals) === null || _a === void 0 ? void 0 : _a.get(callTarget.escapedText)) === null || _b === void 0 ? void 0 : _b.valueDeclaration);
            if (isExport) {
                return statement.expression.arguments[1].properties.flatMap((prop) => {
                    if (ts.isPropertyAssignment(prop) &&
                        (ts.isIdentifier(prop.name) || ts.isStringOrNumericLiteralLike(prop.name))) {
                        return [{ name: prop.name.text, node: prop }];
                    }
                    if (ts.isShorthandPropertyAssignment(prop)) {
                        return [{ name: prop.name.text, node: prop }];
                    }
                    return [];
                });
            }
        }
    }
}
function isEsbuildExportFunction(decl) {
    /*
    esbuild:
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, { get: all[name], enumerable: true });
    };
  
    esbuild min:
    b=(o,r)=>{for(var e in r)n(o,e,{get:r[e],enumerable:!0})}
  
    swc?
    function _export(target, all) {
      for(var name in all)Object.defineProperty(target, name, {
          enumerable: true,
          get: all[name]
      });
    }
    */
    if (!decl) {
        return false;
    }
    return (ts.isVariableDeclaration(decl) &&
        decl.initializer &&
        ts.isFunctionExpressionOrArrowFunction(decl.initializer) &&
        ts.isBlock(decl.initializer.body) &&
        decl.initializer.body.statements.length == 1 &&
        ts.isForInStatement(decl.initializer.body.statements[0]));
}
function isProbablyMinified(text) {
    return minifiedVariableAssignmentPattern.test(text);
}
//# sourceMappingURL=getProbableExports.js.map