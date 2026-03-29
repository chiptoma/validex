import { accept } from "@braidai/lang/task/utility";
export function makeTestFileSystem(files) {
    const checkProto = (url) => {
        if (url.protocol !== "file:") {
            throw new Error(`Unsupported protocol: ${url.protocol}`);
        }
    };
    // Convert URL path to an actual "file" name
    const extractPath = (url) => decodeURIComponent(url.pathname.slice(1));
    // By convention a directory URL ends with a slash. This removes it, converting it to a "file".
    const dirToPath = (url) => new URL(`file://${url.pathname.slice(0, -1)}`);
    // Resolves all links in the URL's path lineage
    const realName = (url) => {
        // Flatten multiple slashes, which I guess is just how filesystems work.
        url = new URL(url.href.replace(/\/+/g, "/"));
        // Read direct file link
        const linked = fs.readLink(url);
        if (linked !== undefined) {
            return realName(new URL(linked, url));
        }
        // Walk parent directories
        let dir = new URL(".", url);
        while (dir.pathname !== "/") {
            const linked = fs.readLink(dirToPath(dir));
            if (linked === undefined) {
                dir = new URL("..", dir);
            }
            else {
                const base = function () {
                    if (linked === "/") {
                        return new URL("/", dir);
                    }
                    else if (linked.startsWith("/")) {
                        return new URL(`${linked}/`, dir);
                    }
                    else if (linked.endsWith(".")) {
                        return new URL(`../${linked}`, dir);
                    }
                    else {
                        return new URL(`../${linked}/`, dir);
                    }
                }();
                return realName(new URL(url.pathname.slice(dir.pathname.length), base));
            }
        }
        return url;
    };
    const readFileString = (path) => {
        checkProto(path);
        const file = extractPath(realName(path));
        const content = files[file];
        if (content === undefined) {
            throw new Error(`File not found: ${file}`);
        }
        return content;
    };
    const fs = {
        directoryExists(path) {
            checkProto(path);
            if (!path.pathname.endsWith("/")) {
                return false;
            }
            const dir = extractPath(realName(path));
            return Object.keys(files).some(key => key.startsWith(dir));
        },
        fileExists(path) {
            checkProto(path);
            return extractPath(realName(path)) in files;
        },
        readFileJSON(path) {
            return JSON.parse(readFileString(path));
        },
        readFileString,
        readLink(path) {
            checkProto(path);
            return files[`${extractPath(path)}*`];
        },
    };
    return fs;
}
export function makeAsyncFileSystemFromSyncForTesting(fs) {
    return {
        // eslint-disable-next-line @typescript-eslint/require-await
        directoryExists: async (path) => fs.directoryExists(path),
        // eslint-disable-next-line @typescript-eslint/require-await
        fileExists: async (path) => fs.fileExists(path),
        // eslint-disable-next-line @typescript-eslint/require-await
        readFileJSON: async (path) => fs.readFileJSON(path),
        // eslint-disable-next-line @typescript-eslint/require-await
        readLink: async (path) => fs.readLink(path),
        ...fs.readFileString && {
            // eslint-disable-next-line @typescript-eslint/require-await
            readFileString: async (path) => fs.readFileString(path),
        },
    };
}
/** @internal */
export function makeFileSystemSyncAdapter(fs) {
    return {
        // eslint-disable-next-line require-yield
        *directoryExists(path) {
            return fs.directoryExists(path);
        },
        // eslint-disable-next-line require-yield
        *fileExists(path) {
            return fs.fileExists(path);
        },
        // eslint-disable-next-line require-yield
        *readFileJSON(path) {
            return fs.readFileJSON(path);
        },
        // eslint-disable-next-line require-yield
        *readLink(path) {
            return fs.readLink(path);
        },
    };
}
/** @internal */
export function makeFileSystemAsyncAdapter(fs) {
    return {
        *directoryExists(path) {
            return yield* accept(fs.directoryExists(path));
        },
        *fileExists(path) {
            return yield* accept(fs.fileExists(path));
        },
        *readFileJSON(path) {
            return yield* accept(fs.readFileJSON(path));
        },
        *readLink(path) {
            return yield* accept(fs.readLink(path));
        },
    };
}
//# sourceMappingURL=adapter.js.map