import ts from "typescript";
import type { ModuleKind } from "../types.js";
import type { Package } from "../createPackage.js";
export interface ResolveModuleNameResult {
    resolution: ts.ResolvedModuleWithFailedLookupLocations;
    trace: string[];
}
export interface CompilerHosts {
    node10: CompilerHostWrapper;
    node16: CompilerHostWrapper;
    bundler: CompilerHostWrapper;
    findHostForFiles(files: string[]): CompilerHostWrapper | undefined;
}
export declare function createCompilerHosts(fs: Package): CompilerHosts;
export declare class CompilerHostWrapper {
    private programCache;
    private compilerHost;
    private compilerOptions;
    private normalModuleResolutionCache;
    private noDtsResolutionModuleResolutionCache;
    private moduleResolutionCache;
    private traceCollector;
    private sourceFileCache;
    private resolvedModules;
    private languageVersion;
    constructor(fs: Package, moduleResolution: ts.ModuleResolutionKind, moduleKind: ts.ModuleKind);
    getCompilerOptions(): ts.CompilerOptions;
    getSourceFile(fileName: string): ts.SourceFile | undefined;
    getSourceFileFromCache(fileName: string): ts.SourceFile | undefined;
    getModuleKindForFile(fileName: string): ModuleKind | undefined;
    resolveModuleName(moduleName: string, containingFile: string, resolutionMode?: ts.ModuleKind.ESNext | ts.ModuleKind.CommonJS, noDtsResolution?: boolean, allowJs?: boolean): ResolveModuleNameResult;
    getTrace(fromFileName: string, moduleSpecifier: string, resolutionMode: ts.ModuleKind.ESNext | ts.ModuleKind.CommonJS | undefined): string[] | undefined;
    private getModuleKey;
    private getProgram;
    createPrimaryProgram(rootName: string): ts.Program;
    createAuxiliaryProgram(rootNames: string[], extraOptions?: ts.CompilerOptions): ts.Program;
    getResolvedModule(sourceFile: ts.SourceFile, moduleName: string, resolutionMode: ts.ResolutionMode): ts.ResolvedModuleWithFailedLookupLocations | undefined;
    private createCompilerHost;
    private getImpliedNodeFormatForFile;
    private getPackageScopeForPath;
}
//# sourceMappingURL=multiCompilerHost.d.ts.map