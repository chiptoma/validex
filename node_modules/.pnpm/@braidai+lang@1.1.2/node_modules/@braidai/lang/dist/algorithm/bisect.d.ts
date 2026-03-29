/**
 * Generic bisect algorithm. Returns the first value which compares >= 0 in the range created
 * between `first` and `last`.
 */
export declare function bisect<Type>(first: Type, last: Type, divide: (low: Type, high: Type) => Type, boundComparator: (value: Type) => number): Type;
//# sourceMappingURL=bisect.d.ts.map