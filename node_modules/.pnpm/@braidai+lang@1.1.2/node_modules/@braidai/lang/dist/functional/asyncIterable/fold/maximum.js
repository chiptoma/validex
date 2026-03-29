import { foldAsync } from "./fold.js";
/**
 * Returns the maximum item in an async iterable based on a comparator.
 */
export function maximumAsync(iterable, comparator) {
    return foldAsync(iterable, undefined, (left, right) => comparator(left, right) > 0 ? left : right);
}
//# sourceMappingURL=maximum.js.map