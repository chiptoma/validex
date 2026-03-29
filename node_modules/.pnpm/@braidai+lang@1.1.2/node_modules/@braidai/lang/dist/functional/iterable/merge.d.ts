import type { Comparator } from "@braidai/lang/comparator";
/**
 * Merges any number of sorted iterables into a single sorted iterable, using `comparator` to
 * determine the order.
 */
export declare function merge<Type>(comparator: Comparator<Type>, ...iterables: Iterable<Type>[]): Iterable<Type>;
//# sourceMappingURL=merge.d.ts.map