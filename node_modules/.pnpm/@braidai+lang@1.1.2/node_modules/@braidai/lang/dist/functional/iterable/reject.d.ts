import type { IndexedPredicate, IndexedPredicateAs } from "@braidai/lang/predicate";
/**
 * Iterates the iterable, omitting elements which pass the predicate. You can use the type guard to
 * affect the type of the resulting iterator.
 */
export declare function reject<Type, Reject extends Type>(iterable: Iterable<Type>, predicate: IndexedPredicateAs<Type, Reject>): Iterable<Exclude<Type, Reject>>;
/**
 * Iterates the iterable, omitting elements which pass the predicate.
 */
export declare function reject<Type>(iterable: Iterable<Type>, predicate: IndexedPredicate<Type>): Iterable<Type>;
//# sourceMappingURL=reject.d.ts.map