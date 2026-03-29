import type { Predicate } from "@braidai/lang/predicate";
/**
 * Reorder the elements such that elements matching `predicate` are first. Relative order of
 * elements is preserved.
 */
export declare function stablePartition<Type>(array: Type[], predicate: Predicate<Type>, first?: number, last?: number): number;
//# sourceMappingURL=stablePartition.d.ts.map