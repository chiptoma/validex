import { toIterable } from "./intrinsicIterator.js";
/**
 * Returns the first element from an iterable, as well as another iterable that will continue after
 * the shifted element.
 */
export function shift(iterable) {
    const iterator = iterable[Symbol.iterator]();
    const { done, value } = iterator.next();
    if (done) {
        return {
            head: undefined,
            rest: undefined,
        };
    }
    else {
        return {
            head: value,
            rest: toIterable(iterator),
        };
    }
}
//# sourceMappingURL=shift.js.map