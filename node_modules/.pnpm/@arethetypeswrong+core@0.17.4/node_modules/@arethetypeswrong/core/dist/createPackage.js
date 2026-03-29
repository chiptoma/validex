var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _Package_files;
import { untar } from "@andrewbranch/untar.js";
import { Gunzip } from "fflate";
import { major, maxSatisfying, minor, valid, validRange } from "semver";
import ts from "typescript";
import { parsePackageSpec } from "./utils.js";
export class Package {
    constructor(files, packageName, packageVersion, resolvedUrl, typesPackage) {
        _Package_files.set(this, {});
        __classPrivateFieldSet(this, _Package_files, files, "f");
        this.packageName = packageName;
        this.packageVersion = packageVersion;
        this.resolvedUrl = resolvedUrl;
        this.typesPackage = typesPackage;
    }
    tryReadFile(path) {
        const file = __classPrivateFieldGet(this, _Package_files, "f")[path];
        if (file === undefined) {
            return undefined;
        }
        if (typeof file === "string") {
            return file;
        }
        const content = new TextDecoder().decode(file);
        __classPrivateFieldGet(this, _Package_files, "f")[path] = content;
        return content;
    }
    readFile(path) {
        const content = this.tryReadFile(path);
        if (content === undefined) {
            throw new Error(`File not found: ${path}`);
        }
        return content;
    }
    fileExists(path) {
        return path in __classPrivateFieldGet(this, _Package_files, "f");
    }
    directoryExists(path) {
        path = ts.ensureTrailingDirectorySeparator(path);
        for (const file in __classPrivateFieldGet(this, _Package_files, "f")) {
            if (file.startsWith(path)) {
                return true;
            }
        }
        return false;
    }
    containsTypes(directory = "/") {
        return this.listFiles(directory).some(ts.hasTSFileExtension);
    }
    listFiles(directory = "/") {
        directory = ts.ensureTrailingDirectorySeparator(directory);
        return directory === "/"
            ? Object.keys(__classPrivateFieldGet(this, _Package_files, "f"))
            : Object.keys(__classPrivateFieldGet(this, _Package_files, "f")).filter((f) => f.startsWith(directory));
    }
    mergedWithTypes(typesPackage) {
        const files = { ...__classPrivateFieldGet(this, _Package_files, "f"), ...__classPrivateFieldGet(typesPackage, _Package_files, "f") };
        return new Package(files, this.packageName, this.packageVersion, this.resolvedUrl, {
            packageName: typesPackage.packageName,
            packageVersion: typesPackage.packageVersion,
            resolvedUrl: typesPackage.resolvedUrl,
        });
    }
}
_Package_files = new WeakMap();
export async function createPackageFromNpm(packageSpec, { definitelyTyped = true, ...options } = {}) {
    const parsed = parsePackageSpec(packageSpec);
    if (parsed.status === "error") {
        throw new Error(parsed.error);
    }
    const packageName = parsed.data.name;
    const typesPackageName = ts.getTypesPackageName(packageName);
    const { tarballUrl, packageVersion } = parsed.data.versionKind === "none" && typeof definitelyTyped === "string"
        ? await resolveImplementationPackageForTypesPackage(typesPackageName, definitelyTyped, options)
        : await getNpmTarballUrl([parsed.data], options);
    const pkg = await createPackageFromTarballUrl(tarballUrl);
    if (!definitelyTyped || pkg.containsTypes()) {
        return pkg;
    }
    let typesPackageData;
    if (definitelyTyped === true) {
        typesPackageData = await resolveTypesPackageForPackage(packageName, packageVersion, options);
    }
    else {
        typesPackageData = await getNpmTarballUrl([
            {
                name: typesPackageName,
                versionKind: valid(definitelyTyped) ? "exact" : validRange(definitelyTyped) ? "range" : "tag",
                version: definitelyTyped,
            },
        ], options);
    }
    if (typesPackageData) {
        return pkg.mergedWithTypes(await createPackageFromTarballUrl(typesPackageData.tarballUrl));
    }
    return pkg;
}
export async function resolveImplementationPackageForTypesPackage(typesPackageName, typesPackageVersion, options) {
    if (!typesPackageName.startsWith("@types/")) {
        throw new Error(`'resolveImplementationPackageForTypesPackage' expects an @types package name and version`);
    }
    const packageName = ts.unmangleScopedPackageName(typesPackageName.slice("@types/".length));
    const version = valid(typesPackageVersion);
    if (version) {
        return getNpmTarballUrl([
            parsePackageSpec(`${packageName}@${major(version)}.${minor(version)}`).data,
            parsePackageSpec(`${packageName}@${major(version)}`).data,
            parsePackageSpec(`${packageName}@latest`).data,
        ], options);
    }
    const range = validRange(typesPackageVersion);
    if (range) {
        return getNpmTarballUrl([
            { name: packageName, versionKind: "range", version: range },
            { name: packageName, versionKind: "tag", version: "latest" },
        ], options);
    }
    throw new Error(`'resolveImplementationPackageForTypesPackage' expects a valid SemVer version or range`);
}
export async function resolveTypesPackageForPackage(packageName, packageVersion, options) {
    const typesPackageName = ts.getTypesPackageName(packageName);
    try {
        return await getNpmTarballUrl([
            {
                name: typesPackageName,
                versionKind: "range",
                version: `${major(packageVersion)}.${minor(packageVersion)}`,
            },
            {
                name: typesPackageName,
                versionKind: "range",
                version: `${major(packageVersion)}`,
            },
            {
                name: typesPackageName,
                versionKind: "tag",
                version: "latest",
            },
        ], options);
    }
    catch { }
}
async function getNpmTarballUrl(packageSpecs, { before, allowDeprecated } = {}) {
    var _a, _b, _c;
    const fetchPackument = packageSpecs.some((spec) => spec.versionKind === "range" || (spec.versionKind === "tag" && spec.version !== "latest"));
    const packumentUrl = `https://registry.npmjs.org/${packageSpecs[0].name}`;
    const includeTimes = before !== undefined && packageSpecs.some((spec) => spec.versionKind !== "exact");
    const Accept = includeTimes ? "application/json" : "application/vnd.npm.install-v1+json";
    const packument = fetchPackument
        ? await fetch(packumentUrl, { headers: { Accept } }).then((r) => r.json())
        : undefined;
    for (const packageSpec of packageSpecs) {
        const manifestUrl = `https://registry.npmjs.org/${packageSpec.name}/${packageSpec.version || "latest"}`;
        const doc = packument || (await fetch(manifestUrl).then((r) => r.json()));
        if (typeof doc !== "object" || (doc.error && doc.error !== "Not found")) {
            throw new Error(`Unexpected response from ${manifestUrl}: ${JSON.stringify(doc)}`);
        }
        const isManifest = !!doc.version;
        let tarballUrl, packageVersion;
        if (packageSpec.versionKind === "range") {
            packageVersion =
                doc.versions &&
                    maxSatisfying(Object.keys(doc.versions).filter((v) => (allowDeprecated || !doc.versions[v].deprecated) &&
                        (!before || !doc.time || new Date(doc.time[v]) <= before)), packageSpec.version);
            if (!packageVersion) {
                continue;
            }
            tarballUrl = doc.versions[packageVersion].dist.tarball;
        }
        else if (packageSpec.versionKind === "tag" && packageSpec.version !== "latest") {
            packageVersion = doc["dist-tags"][packageSpec.version];
            if (!packageVersion) {
                continue;
            }
            if (before && doc.time && new Date(doc.time[packageVersion]) > before) {
                continue;
            }
            tarballUrl = doc.versions[packageVersion].dist.tarball;
        }
        else if (isManifest) {
            packageVersion = doc.version;
            tarballUrl = (_a = doc.dist) === null || _a === void 0 ? void 0 : _a.tarball;
        }
        else {
            packageVersion = (_b = doc["dist-tags"]) === null || _b === void 0 ? void 0 : _b.latest;
            tarballUrl = (_c = doc.versions) === null || _c === void 0 ? void 0 : _c[packageVersion].dist.tarball;
        }
        if (packageVersion && tarballUrl) {
            return { packageName: packageSpec.name, packageVersion, tarballUrl };
        }
    }
    throw new Npm404Error(packageSpecs);
}
export class Npm404Error extends Error {
    constructor(packageSpecs) {
        super(`Failed to find a matching version for ${packageSpecs[0].name}`);
        this.packageSpecs = packageSpecs;
        this.kind = "Npm404Error";
    }
}
export async function createPackageFromTarballUrl(tarballUrl) {
    const tarball = await fetchTarball(tarballUrl);
    const { files, packageName, packageVersion } = extractTarball(tarball);
    return new Package(files, packageName, packageVersion, tarballUrl);
}
async function fetchTarball(tarballUrl) {
    return new Uint8Array((await fetch(tarballUrl).then((r) => r.arrayBuffer())));
}
export function createPackageFromTarballData(tarball) {
    const { files, packageName, packageVersion } = extractTarball(tarball);
    return new Package(files, packageName, packageVersion);
}
function extractTarball(tarball) {
    var _a;
    // Use streaming API to work around https://github.com/101arrowz/fflate/issues/207
    let unzipped;
    new Gunzip((chunk) => (unzipped = chunk)).push(tarball, /*final*/ true);
    const data = untar(unzipped);
    const prefix = data[0].filename.substring(0, data[0].filename.indexOf("/") + 1);
    const packageJsonText = (_a = data.find((f) => f.filename === `${prefix}package.json`)) === null || _a === void 0 ? void 0 : _a.fileData;
    const packageJson = JSON.parse(new TextDecoder().decode(packageJsonText));
    const packageName = packageJson.name;
    const packageVersion = packageJson.version;
    const files = data.reduce((acc, file) => {
        acc[ts.combinePaths("/node_modules/" + packageName, file.filename.substring(prefix.length))] = file.fileData;
        return acc;
    }, {});
    return { files, packageName, packageVersion };
}
//# sourceMappingURL=createPackage.js.map