import { fold } from "./fold.js";
/**
 * Returns the maximum item in an iterable based on a comparator.
 */
export function maximum(iterable, comparator) {
    return fold(iterable, undefined, (left, right) => comparator(left, right) > 0 ? left : right);
}
//# sourceMappingURL=maximum.js.map