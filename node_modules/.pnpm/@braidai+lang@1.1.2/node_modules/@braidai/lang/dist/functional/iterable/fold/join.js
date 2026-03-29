import { fold } from "./fold.js";
/**
 * Eagerly iterates the iterable, joining the results with the given separator.
 */
export function join(iterable, separator = "") {
    return fold(iterable, "", (left, right) => `${left}${separator}${right}`);
}
//# sourceMappingURL=join.js.map