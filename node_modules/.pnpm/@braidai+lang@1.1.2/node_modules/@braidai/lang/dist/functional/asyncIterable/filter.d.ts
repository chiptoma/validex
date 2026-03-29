import type { LooseIndexedPredicate } from "@braidai/lang/functional/iterable/filter";
import type { IndexedPredicateAs } from "@braidai/lang/predicate";
import type { BooleanConvertible, Truthy } from "@braidai/lang/types";
/**
 * Iterates the iterable, and emits only truthy elements.
 */
export declare function filterAsync<Type extends BooleanConvertible>(asyncIterable: AsyncIterable<Type>): AsyncIterable<Truthy<Type>>;
/**
 * Iterates the iterable, emitting only elements which pass the predicate. You can use the type
 * guard to affect the type of the resulting iterator.
 */
export declare function filterAsync<Type, Filter extends Type>(asyncIterable: AsyncIterable<Type>, predicate: IndexedPredicateAs<Type, Filter>): AsyncIterable<Filter>;
/**
 * Iterates the iterable, emitting only elements which pass the predicate.
 */
export declare function filterAsync<Type>(asyncIterable: AsyncIterable<Type>, predicate: LooseIndexedPredicate<Type>): AsyncIterable<Type>;
//# sourceMappingURL=filter.d.ts.map