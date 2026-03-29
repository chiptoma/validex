import type { FileSystemAsync, FileSystemSync } from "./fs.js";
export declare function makeTestFileSystem(files: Record<string, string>): FileSystemSync;
export declare function makeAsyncFileSystemFromSyncForTesting(fs: FileSystemSync): FileSystemAsync;
//# sourceMappingURL=adapter.d.ts.map