import type { IndexedPredicate, IndexedPredicateAs } from "@braidai/lang/predicate";
/**
 * Iterates the iterable, omitting elements which pass the predicate. You can use the type guard to
 * affect the type of the resulting iterator.
 */
export declare function rejectAsync<Type, Reject extends Type>(asyncIterable: AsyncIterable<Type>, predicate: IndexedPredicateAs<Type, Reject>): AsyncIterable<Exclude<Type, Reject>>;
/**
 * Iterates the iterable, omitting elements which pass the predicate.
 */
export declare function rejectAsync<Type>(asyncIterable: AsyncIterable<Type>, predicate: IndexedPredicate<Type>): AsyncIterable<Type>;
//# sourceMappingURL=reject.d.ts.map