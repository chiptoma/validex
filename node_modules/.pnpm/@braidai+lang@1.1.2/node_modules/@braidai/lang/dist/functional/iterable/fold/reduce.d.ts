/**
 * Eagerly iterates the given iterable, invoking the reducer for each element in the iterable.
 * Uses the previous result as the first parameter and the current value as the second.
 */
export declare const reduce: <Type, Result = Type>(iterable: Iterable<Type>, initial: Result, reducer: (accumulator: Result, value: Type, index: number) => Result) => Result;
//# sourceMappingURL=reduce.d.ts.map