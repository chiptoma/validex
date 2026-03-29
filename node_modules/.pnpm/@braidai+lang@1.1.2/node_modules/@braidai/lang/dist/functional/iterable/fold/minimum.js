import { fold } from "./fold.js";
/**
 * Returns the minimum item in an iterable based on a comparator.
 */
export function minimum(iterable, comparator) {
    return fold(iterable, undefined, (left, right) => comparator(left, right) > 0 ? right : left);
}
//# sourceMappingURL=minimum.js.map