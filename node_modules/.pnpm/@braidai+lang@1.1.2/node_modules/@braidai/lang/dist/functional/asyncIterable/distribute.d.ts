/**
 * Applies a transformation function to the given iterable with applied concurrency. Note that the
 * order of the returned iterable may not match the order of the input iterable.
 */
export declare function distribute<Type, Result = Type>(iterable: AsyncIterable<Type>, concurrency: number, transform: (iterable: AsyncIterable<Type>) => AsyncIterable<Result>): AsyncIterable<Result>;
//# sourceMappingURL=distribute.d.ts.map