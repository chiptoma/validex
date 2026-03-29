import type { IndexedPredicateAs } from "@braidai/lang/predicate";
import type { BooleanConvertible, Truthy } from "@braidai/lang/types";
/** Do not explicitly use this! */
export type LooseIndexedPredicate<Type> = (value: Type, index: number) => BooleanConvertible;
interface Filter {
    /**
     * Iterates the iterable, and emits only truthy elements.
     */
    <Type extends BooleanConvertible>(iterable: Iterable<Type>): Iterable<Truthy<Type>>;
    /**
     * Iterates the iterable, emitting only elements which pass the predicate. You can use the type
     * guard to affect the type of the resulting iterator.
     */
    <Type, Filter extends Type>(iterable: Iterable<Type>, predicate: IndexedPredicateAs<Type, Filter>): Iterable<Filter>;
    /**
     * Iterates the iterable, emitting only elements which pass the predicate.
     */
    <Type>(iterable: Iterable<Type>, predicate: LooseIndexedPredicate<Type>): Iterable<Type>;
}
export declare const filter: Filter;
export {};
//# sourceMappingURL=filter.d.ts.map