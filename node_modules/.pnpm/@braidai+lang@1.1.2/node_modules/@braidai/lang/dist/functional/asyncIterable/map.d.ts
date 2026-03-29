/**
 * Applies a given function to an async iterable.
 */
export declare function mapAsync<Type, Result>(asyncIterable: AsyncIterable<Type>, callback: (value: Type) => Result | PromiseLike<Result>): AsyncIterable<Result>;
/**
 * Applies a given async function to an async or sync iterable.
 */
export declare function mapAsync<Type, Result>(asyncIterable: AsyncIterable<Type> | Iterable<Result>, callback: (value: Type) => PromiseLike<Result>): AsyncIterable<Result>;
//# sourceMappingURL=map.d.ts.map