import ts from "typescript";
import { defineCheck } from "../defineCheck.js";
export default defineCheck({
    name: "ModuleKindDisagreement",
    dependencies: ({ entrypoints, subpath, resolutionKind, resolutionOption, programInfo }) => {
        var _a, _b, _c, _d, _e, _f;
        const entrypoint = entrypoints[subpath].resolutions[resolutionKind];
        const typesFileName = (_a = entrypoint.resolution) === null || _a === void 0 ? void 0 : _a.fileName;
        const implementationFileName = (_b = entrypoint.implementationResolution) === null || _b === void 0 ? void 0 : _b.fileName;
        return [
            typesFileName,
            implementationFileName,
            typesFileName ? (_d = (_c = programInfo[resolutionOption]) === null || _c === void 0 ? void 0 : _c.moduleKinds) === null || _d === void 0 ? void 0 : _d[typesFileName] : undefined,
            implementationFileName ? (_f = (_e = programInfo[resolutionOption]) === null || _e === void 0 ? void 0 : _e.moduleKinds) === null || _f === void 0 ? void 0 : _f[implementationFileName] : undefined,
        ];
    },
    execute: ([typesFileName, implementationFileName, typesModuleKind, implementationModuleKind]) => {
        if (typesFileName && implementationFileName && typesModuleKind && implementationModuleKind) {
            if (typesModuleKind.detectedKind === ts.ModuleKind.ESNext &&
                implementationModuleKind.detectedKind === ts.ModuleKind.CommonJS) {
                return {
                    kind: "FalseESM",
                    typesFileName,
                    implementationFileName,
                    typesModuleKind,
                    implementationModuleKind,
                };
            }
            else if (typesModuleKind.detectedKind === ts.ModuleKind.CommonJS &&
                implementationModuleKind.detectedKind === ts.ModuleKind.ESNext) {
                return {
                    kind: "FalseCJS",
                    typesFileName,
                    implementationFileName,
                    typesModuleKind,
                    implementationModuleKind,
                };
            }
        }
    },
});
//# sourceMappingURL=moduleKindDisagreement.js.map