import ts from "typescript";
export interface Export {
    name: string;
    node: ts.Node;
}
export declare function getProbableExports(sourceFile: ts.SourceFile): Export[];
//# sourceMappingURL=getProbableExports.d.ts.map