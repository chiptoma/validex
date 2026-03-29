import { toIterable } from "@braidai/lang/functional/iterable/intrinsicIterator";
/**
 * Returns an iterable which iterates over a given slice of an array in place.
 */
export function slice(array, start, end = array.length) {
    return toIterable(function* () {
        for (let ii = start; ii < end; ++ii) {
            yield array[ii];
        }
    }());
}
//# sourceMappingURL=slice.js.map