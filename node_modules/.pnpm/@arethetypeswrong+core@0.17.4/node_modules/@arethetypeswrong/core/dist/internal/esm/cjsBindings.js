import { parse as cjsParse } from "cjs-module-lexer";
export function getCjsModuleBindings(sourceText) {
    return cjsParse(sourceText);
}
//# sourceMappingURL=cjsBindings.js.map