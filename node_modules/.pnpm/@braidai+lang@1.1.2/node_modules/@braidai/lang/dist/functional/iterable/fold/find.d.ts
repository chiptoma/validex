import type { LooseIndexedPredicate } from "@braidai/lang/functional/iterable/filter";
import type { IndexedPredicateAs } from "@braidai/lang/predicate";
interface Find {
    /**
     * Returns the first element of an iterable that matches the predicate or `undefined` if there is no
     * match.
     */
    <Type, Matched extends Type>(iterable: Iterable<Type>, predicate: IndexedPredicateAs<Type, Matched>): Matched | undefined;
    <Type>(iterable: Iterable<Type>, predicate: LooseIndexedPredicate<Type>): Type | undefined;
}
export declare const find: Find;
export {};
//# sourceMappingURL=find.d.ts.map