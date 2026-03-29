/**
 * Returns an iterator which proxies the given generator, requesting up to `count` elements in
 * advance. If you break out of this loop there will be abandoned values!
 */
export declare function lookAhead<Type>(iterable: AsyncIterable<Type>, count?: number): AsyncIterable<Type>;
//# sourceMappingURL=lookAhead.d.ts.map