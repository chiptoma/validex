/**
 * Creates an iterable which applies the accumulator to each element and yields the result. This
 * operation is very similar to `reduce` except instead of returning the final result, it yields
 * each intermediate result.
 */
export function* scan(iterable, initial, accumulator) {
    let result = initial;
    for (const value of iterable) {
        result = accumulator(result, value);
        yield result;
    }
}
//# sourceMappingURL=scan.js.map