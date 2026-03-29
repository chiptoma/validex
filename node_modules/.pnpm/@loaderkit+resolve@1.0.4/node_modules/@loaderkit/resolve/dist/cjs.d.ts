import type { Resolution } from "./esm.js";
import type { FileSystemAsync, FileSystemSync } from "./fs.js";
interface ContextCJS {
    conditions?: readonly string[];
    extensions?: readonly string[];
}
export declare function resolve(fs: FileSystemAsync, specifier: string, parentURL: URL, context?: ContextCJS): Promise<Resolution>;
export declare function resolveSync(fs: FileSystemSync, specifier: string, parentURL: URL, context?: ContextCJS): Resolution;
export {};
//# sourceMappingURL=cjs.d.ts.map