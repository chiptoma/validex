import type { FileSystemAsync, FileSystemSync } from "./fs.js";
export type ModuleFormat = "addon" | "builtin" | "commonjs" | "json" | "module" | "wasm";
export interface Resolution {
    format: ModuleFormat | undefined;
    url: URL;
}
export declare function resolve(fs: FileSystemAsync, specifier: string, parentURL: URL): Promise<Resolution>;
export declare function resolveSync(fs: FileSystemSync, specifier: string, parentURL: URL): Resolution;
//# sourceMappingURL=esm.d.ts.map