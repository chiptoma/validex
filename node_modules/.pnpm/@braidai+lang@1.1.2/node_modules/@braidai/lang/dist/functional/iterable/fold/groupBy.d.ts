/**
 * Simple utility which groups the given entry iterable by the key and returns a `Map` of the
 * results.
 */
export declare function groupBy<Key, Value>(entries: Iterable<readonly [Key, Value]>): Map<Key, Value[]>;
export declare function groupBy<Type, Key, Value>(entries: Iterable<Type>, mapper: (entry: Type) => readonly [Key, Value]): Map<Key, Value[]>;
//# sourceMappingURL=groupBy.d.ts.map