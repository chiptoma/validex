import { fold } from "@braidai/lang/functional/iterable/fold/fold";
/**
 * Returns a comparator which combines the results of any number of comparators, short-circuiting
 * from left to right.
 */
export function compositeComparator(comparators) {
    return fold(comparators, () => 0, (comparator, next) => (left, right) => comparator(left, right) || next(left, right));
}
/**
 * Inverts the given comparator.
 */
export function invertedComparator(comparator) {
    return (left, right) => comparator(right, left);
}
/**
 * Creates a comparator from a mapping function and a comparator.
 */
export function mappedComparator(comparator, map) {
    return (left, right) => comparator(map(left), map(right));
}
/**
 * A comparator which can be used mainly for strings, but also bigint / booleans if you feel the
 * need for that kind of thing. You could use it for numbers too, but that's better suited to
 * `numeric` so the types don't permit it in that case.
 */
export function primitiveComparator(left, right) {
    return left < right ? -1 : left === right ? 0 : 1;
}
export const invertedPrimitiveComparator = invertedComparator(primitiveComparator);
export function mappedPrimitiveComparator(map) {
    return mappedComparator(primitiveComparator, map);
}
export function mappedInvertedPrimitiveComparator(map) {
    return mappedComparator(invertedPrimitiveComparator, map);
}
/**
 * Comparator for numeric types.
 */
export function numericComparator(left, right) {
    return left - right;
}
export const invertedNumericComparator = invertedComparator(numericComparator);
export function mappedNumericComparator(map) {
    return mappedComparator(numericComparator, map);
}
export function mappedInvertedNumericComparator(map) {
    return mappedComparator(invertedNumericComparator, map);
}
//# sourceMappingURL=comparator.js.map