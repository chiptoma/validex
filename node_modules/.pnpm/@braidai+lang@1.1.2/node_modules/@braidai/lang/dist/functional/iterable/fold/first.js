import { shift } from "@braidai/lang/functional/iterable/shift";
/**
 * Returns the first matching element of the iterable, discarding the rest.
 */
export function first(iterable) {
    const { head, rest } = shift(iterable);
    rest?.[Symbol.iterator]().return?.();
    return head;
}
//# sourceMappingURL=first.js.map