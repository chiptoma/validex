import type { Package } from "../createPackage.js";
import { type CompilerHosts } from "./multiCompilerHost.js";
import type { BuildTool, EntrypointInfo, ModuleKind, ResolutionOption } from "../types.js";
import type { CheckPackageOptions } from "../checkPackage.js";
export declare function getEntrypointInfo(packageName: string, fs: Package, hosts: CompilerHosts, options: CheckPackageOptions | undefined): Record<string, EntrypointInfo>;
export declare function getBuildTools(packageJson: any): Partial<Record<BuildTool, string>>;
export declare function getModuleKinds(entrypoints: Record<string, EntrypointInfo>, resolutionOption: ResolutionOption, hosts: CompilerHosts): Record<string, ModuleKind>;
//# sourceMappingURL=getEntrypointInfo.d.ts.map