import * as fsS from "node:fs";
import * as fs from "node:fs/promises";
export const defaultAsyncFileSystem = {
    directoryExists: async (path) => {
        try {
            const stat = await fs.stat(path);
            return stat.isDirectory();
        }
        catch {
            return false;
        }
    },
    fileExists: async (path) => {
        try {
            const stat = await fs.stat(path);
            return stat.isFile();
        }
        catch {
            return false;
        }
    },
    readFileJSON: async (path) => JSON.parse(await fs.readFile(path, "utf8")),
    readLink: async (path) => {
        try {
            return await fs.readlink(path);
        }
        catch {
            return undefined;
        }
    },
};
export const defaultSyncFileSystem = {
    directoryExists: path => {
        try {
            const stat = fsS.statSync(path);
            return stat.isDirectory();
        }
        catch {
            return false;
        }
    },
    fileExists: path => {
        try {
            const stat = fsS.statSync(path);
            return stat.isFile();
        }
        catch {
            return false;
        }
    },
    readFileJSON: (path) => JSON.parse(fsS.readFileSync(path, "utf8")),
    readLink: path => {
        try {
            return fsS.readlinkSync(path);
        }
        catch {
            return undefined;
        }
    },
};
//# sourceMappingURL=fs.js.map