import { type ParsedPackageSpec } from "./utils.js";
export declare class Package {
    #private;
    readonly packageName: string;
    readonly packageVersion: string;
    readonly resolvedUrl?: string;
    readonly typesPackage?: {
        packageName: string;
        packageVersion: string;
        resolvedUrl?: string;
    };
    constructor(files: Record<string, string | Uint8Array>, packageName: string, packageVersion: string, resolvedUrl?: string, typesPackage?: Package["typesPackage"]);
    tryReadFile(path: string): string | undefined;
    readFile(path: string): string;
    fileExists(path: string): boolean;
    directoryExists(path: string): boolean;
    containsTypes(directory?: string): boolean;
    listFiles(directory?: string): string[];
    mergedWithTypes(typesPackage: Package): Package;
}
export interface CreatePackageFromNpmOptions {
    /**
     * Controls inclusion of a corresponding `@types` package. Ignored if the implementation
     * package contains TypeScript files. The value is the version or SemVer range of the
     * `@types` package to include, `true` to infer the version from the implementation
     * package version, or `false` to prevent inclusion of a `@types` package.
     * @default true
     */
    definitelyTyped?: string | boolean;
    before?: Date;
    allowDeprecated?: boolean;
}
export declare function createPackageFromNpm(packageSpec: string, { definitelyTyped, ...options }?: CreatePackageFromNpmOptions): Promise<Package>;
export declare function resolveImplementationPackageForTypesPackage(typesPackageName: string, typesPackageVersion: string, options?: Omit<CreatePackageFromNpmOptions, "definitelyTyped">): Promise<ResolvedPackageId>;
export declare function resolveTypesPackageForPackage(packageName: string, packageVersion: string, options?: Omit<CreatePackageFromNpmOptions, "definitelyTyped">): Promise<ResolvedPackageId | undefined>;
export interface ResolvedPackageId {
    packageName: string;
    packageVersion: string;
    tarballUrl: string;
}
export declare class Npm404Error extends Error {
    packageSpecs: readonly ParsedPackageSpec[];
    kind: string;
    constructor(packageSpecs: readonly ParsedPackageSpec[]);
}
export declare function createPackageFromTarballUrl(tarballUrl: string): Promise<Package>;
export declare function createPackageFromTarballData(tarball: Uint8Array): Package;
//# sourceMappingURL=createPackage.d.ts.map