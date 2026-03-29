import { bisect } from "./bisect.js";
/**
 * Applies the generic `bisect` algorithm to search an array for the lower bound of a given value.
 */
export function arrayBisect(array, value, comparator) {
    return bisect(0, array.length, (left, right) => (left + right) >> 1, ii => comparator(array[ii], value));
}
//# sourceMappingURL=arrayBisect.js.map