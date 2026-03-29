/**
 * Similar to `reduce`. It invokes an operation over each element of an array, passing the previous
 * result as the first parameter of the next invocation. If the iterable is empty then `identity`
 * will be returned as default value.
 */
export declare function foldAsync<Type, Identity = never>(iterable: AsyncIterable<Type>, identity: Identity, operation: (left: Type, right: Type) => Type | PromiseLike<Type>): Promise<Type | Identity>;
//# sourceMappingURL=fold.d.ts.map