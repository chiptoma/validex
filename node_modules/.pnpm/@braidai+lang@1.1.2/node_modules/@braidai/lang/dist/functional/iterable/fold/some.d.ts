import type { LooseIndexedPredicate } from "@braidai/lang/functional/iterable/filter";
import type { BooleanConvertible } from "@braidai/lang/types";
interface Some {
    /**
     * Returns `true` if the predicate is truthy for any element, otherwise `false`. Eagerly iterates
     * the whole iterable until a truthy value is found.
     */
    (iterable: Iterable<BooleanConvertible>): boolean;
    <Type>(iterable: Iterable<Type>, predicate: LooseIndexedPredicate<Type>): boolean;
}
export declare const some: Some;
export {};
//# sourceMappingURL=some.d.ts.map