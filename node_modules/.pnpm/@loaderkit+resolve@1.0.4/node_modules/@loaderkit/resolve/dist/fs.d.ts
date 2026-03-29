export interface FileSystemAsync {
    readonly directoryExists: (path: URL) => Promise<boolean>;
    readonly fileExists: (path: URL) => Promise<boolean>;
    readonly readFileJSON: (path: URL) => Promise<unknown>;
    readonly readFileString?: (path: URL) => Promise<string>;
    readonly readLink: (path: URL) => Promise<string | undefined>;
}
export interface FileSystemSync {
    readonly directoryExists: (path: URL) => boolean;
    readonly fileExists: (path: URL) => boolean;
    readonly readFileJSON: (path: URL) => unknown;
    readonly readFileString?: (path: URL) => string;
    readonly readLink: (path: URL) => string | undefined;
}
export declare const defaultAsyncFileSystem: FileSystemAsync;
export declare const defaultSyncFileSystem: FileSystemSync;
//# sourceMappingURL=fs.d.ts.map