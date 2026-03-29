/**
 * Applies a given async function to an iterable, and returns a promise to an array of the results.
 */
export declare function mapAwait<Type, Result>(iterable: Iterable<Type>, callback: (value: Type) => Result | PromiseLike<Result>): Promise<Result[]>;
//# sourceMappingURL=mapAwait.d.ts.map