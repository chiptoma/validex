import type { LooseIndexedPredicate } from "@braidai/lang/functional/iterable/filter";
import type { BooleanConvertible } from "@braidai/lang/types";
interface Every {
    /**
     * Returns `true` if the predicate is truthy for all elements, otherwise `false`. Eagerly iterates
     * the whole iterable until a falsey value is found.
     */
    (iterable: Iterable<BooleanConvertible>): boolean;
    <Type>(iterable: Iterable<Type>, predicate: LooseIndexedPredicate<Type>): boolean;
}
export declare const every: Every;
export {};
//# sourceMappingURL=every.d.ts.map