import type { Comparator } from "@braidai/lang/comparator";
/**
 * Applies the generic `bisect` algorithm to search an array for the lower bound of a given value.
 */
export declare function arrayBisect<Type extends Value, Value>(array: Type[], value: Value, comparator: Comparator<Value>): number;
//# sourceMappingURL=arrayBisect.d.ts.map