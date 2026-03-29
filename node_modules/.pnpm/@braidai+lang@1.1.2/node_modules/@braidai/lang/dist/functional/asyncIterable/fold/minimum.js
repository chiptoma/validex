import { foldAsync } from "./fold.js";
/**
 * Returns the minimum item in an async iterable based on a comparator.
 */
export async function minimumAsync(iterable, comparator) {
    return foldAsync(iterable, undefined, (left, right) => comparator(left, right) > 0 ? right : left);
}
//# sourceMappingURL=minimum.js.map