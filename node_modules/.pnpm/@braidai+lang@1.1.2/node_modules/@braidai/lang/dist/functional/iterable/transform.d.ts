/**
 * Similar to `map` except the mapper returns an iterable which delegates to the result.
 */
export declare const transform: <Type, Result>(iterable: Iterable<Type>, callback: (value: Type, index: number) => Iterable<Result>) => Iterable<Result>;
//# sourceMappingURL=transform.d.ts.map