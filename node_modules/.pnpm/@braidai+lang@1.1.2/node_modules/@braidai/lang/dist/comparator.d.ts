/**
 * Comparator for two values. If the values are equal it must return 0, if `left` is less than
 * `right` then it must return a value less than 0, and otherwise it returns a value greater than 0.
 */
export type Comparator<Type> = (left: Type, right: Type) => number;
/**
 * Returns a comparator which combines the results of any number of comparators, short-circuiting
 * from left to right.
 */
export declare function compositeComparator<Type>(comparators: Iterable<Comparator<Type>>): Comparator<Type>;
/**
 * Inverts the given comparator.
 */
export declare function invertedComparator<Type>(comparator: Comparator<Type>): Comparator<Type>;
/**
 * Creates a comparator from a mapping function and a comparator.
 */
export declare function mappedComparator<Type, Result>(comparator: Comparator<Result>, map: (value: Type) => Result): Comparator<Type>;
type PrimitiveComparable = bigint | boolean | string;
/**
 * A comparator which can be used mainly for strings, but also bigint / booleans if you feel the
 * need for that kind of thing. You could use it for numbers too, but that's better suited to
 * `numeric` so the types don't permit it in that case.
 */
export declare function primitiveComparator<Type extends PrimitiveComparable>(left: Type, right: Type): number;
export declare const invertedPrimitiveComparator: <Type extends PrimitiveComparable>(left: Type, right: Type) => number;
export declare function mappedPrimitiveComparator<Type>(map: (value: Type) => PrimitiveComparable): Comparator<Type>;
export declare function mappedInvertedPrimitiveComparator<Type>(map: (value: Type) => PrimitiveComparable): Comparator<Type>;
/**
 * Comparator for numeric types.
 */
export declare function numericComparator(left: number, right: number): number;
export declare const invertedNumericComparator: Comparator<number>;
export declare function mappedNumericComparator<Type>(map: (value: Type) => number): Comparator<Type>;
export declare function mappedInvertedNumericComparator<Type>(map: (value: Type) => number): Comparator<Type>;
export {};
//# sourceMappingURL=comparator.d.ts.map