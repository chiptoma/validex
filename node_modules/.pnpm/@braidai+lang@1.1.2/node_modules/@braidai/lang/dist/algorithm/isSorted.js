import { every } from "@braidai/lang/functional/iterable/fold/every";
import { scan } from "@braidai/lang/functional/iterable/scan";
import { shift } from "@braidai/lang/functional/iterable/shift";
/**
 * Determines whether an iterable is sorted according to a comparator.
 */
export function isSorted(iterable, comparator) {
    const { head, rest } = shift(iterable);
    if (rest) {
        const initial = [null, head];
        const pairs = scan(rest, initial, (prev, curr) => [prev[1], curr]);
        return every(pairs, ([left, right]) => comparator(left, right) <= 0);
    }
    return true;
}
//# sourceMappingURL=isSorted.js.map