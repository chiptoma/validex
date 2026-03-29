import * as cjs from "@loaderkit/resolve/cjs";
import * as esm from "@loaderkit/resolve/esm";
function makeFileSystemAdapter(fs) {
    return {
        directoryExists: url => fs.directoryExists(url.pathname),
        fileExists: url => fs.fileExists(url.pathname),
        readFileJSON: (url) => JSON.parse(fs.readFile(url.pathname)),
        readLink: () => undefined,
    };
}
export function cjsResolve(fs, specifier, parentURL) {
    return cjs.resolveSync(makeFileSystemAdapter(fs), specifier, parentURL);
}
export function esmResolve(fs, specifier, parentURL) {
    return esm.resolveSync(makeFileSystemAdapter(fs), specifier, parentURL);
}
//# sourceMappingURL=resolve.js.map