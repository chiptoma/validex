/**
 * Computes the sum of an iterable of numbers. Sure you could do it with reduce this is easier to
 * use.
 */
export declare function accumulate(iterable: Iterable<number>): number;
export declare function accumulate<Type>(iterable: Iterable<Type>, mapper: (value: Type) => number): number;
//# sourceMappingURL=accumulate.d.ts.map