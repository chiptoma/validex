import ts from "typescript";
import { LRUCache } from "lru-cache";
import minimalLibDts from "./minimalLibDts.js";
export function createCompilerHosts(fs) {
    const node10 = new CompilerHostWrapper(fs, ts.ModuleResolutionKind.Node10, ts.ModuleKind.CommonJS);
    const node16 = new CompilerHostWrapper(fs, ts.ModuleResolutionKind.Node16, ts.ModuleKind.Node16);
    const bundler = new CompilerHostWrapper(fs, ts.ModuleResolutionKind.Bundler, ts.ModuleKind.ESNext);
    return {
        node10,
        node16,
        bundler,
        findHostForFiles(files) {
            for (const host of [node10, node16, bundler]) {
                if (files.every((f) => host.getSourceFileFromCache(f) !== undefined)) {
                    return host;
                }
            }
        },
    };
}
const getCanonicalFileName = ts.createGetCanonicalFileName(false);
const toPath = (fileName) => ts.toPath(fileName, "/", getCanonicalFileName);
export class CompilerHostWrapper {
    constructor(fs, moduleResolution, moduleKind) {
        this.programCache = new LRUCache({ max: 2 });
        this.moduleResolutionCache = {};
        this.traceCollector = new TraceCollector();
        this.sourceFileCache = new Map();
        this.resolvedModules = new Map();
        this.languageVersion = ts.ScriptTarget.Latest;
        this.compilerOptions = {
            moduleResolution,
            module: moduleKind,
            // So `sourceFile.externalModuleIndicator` is set to a node
            moduleDetection: ts.ModuleDetectionKind.Legacy,
            target: ts.ScriptTarget.Latest,
            resolveJsonModule: true,
            traceResolution: true,
        };
        this.normalModuleResolutionCache = ts.createModuleResolutionCache("/", getCanonicalFileName, this.compilerOptions);
        this.noDtsResolutionModuleResolutionCache = ts.createModuleResolutionCache("/", getCanonicalFileName, this.compilerOptions);
        this.compilerHost = this.createCompilerHost(fs, this.sourceFileCache);
    }
    getCompilerOptions() {
        return this.compilerOptions;
    }
    getSourceFile(fileName) {
        return this.compilerHost.getSourceFile(fileName, this.languageVersion);
    }
    getSourceFileFromCache(fileName) {
        return this.sourceFileCache.get(toPath(fileName));
    }
    getModuleKindForFile(fileName) {
        var _a;
        const kind = this.getImpliedNodeFormatForFile(fileName);
        if (kind) {
            const extension = ts.getAnyExtensionFromPath(fileName);
            const isExtension = extension === ts.Extension.Cjs ||
                extension === ts.Extension.Cts ||
                extension === ts.Extension.Dcts ||
                extension === ts.Extension.Mjs ||
                extension === ts.Extension.Mts ||
                extension === ts.Extension.Dmts;
            const reasonPackageJsonInfo = isExtension ? undefined : this.getPackageScopeForPath(fileName);
            const reasonFileName = isExtension
                ? fileName
                : reasonPackageJsonInfo
                    ? reasonPackageJsonInfo.packageDirectory + "/package.json"
                    : fileName;
            const reasonPackageJsonType = (_a = reasonPackageJsonInfo === null || reasonPackageJsonInfo === void 0 ? void 0 : reasonPackageJsonInfo.contents) === null || _a === void 0 ? void 0 : _a.packageJsonContent.type;
            return {
                detectedKind: kind,
                detectedReason: isExtension ? "extension" : reasonPackageJsonType ? "type" : "no:type",
                reasonFileName,
            };
        }
    }
    resolveModuleName(moduleName, containingFile, resolutionMode, noDtsResolution, allowJs) {
        var _a, _b, _c;
        var _d;
        const moduleKey = this.getModuleKey(moduleName, resolutionMode, noDtsResolution, allowJs);
        if ((_a = this.moduleResolutionCache[containingFile]) === null || _a === void 0 ? void 0 : _a[moduleKey]) {
            const { resolution, trace } = this.moduleResolutionCache[containingFile][moduleKey];
            return {
                resolution,
                trace,
            };
        }
        this.traceCollector.clear();
        const resolution = ts.resolveModuleName(moduleName, containingFile, noDtsResolution ? { ...this.compilerOptions, noDtsResolution, allowJs } : this.compilerOptions, this.compilerHost, noDtsResolution ? this.noDtsResolutionModuleResolutionCache : this.normalModuleResolutionCache, 
        /*redirectedReference*/ undefined, resolutionMode);
        const trace = this.traceCollector.read();
        if (!((_b = this.moduleResolutionCache[containingFile]) === null || _b === void 0 ? void 0 : _b[moduleKey])) {
            ((_c = (_d = this.moduleResolutionCache)[containingFile]) !== null && _c !== void 0 ? _c : (_d[containingFile] = {}))[moduleKey] = { resolution, trace };
        }
        return {
            resolution,
            trace,
        };
    }
    getTrace(fromFileName, moduleSpecifier, resolutionMode) {
        var _a, _b;
        return (_b = (_a = this.moduleResolutionCache[fromFileName]) === null || _a === void 0 ? void 0 : _a[this.getModuleKey(moduleSpecifier, resolutionMode, /*noDtsResolution*/ undefined, /*allowJs*/ undefined)]) === null || _b === void 0 ? void 0 : _b.trace;
    }
    getModuleKey(moduleSpecifier, resolutionMode, noDtsResolution, allowJs) {
        return `${resolutionMode !== null && resolutionMode !== void 0 ? resolutionMode : 1}:${+!!noDtsResolution}:${+!!allowJs}:${moduleSpecifier}`;
    }
    getProgram(rootNames, options) {
        const key = programKey(rootNames, options);
        let program = this.programCache.get(key);
        if (!program) {
            this.programCache.set(key, (program = ts.createProgram({ rootNames, options, host: this.compilerHost })));
        }
        return program;
    }
    createPrimaryProgram(rootName) {
        var _a;
        const program = this.getProgram([rootName], this.compilerOptions);
        (_a = program.resolvedModules) === null || _a === void 0 ? void 0 : _a.forEach((cache, path) => {
            let ownCache = this.resolvedModules.get(path);
            if (!ownCache) {
                this.resolvedModules.set(path, (ownCache = ts.createModeAwareCache()));
            }
            cache.forEach((resolution, key, mode) => {
                ownCache.set(key, mode, resolution);
            });
        });
        return program;
    }
    createAuxiliaryProgram(rootNames, extraOptions) {
        if (extraOptions &&
            ts.changesAffectModuleResolution(
            // allowJs and noDtsResolution are part of the cache key, but any other resolution-affecting options
            // are assumed to be constant for the host.
            {
                ...this.compilerOptions,
                allowJs: extraOptions.allowJs,
                checkJs: extraOptions.checkJs,
                noDtsResolution: extraOptions.noDtsResolution,
            }, { ...this.compilerOptions, ...extraOptions })) {
            throw new Error("Cannot override resolution-affecting options for host due to potential cache pollution");
        }
        const options = extraOptions ? { ...this.compilerOptions, ...extraOptions } : this.compilerOptions;
        return this.getProgram(rootNames, options);
    }
    getResolvedModule(sourceFile, moduleName, resolutionMode) {
        var _a;
        return (_a = this.resolvedModules.get(sourceFile.path)) === null || _a === void 0 ? void 0 : _a.get(moduleName, resolutionMode);
    }
    createCompilerHost(fs, sourceFileCache) {
        return {
            fileExists: fs.fileExists.bind(fs),
            readFile: fs.readFile.bind(fs),
            directoryExists: fs.directoryExists.bind(fs),
            getSourceFile: (fileName) => {
                const path = toPath(fileName);
                const cached = sourceFileCache.get(path);
                if (cached) {
                    return cached;
                }
                const content = fileName === "/node_modules/typescript/lib/lib.d.ts" ? minimalLibDts : fs.tryReadFile(fileName);
                if (content === undefined) {
                    return undefined;
                }
                const sourceFile = ts.createSourceFile(fileName, content, {
                    languageVersion: this.languageVersion,
                    impliedNodeFormat: this.getImpliedNodeFormatForFile(fileName),
                }, 
                /*setParentNodes*/ true);
                sourceFileCache.set(path, sourceFile);
                return sourceFile;
            },
            getDefaultLibFileName: () => "/node_modules/typescript/lib/lib.d.ts",
            getCurrentDirectory: () => "/",
            writeFile: () => {
                throw new Error("Not implemented");
            },
            getCanonicalFileName,
            useCaseSensitiveFileNames: () => false,
            getNewLine: () => "\n",
            trace: this.traceCollector.trace,
            resolveModuleNameLiterals: (moduleLiterals, containingFile, _redirectedReference, options, containingSourceFile) => {
                return moduleLiterals.map((literal) => this.resolveModuleName(literal.text, containingFile, ts.getModeForUsageLocation(containingSourceFile, literal, this.compilerOptions), options.noDtsResolution).resolution);
            },
        };
    }
    getImpliedNodeFormatForFile(fileName) {
        return ts.getImpliedNodeFormatForFile(toPath(fileName), this.normalModuleResolutionCache.getPackageJsonInfoCache(), this.compilerHost, this.compilerOptions);
    }
    getPackageScopeForPath(fileName) {
        return ts.getPackageScopeForPath(fileName, ts.getTemporaryModuleResolutionState(
        // TODO: consider always using the node16 cache because package.json should be a hit
        this.normalModuleResolutionCache.getPackageJsonInfoCache(), this.compilerHost, this.compilerOptions));
    }
}
class TraceCollector {
    constructor() {
        this.traces = [];
        this.trace = (message) => {
            this.traces.push(message);
        };
    }
    read() {
        const result = this.traces.slice();
        this.clear();
        return result;
    }
    clear() {
        this.traces.length = 0;
    }
}
function programKey(rootNames, options) {
    return JSON.stringify([rootNames, Object.entries(options).sort(([k1], [k2]) => k1.localeCompare(k2))]);
}
//# sourceMappingURL=multiCompilerHost.js.map