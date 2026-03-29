/**
 * Given a vector of async iterables this returns a new async iterable which yields the results of
 * the underlying iterables as they come in.
 */
export declare function collect<Type>(iterables: readonly AsyncIterable<Type>[]): AsyncIterable<Type>;
//# sourceMappingURL=collect.d.ts.map